"""API endpoints for research edge CRUD operations."""

from fastapi import APIRouter, HTTPException
from neomodel import DoesNotExist  # type: ignore[attr-defined]

from backend.schemas.edges import EdgeCreate, EdgeResponse, EdgeUpdate
from backend.services import edge_service

router = APIRouter(prefix="/edges", tags=["edges"])


@router.post("", response_model=EdgeResponse, status_code=201)
def create_edge(data: EdgeCreate) -> EdgeResponse:
    try:
        return edge_service.create_edge(data)
    except DoesNotExist as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from None


@router.get("", response_model=list[EdgeResponse])
def list_edges(
    edge_type: str | None = None,
    confidence: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[EdgeResponse]:
    return edge_service.list_edges(
        edge_type=edge_type,
        confidence=confidence,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/{uid}", response_model=EdgeResponse)
def get_edge(uid: str) -> EdgeResponse:
    try:
        return edge_service.get_edge(uid)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Edge '{uid}' not found") from None


@router.patch("/{uid}", response_model=EdgeResponse)
def update_edge(uid: str, data: EdgeUpdate) -> EdgeResponse:
    try:
        return edge_service.update_edge(uid, data)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Edge '{uid}' not found") from None


@router.delete("/{uid}", status_code=204)
def delete_edge(uid: str) -> None:
    try:
        edge_service.delete_edge(uid)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Edge '{uid}' not found") from None
