from sentence_transformers import SentenceTransformer
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from app.config import settings
from app.services.resilience import cache, retry_with_backoff, MODEL_PRIORITY
import logging

logger = logging.getLogger(__name__)

# Load embedding model once globally
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embeddings(texts: list[str]) -> list[list[float]]:
    # Cache embeddings for identical text lists
    cache_key = {"texts": texts}
    cached = cache.get("embeddings", cache_key)
    if cached:
        return cached
        
    embeddings = embedding_model.encode(texts)
    result = embeddings.tolist()
    cache.set("embeddings", cache_key, result)
    return result

def get_query_embedding(query: str) -> list[float]:
    return embedding_model.encode([query])[0].tolist()

def get_llm(model_name: str = None):
    model = model_name or settings.GEMINI_MODEL
    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.3
    )

@retry_with_backoff(attempts=3)
def _invoke_chain(chain, inputs):
    return chain.invoke(inputs)

def generate_rag_response(query: str, context: str, system_prompt: str = None) -> str:
    if not settings.GEMINI_API_KEY:
        return "Error: Gemini API Key is not configured."
    
    # Check cache first
    cache_key = {"query": query, "context": context, "system_prompt": system_prompt}
    cached = cache.get("rag_response", cache_key)
    if cached:
        return cached
        
    if system_prompt:
        template = system_prompt + """\n\nAnswer the question based ONLY on the provided context.
If the answer cannot be found in the context, say "I cannot find the answer in your uploaded documents."
Always cite your sources by referencing the document name or context provided if applicable.

Context:
{context}

Question:
{question}

Answer:"""
    else:
        template = """You are an AI Research Assistant. Answer the question based ONLY on the provided context.
If the answer cannot be found in the context, say "I cannot find the answer in your uploaded documents."
Always cite your sources by referencing the document name or context provided if applicable.

Context:
{context}

Question:
{question}

Answer:"""
    
    prompt = PromptTemplate.from_template(template)
    
    # Try models in priority order
    last_error = None
    models_to_try = [settings.GEMINI_MODEL] + [m for m in MODEL_PRIORITY if m != settings.GEMINI_MODEL]
    
    for model_name in models_to_try:
        try:
            logger.info(f"Attempting RAG with model: {model_name}")
            llm = get_llm(model_name)
            chain = (
                {"context": RunnablePassthrough(), "question": RunnablePassthrough()}
                | prompt
                | llm
                | StrOutputParser()
            )
            
            response = _invoke_chain(chain, {"context": context, "question": query})
            
            # Cache the successful response
            cache.set("rag_response", cache_key, response)
            return response
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {e}")
            last_error = e
            continue
            
    return f"Error: All AI models failed to respond. Last error: {str(last_error)}"
