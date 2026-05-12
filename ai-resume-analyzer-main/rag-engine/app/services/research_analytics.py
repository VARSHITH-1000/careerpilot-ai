from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
import json
import logging
from app.config import settings
from app.services.resilience import cache, retry_with_backoff, MODEL_PRIORITY

logger = logging.getLogger(__name__)

def get_llm(model_name: str = None):
    if not settings.GEMINI_API_KEY:
        raise ValueError("Gemini API Key is not configured.")
    model = model_name or settings.GEMINI_MODEL
    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.3
    )

@retry_with_backoff(attempts=3)
def _invoke_chain(chain, inputs):
    return chain.invoke(inputs)

def _call_llm_with_fallback(template: str, inputs: dict, cache_id: str = None) -> str:
    """Helper to call LLM with model fallback and caching."""
    if cache_id:
        cached = cache.get(cache_id, inputs)
        if cached:
            return cached

    prompt = PromptTemplate.from_template(template)
    last_error = None
    
    models_to_try = [settings.GEMINI_MODEL] + [m for m in MODEL_PRIORITY if m != settings.GEMINI_MODEL]
    
    for model_name in models_to_try:
        try:
            llm = get_llm(model_name)
            chain = prompt | llm | StrOutputParser()
            response = _invoke_chain(chain, inputs)
            
            if cache_id:
                cache.set(cache_id, inputs, response)
            return response
        except Exception as e:
            logger.warning(f"Model {model_name} failed in {cache_id or 'llm_call'}: {e}")
            last_error = e
            continue
    
    raise last_error or Exception("All models failed")

def generate_specialized_summary(context: str, summary_type: str = "executive") -> str:
    prompts = {
        "executive": "Provide an executive summary of this research paper. Focus on the main problem, methodology, key findings, and high-level impact.",
        "technical": "Provide a detailed technical summary of this research paper. Focus on the algorithms, mathematical formulations, architecture, and specific methodologies used.",
        "interview": "Summarize this paper for a technical interview preparation. Highlight the most important concepts, potential questions a recruiter might ask about this topic, and how this knowledge can be applied in an engineering role.",
        "simple": "Explain this research paper in simple terms for a beginner or high-school student. Use analogies and avoid complex jargon."
    }
    
    instruction = prompts.get(summary_type, prompts["executive"])
    
    template = """You are an AI Research Analyst.
Instruction: {instruction}

Research Context:
{context}

Summary:"""
    
    try:
        return _call_llm_with_fallback(
            template, 
            {"instruction": instruction, "context": context},
            cache_id="specialized_summary"
        )
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def extract_knowledge_graph(context: str) -> dict:
    template = """You are an expert at extracting semantic knowledge graphs from research papers.
Extract the key concepts, entities, and methodologies from the text, and map their relationships.
Output strictly in JSON format as a dictionary with 'nodes' and 'links'.
Each node should have an 'id' and 'group'. Each link should have 'source', 'target', and 'value' (strength from 1-10).
Ensure the JSON is valid and parsable. Do NOT wrap it in markdown block like ```json ... ```. Output raw JSON ONLY.

Research Context:
{context}

JSON Output:"""
    
    try:
        response = _call_llm_with_fallback(template, {"context": context}, cache_id="knowledge_graph")
        response = response.strip()
        for prefix in ["```json", "```"]:
            if response.startswith(prefix):
                response = response[len(prefix):]
        if response.endswith("```"):
            response = response[:-3]
        return json.loads(response.strip())
    except Exception as e:
        logger.error(f"Error parsing JSON for graph: {e}")
        return {"nodes": [], "links": []}

def generate_interview_questions(context: str) -> str:
    template = """You are a senior technical interviewer. Based on the following research paper context, generate 5 challenging interview questions and provide brief bullet points on what an ideal answer should cover.

Research Context:
{context}

Interview Questions:"""
    
    try:
        return _call_llm_with_fallback(template, {"context": context}, cache_id="interview_questions")
    except Exception as e:
        return f"Error generating questions: {str(e)}"

def generate_deep_insights(context: str) -> dict:
    template = """You are an expert AI Research Scientist.
Based on the provided research context, extract deep insights into the following categories:
- core_contributions
- methodology
- technical_innovations
- findings
- limitations
- future_scope
- practical_applications
- domain_relevance

Output strictly in JSON format as a dictionary where keys are exactly the categories above, and values are detailed text strings. 
Do NOT wrap it in markdown block like ```json ... ```. Output raw JSON ONLY.

Research Context:
{context}

JSON Output:"""
    
    try:
        response = _call_llm_with_fallback(template, {"context": context}, cache_id="deep_insights")
        response = response.strip()
        for prefix in ["```json", "```"]:
            if response.startswith(prefix):
                response = response[len(prefix):]
        if response.endswith("```"):
            response = response[:-3]
        return json.loads(response.strip())
    except Exception as e:
        logger.error(f"Error parsing deep insights JSON: {e}")
        return {}

def generate_document_analytics(context: str) -> dict:
    template = """You are a Data Scientist analyzing a research document.
Extract analytics and metrics based on the provided research context. Provide the following:
- keywords: A list of the top 10 keywords/topics with a 'score' (1-100) representing their density or importance. Format: [{{"text": "keyword", "value": score}}, ...]
- methodology_distribution: A breakdown of methodologies used (e.g., Experimental, Theoretical, Review, Simulation) with percentages summing to 100. Format: [{{"name": "type", "value": percentage}}, ...]
- concept_clusters: A list of 5 high-level concepts discussed. Format: ["concept1", "concept2", ...]

Output strictly in JSON format.
Do NOT wrap it in markdown block like ```json ... ```. Output raw JSON ONLY.

Research Context:
{context}

JSON Output:"""
    
    try:
        response = _call_llm_with_fallback(template, {"context": context}, cache_id="doc_analytics")
        response = response.strip()
        for prefix in ["```json", "```"]:
            if response.startswith(prefix):
                response = response[len(prefix):]
        if response.endswith("```"):
            response = response[:-3]
        return json.loads(response.strip())
    except Exception as e:
        logger.error(f"Error parsing document analytics JSON: {e}")
        return {}
