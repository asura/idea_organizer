"""API endpoints for full-text search."""

from fastapi import APIRouter

from backend.schemas.nodes import NodeResponse
from backend.services import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=list[NodeResponse])
def search(q: str = "", limit: int = 50) -> list[NodeResponse]:
    return search_service.search_nodes(q, limit=limit)
