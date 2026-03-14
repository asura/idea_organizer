"""Top-level API router that aggregates all sub-routers."""

from typing import Any

from fastapi import APIRouter

from backend.api import edges, graph, nodes, search

router = APIRouter(prefix="/api")


@router.get("/health")
async def health_check() -> dict[str, Any]:
    return {"status": "ok"}


router.include_router(nodes.router)
router.include_router(edges.router)
router.include_router(graph.router)
router.include_router(search.router)
