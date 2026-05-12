import requests
import json
import logging
from typing import List, Dict
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser
from app.services.research_analytics import _call_llm_with_fallback
from app.services.resilience import cache, ss_throttler, retry_with_backoff

logger = logging.getLogger(__name__)

@retry_with_backoff(attempts=3)
def _fetch_from_semantic_scholar(query: str, limit: int):
    ss_throttler.wait()
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "limit": limit * 2,
        "fields": "title,abstract,authors,year,url,citationCount"
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()

def discover_related_papers(query: str, context: str = "", limit: int = 5) -> List[Dict]:
    """
    Search for related academic papers using the Semantic Scholar API, and use LLM
    to generate semantic similarity scores and relevance explanations.
    """
    try:
        # Check cache for search results
        cache_key = {"query": query, "limit": limit}
        cached_papers = cache.get("ss_search", cache_key)
        
        if cached_papers:
            data = cached_papers
        else:
            data = _fetch_from_semantic_scholar(query, limit)
            cache.set("ss_search", cache_key, data, ttl=3600 * 12) # Cache for 12 hours
            
        papers = []
        for paper in data.get("data", []):
            abstract = paper.get("abstract")
            if not abstract:
                continue
            papers.append({
                "id": paper.get("paperId"),
                "title": paper.get("title", "Unknown Title"),
                "abstract": abstract,
                "year": paper.get("year", "Unknown Year"),
                "authors": [author.get("name") for author in paper.get("authors", [])],
                "url": paper.get("url", ""),
                "citationCount": paper.get("citationCount", 0)
            })
            if len(papers) >= limit:
                break
        
        if not context or not papers:
            return papers

        # Use LLM with fallback and caching to score and explain
        papers_json = json.dumps(papers)
        template = """You are an AI Research Analyst.
I have a source research document with the following context:
{context}

I also have a list of related papers found online (in JSON format):
{papers_json}

For each related paper, evaluate its relevance to the source document.
Provide an updated JSON array where each object contains the original fields plus:
- "semantic_similarity_score": A score from 0-100 indicating how similar it is to the source document.
- "relevance_explanation": A 1-2 sentence explanation of exactly why this paper is relevant to the source document's methodologies, findings, or domain.

Output STRICTLY the raw JSON array. Do NOT wrap it in markdown.

JSON Output:"""
        
        try:
            response_text = _call_llm_with_fallback(
                template, 
                {"context": context[:3000], "papers_json": papers_json},
                cache_id="paper_scoring"
            )
            
            response_text = response_text.strip()
            for prefix in ["```json", "```"]:
                if response_text.startswith(prefix):
                    response_text = response_text[len(prefix):]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            scored_papers = json.loads(response_text.strip())
            scored_papers.sort(key=lambda x: x.get("semantic_similarity_score", 0), reverse=True)
            return scored_papers
        except Exception as e:
            logger.error(f"Error scoring papers with LLM: {e}")
            return papers

    except Exception as e:
        logger.error(f"Error fetching related papers: {e}")
        return []
