"""Pydantic schema for full graph responses."""

from pydantic import BaseModel

from backend.schemas.edges import EdgeResponse
from backend.schemas.nodes import NodeResponse


class GraphResponse(BaseModel):
    """Complete graph snapshot containing nodes and edges."""

    nodes: list[NodeResponse]
    edges: list[EdgeResponse]
