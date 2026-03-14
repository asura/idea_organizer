"""API endpoints for graph queries."""

from fastapi import APIRouter, Query

from backend.schemas.graph import GraphResponse
from backend.services import graph_service

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("", response_model=GraphResponse)
def get_full_graph() -> GraphResponse:
    return graph_service.get_full_graph()


@router.get("/neighborhood/{uid}", response_model=GraphResponse)
def get_neighborhood(
    uid: str,
    depth: int = Query(default=1, ge=1, le=5),
) -> GraphResponse:
    return graph_service.get_neighborhood(uid, depth=depth)
