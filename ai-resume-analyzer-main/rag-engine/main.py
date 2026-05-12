"""NEXT AI RAG Engine — run with the project venv: .\\venv\\Scripts\\activate && pip install -r requirements.txt && python main.py"""
import os

# --- Must run before any third-party imports that touch Chroma / ML stacks ---
# Chroma telemetry (PostHog 4+ API mismatch with Chroma 0.5.x callers)
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")
os.environ.setdefault("CHROMADB_ANONYMIZED_TELEMETRY", "False")
# Avoid pulling TensorFlow into HuggingFace optional paths when only ONNX/torch is needed
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.core.auth import init_firebase
from app.db import models
from app.db.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase()
    models.Base.metadata.create_all(bind=engine)

    # Simple migration: add columns if they don't exist
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE documents ADD COLUMN insights VARCHAR;"))
            conn.commit()
    except Exception:
        pass  # Column might already exist

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE documents ADD COLUMN analytics VARCHAR;"))
            conn.commit()
    except Exception:
        pass  # Column might already exist

    yield


app = FastAPI(
    title="NEXT AI RAG Engine",
    description="Research Intelligence System API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration - allow the frontend dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/rag")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
