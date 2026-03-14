"""API endpoints for research node CRUD operations."""

from fastapi import APIRouter, HTTPException
from neomodel import DoesNotExist  # type: ignore[attr-defined]

from backend.schemas.nodes import NodeCreate, NodeResponse, NodeUpdate
from backend.services import node_service

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.post("", response_model=NodeResponse, status_code=201)
def create_node(data: NodeCreate) -> NodeResponse:
    return node_service.create_node(data)


@router.get("", response_model=list[NodeResponse])
def list_nodes(
    node_type: str | None = None,
    needs_review: bool | None = None,
    search_query: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[NodeResponse]:
    return node_service.list_nodes(
        node_type=node_type,
        needs_review=needs_review,
        search_query=search_query,
        limit=limit,
        offset=offset,
    )


@router.get("/{uid}", response_model=NodeResponse)
def get_node(uid: str) -> NodeResponse:
    try:
        return node_service.get_node(uid)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Node '{uid}' not found") from None


@router.patch("/{uid}", response_model=NodeResponse)
def update_node(uid: str, data: NodeUpdate) -> NodeResponse:
    try:
        return node_service.update_node(uid, data)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Node '{uid}' not found") from None


@router.delete("/{uid}", status_code=204)
def delete_node(uid: str) -> None:
    try:
        node_service.delete_node(uid)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Node '{uid}' not found") from None
