import os

# Belt-and-suspenders before chromadb import (some versions read env at import time)
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

import chromadb
from chromadb.config import Settings

# Initialize ChromaDB client (telemetry off: avoids noisy logs; compatible with Chroma's PostHog usage)
os.makedirs("./chroma_data", exist_ok=True)
_chroma_settings = Settings(anonymized_telemetry=False)
chroma_client = chromadb.PersistentClient(path="./chroma_data", settings=_chroma_settings)

collection_name = "research_documents"

def get_collection():
    return chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )

def add_documents_to_vectorstore(user_id: str, doc_id: str, filename: str, chunks: list[str], embeddings: list[list[float]]):
    collection = get_collection()
    
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"user_id": user_id, "doc_id": doc_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
    
    # Add to ChromaDB
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )

def search_similar_documents(user_id: str, query_embedding: list[float], doc_id: str = None, n_results: int = 5):
    collection = get_collection()
    
    where_clause = {"user_id": user_id}
    if doc_id:
        where_clause = {"$and": [{"user_id": user_id}, {"doc_id": doc_id}]}
        
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=where_clause
    )
    
    return results

def get_document_chunks(user_id: str, doc_id: str) -> list[str]:
    collection = get_collection()
    results = collection.get(
        where={"$and": [{"user_id": user_id}, {"doc_id": doc_id}]}
    )
    if not results or not results['documents']:
        return []
    
    # Sort by chunk_index
    docs_with_idx = zip(results['documents'], [m['chunk_index'] for m in results['metadatas']])
    sorted_docs = sorted(docs_with_idx, key=lambda x: x[1])
    return [doc for doc, idx in sorted_docs]
