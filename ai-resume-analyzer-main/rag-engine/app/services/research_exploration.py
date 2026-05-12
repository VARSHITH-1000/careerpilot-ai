import requests
import json
import time
import logging
from typing import List, Dict, Any
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser
from app.services.research_analytics import _call_llm_with_fallback
from app.services.resilience import cache, ss_throttler, retry_with_backoff

logger = logging.getLogger(__name__)

@retry_with_backoff(attempts=3)
def fetch_papers_with_backoff(query: str, limit: int = 15) -> list:
    """Fetch papers from Semantic Scholar with exponential backoff and throttling."""
    ss_throttler.wait()
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "limit": limit,
        "fields": "title,abstract,authors,year,url,citationCount,openAccessPdf"
    }
    
    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()
    data = response.json()
    
    papers = []
    for paper in data.get("data", []):
        abstract = paper.get("abstract")
        if not abstract:
            continue
        pdf_url = ""
        if paper.get("openAccessPdf"):
            pdf_url = paper["openAccessPdf"].get("url", "")
        papers.append({
            "id": paper.get("paperId", ""),
            "title": paper.get("title", "Unknown Title"),
            "abstract": abstract[:800],
            "year": paper.get("year") or "Unknown",
            "authors": [a.get("name") for a in paper.get("authors", [])][:3],
            "url": paper.get("url", "") or pdf_url,
            "citationCount": paper.get("citationCount", 0)
        })
    return papers


def explore_global_topic(query: str) -> dict:
    """
    Search for related academic papers and generate an intelligence report.
    Returns partial results if AI analysis fails.
    """
    # Check cache for the full report
    cache_key = {"query": query}
    cached_report = cache.get("global_exploration", cache_key)
    if cached_report:
        logger.info(f"Returning cached exploration report for: {query}")
        return cached_report

    # Step 1: Fetch papers (with caching for the search itself)
    papers_cache = cache.get("explore_papers", cache_key)
    if papers_cache:
        papers = papers_cache
    else:
        try:
            papers = fetch_papers_with_backoff(query)
            if papers:
                cache.set("explore_papers", cache_key, papers, ttl=3600 * 6)
        except Exception as e:
            logger.error(f"Failed to fetch papers: {e}")
            return {"error": f"Failed to fetch research papers: {str(e)}", "papers": []}
    
    if not papers:
        return {"error": "No papers found for this topic. Try a different search query.", "papers": []}

    intelligence_report = {
        "papers": papers,
        "foundational_papers": [],
        "latest_advancements": [],
        "research_gaps": [],
        "methodology_chain": [],
        "trend_evolution": []
    }

    # Step 2: LLM Analysis with Fallback
    try:
        papers_json = json.dumps(papers[:10])  # Use top 10 for LLM analysis
        
        template = """You are an elite AI Research Scientist. Analyze these academic papers on: "{query}".

Papers:
{papers_json}

Generate a JSON object with EXACTLY this schema (no extra fields):
{{
  "foundational_papers": [
    {{"title": "...", "year": 2020, "url": "...", "reason": "Why foundational"}}
  ],
  "latest_advancements": [
    {{"title": "...", "year": 2024, "url": "...", "innovation": "What is new"}}
  ],
  "research_gaps": [
    {{"area": "Gap name", "description": "Detailed gap description", "severity": "high|medium|low"}}
  ],
  "methodology_chain": [
    {{"paper_title": "Short title", "methodology": "Method used", "effectiveness": 85, "problems": "Bottlenecks or limitations of this approach"}}
  ],
  "trend_evolution": [
    {{"period": "2018-2020", "focus": "What research focused on"}},
    {{"period": "2021-Present", "focus": "Current focus"}}
  ]
}}

Output ONLY raw JSON. No markdown code fences.
JSON:"""

        response_text = _call_llm_with_fallback(
            template, 
            {"query": query, "papers_json": papers_json},
            cache_id="global_exploration_llm"
        )
        
        # Clean up any markdown wrapping
        response_text = response_text.strip()
        for prefix in ["```json", "```"]:
            if response_text.startswith(prefix):
                response_text = response_text[len(prefix):]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        parsed = json.loads(response_text.strip())
        intelligence_report.update(parsed)
        
        # Cache the full successful report
        cache.set("global_exploration", cache_key, intelligence_report, ttl=3600 * 24)

    except Exception as e:
        logger.warning(f"LLM analysis failed, returning papers only: {e}")
        # Partial result: we have the papers, just not the AI analysis
        intelligence_report["partial"] = True
        intelligence_report["note"] = "AI analysis is currently unavailable due to rate limits, but here are the relevant papers."

    return intelligence_report
