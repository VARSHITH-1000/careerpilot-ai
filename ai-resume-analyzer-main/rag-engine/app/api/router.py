from fastapi import APIRouter
from app.api.endpoints import documents, chat, explore

api_router = APIRouter()
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(explore.router, prefix="/explore", tags=["explore"])
