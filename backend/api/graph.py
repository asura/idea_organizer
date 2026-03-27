"""API endpoints for graph queries."""

import json

from fastapi import APIRouter, HTTPException, Query

from backend.schemas.graph import FilePathRequest, GraphResponse
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


@router.post("/clear", response_model=GraphResponse)
def clear_graph() -> GraphResponse:
    """Clear all nodes and edges, starting a fresh graph."""
    return graph_service.clear_graph()


@router.post("/save")
def save_graph(req: FilePathRequest) -> dict[str, str]:
    """Save the current graph to a JSON file."""
    try:
        count = graph_service.save_graph_to_file(req.file_path)
    except (ValueError, OSError) as e:
        raise HTTPException(status_code=400, detail=str(e)) from None
    return {"message": f"Saved {count} elements to {req.file_path}"}


@router.post("/load", response_model=GraphResponse)
def load_graph(req: FilePathRequest) -> GraphResponse:
    """Load a graph from a JSON file, replacing existing data."""
    try:
        return graph_service.load_graph_from_file(req.file_path)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"File not found: {req.file_path}"
        ) from None
    except (ValueError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid file: {e}") from None
