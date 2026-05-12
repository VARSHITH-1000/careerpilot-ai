from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.db.database import get_db
from app.services.vector_store import search_similar_documents
from app.services.llm import get_query_embedding, generate_rag_response

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    mode: str | None = "general" # 'general', 'explainer', 'interview', 'methodology'
    doc_id: str | None = None
    
@router.post("/")
async def chat_with_documents(
    request: ChatRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = request.query
    mode = request.mode
    doc_id = request.doc_id
    
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    if not doc_id:
        raise HTTPException(status_code=400, detail="A research document must be selected to chat.")
        
    # Generate query embedding
    query_emb = get_query_embedding(query)
    
    # Retrieve similar chunks (Strict isolation per doc_id)
    search_results = search_similar_documents(user_id, query_emb, doc_id=doc_id, n_results=5)
    
    # Format context
    context_parts = []
    citations = []
    
    if search_results and search_results['documents'] and len(search_results['documents'][0]) > 0:
        docs = search_results['documents'][0]
        metadatas = search_results['metadatas'][0]
        
        for i, (doc, meta) in enumerate(zip(docs, metadatas)):
            filename = meta.get('filename', 'Unknown Document')
            context_parts.append(f"--- Document: {filename} ---\n{doc}\n")
            
            # Record citation if not already added
            citation = {"filename": filename, "doc_id": meta.get('doc_id')}
            if citation not in citations:
                citations.append(citation)
    
    context = "\n".join(context_parts)
    
    if not context:
        return {
            "answer": "You haven't uploaded any relevant documents, or no matches were found. Please upload research papers or notes to the Research Library first.",
            "citations": []
        }
    
    # Generate answer with Gemini
    try:
        if mode == "explainer":
            sys_prompt = "You are an expert Research Explainer. Break down the concepts from the provided documents so a beginner can understand them. Use analogies if necessary."
            answer = generate_rag_response(f"Explain this clearly: {query}", context, system_prompt=sys_prompt)
        elif mode == "interview":
            sys_prompt = "You are an expert interviewer. Based on the documents provided, generate tough, insightful interview questions and answers related to the user's query."
            answer = generate_rag_response(f"Generate interview questions for: {query}", context, system_prompt=sys_prompt)
        elif mode == "methodology":
            sys_prompt = "You are an expert research methodologist. Critically analyze the methodology, datasets, and algorithms used in the research context provided."
            answer = generate_rag_response(f"Analyze the methodology for: {query}", context, system_prompt=sys_prompt)
        else:
            answer = generate_rag_response(query, context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")
        
    return {
        "answer": answer,
        "citations": citations
    }
