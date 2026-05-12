from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.auth import get_current_user
from app.services.research_exploration import explore_global_topic

router = APIRouter()

@router.get("/topic")
async def explore_topic(
    query: str = Query(..., description="The research topic to explore globally"),
    user_id: str = Depends(get_current_user)
):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query parameter is required")
        
    intelligence_report = explore_global_topic(query)
    # Always return even if only partial — the frontend handles empty states
    return intelligence_report
