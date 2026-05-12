from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.auth import get_current_user
from app.db.database import get_db, SessionLocal
from app.db import models
from app.services.document_processing import extract_text_from_pdf, chunk_text
from app.services.vector_store import add_documents_to_vectorstore, get_document_chunks
from app.services.llm import get_embeddings
from app.services.research_analytics import generate_specialized_summary, extract_knowledge_graph, generate_deep_insights, generate_document_analytics
from app.services.paper_discovery import discover_related_papers
import uuid
import json

router = APIRouter()

def process_document_background(user_id: str, doc_id: str, filename: str, text: str):
    db = SessionLocal()
    try:
        # Chunk and embed
        chunks = chunk_text(text)
        embeddings = get_embeddings(chunks)
        
        # Store in ChromaDB
        add_documents_to_vectorstore(user_id, doc_id, filename, chunks, embeddings)
        
        # We take the first few chunks (~5000 chars) for insight generation
        context = "\n".join(chunks[:5])
        
        # Generate deep insights and analytics
        insights = generate_deep_insights(context)
        analytics = generate_document_analytics(context)
        
        # Update metadata in SQLite
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if doc:
            doc.status = "processed"
            doc.insights = json.dumps(insights)
            doc.analytics = json.dumps(analytics)
            db.commit()
    except Exception as e:
        print(f"Background processing error: {e}")
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if doc:
            doc.status = "failed"
            db.commit()
    finally:
        db.close()

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")
        
    doc_id = str(uuid.uuid4())
    
    # Read and parse PDF
    file_bytes = await file.read()
    try:
        text = extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF contains no readable text.")

    # Store initial metadata in SQLite as "processing"
    new_doc = models.Document(
        id=doc_id,
        user_id=user_id,
        filename=file.filename,
        file_type="pdf",
        status="processing"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Process in background
    background_tasks.add_task(process_document_background, user_id, doc_id, file.filename, text)
    
    return {"message": "Document upload started.", "doc_id": doc_id}

@router.get("/")
def list_documents(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(models.Document.user_id == user_id).all()
    # Parse json fields for frontend convenience
    result = []
    for d in docs:
        item = {
            "id": d.id,
            "filename": d.filename,
            "status": d.status,
            "created_at": d.created_at,
            "insights": json.loads(d.insights) if d.insights else {},
            "analytics": json.loads(d.analytics) if d.analytics else {}
        }
        result.append(item)
    return {"documents": result}

@router.get("/analytics")
def get_dashboard_analytics(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(models.Document.user_id == user_id, models.Document.status == "processed").all()
    
    # Aggregate data across all documents
    total_papers = len(docs)
    all_keywords = {}
    all_methodologies = {}
    total_concepts = 0
    
    for doc in docs:
        if doc.analytics:
            try:
                data = json.loads(doc.analytics)
                # Aggregate keywords
                for kw in data.get("keywords", []):
                    text = kw.get("text", "")
                    val = kw.get("value", 0)
                    all_keywords[text] = all_keywords.get(text, 0) + val
                # Aggregate methodologies
                for met in data.get("methodology_distribution", []):
                    name = met.get("name", "")
                    val = met.get("value", 0)
                    all_methodologies[name] = all_methodologies.get(name, 0) + val
                
                total_concepts += len(data.get("concept_clusters", []))
            except:
                pass

    # Format for recharts
    topics = [{"subject": k, "A": v, "fullMark": 150} for k, v in list(all_keywords.items())[:6]]
    methodology = [{"name": k, "value": v} for k, v in list(all_methodologies.items())]
    
    return {
        "stats": {
            "papers_analyzed": total_papers,
            "concepts_mapped": total_concepts,
            "insights_generated": total_papers * 5, # Estimate
            "knowledge_score": 92 # We can leave this fixed or compute it
        },
        "topics": topics,
        "methodologies": methodology
    }

@router.get("/{doc_id}/summary")
def get_document_summary(doc_id: str, type: str = "executive", user_id: str = Depends(get_current_user)):
    chunks = get_document_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document chunks not found.")
    
    # We take the first 3 chunks (~3000 chars) for summary to avoid exceeding token limits if document is too large
    context = "\n".join(chunks[:3])
    
    summary = generate_specialized_summary(context, summary_type=type)
    return {"doc_id": doc_id, "type": type, "summary": summary}

@router.get("/{doc_id}/graph")
def get_document_graph(doc_id: str, user_id: str = Depends(get_current_user)):
    chunks = get_document_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document chunks not found.")
    
    # We take the first 5 chunks for graph extraction
    context = "\n".join(chunks[:5])
    
    graph_data = extract_knowledge_graph(context)
    return {"doc_id": doc_id, "graph": graph_data}

@router.get("/discover")
def discover_papers(query: str = None, doc_id: str = None, limit: int = 5, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    if not query and not doc_id:
        raise HTTPException(status_code=400, detail="Either query or doc_id parameter is required.")
        
    context = ""
    search_query = query
    
    if doc_id:
        # Fetch document chunks and analytics
        chunks = get_document_chunks(user_id, doc_id)
        if chunks:
            context = "\n".join(chunks[:5])
        
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if doc and doc.analytics:
            try:
                analytics = json.loads(doc.analytics)
                keywords = analytics.get("keywords", [])
                if keywords and not search_query:
                    search_query = keywords[0].get("text", "machine learning")
            except:
                pass
                
        if not search_query:
             search_query = "research"

    papers = discover_related_papers(search_query, context, limit)
    return {"query": search_query, "papers": papers}
