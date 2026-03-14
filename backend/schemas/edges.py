"""Pydantic schemas for research edge (relationship) CRUD operations."""

from pydantic import BaseModel, ConfigDict


class EdgeCreate(BaseModel):
    """Payload for creating a new edge between two nodes."""

    model_config = ConfigDict(from_attributes=True)

    source_uid: str
    target_uid: str
    edge_type: str = "RELATES_TO"
    confidence: str = "medium"
    status: str = "idea"
    note: str = ""
    evidence: str = ""
    created_by_thinking: str = "manual"


class EdgeUpdate(BaseModel):
    """Payload for partially updating an existing edge."""

    model_config = ConfigDict(from_attributes=True)

    edge_type: str | None = None
    confidence: str | None = None
    status: str | None = None
    note: str | None = None
    evidence: str | None = None
    created_by_thinking: str | None = None


class EdgeResponse(BaseModel):
    """Full edge representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    uid: str
    source_uid: str
    target_uid: str
    edge_type: str
    confidence: str
    status: str
    note: str
    evidence: str
    created_by_thinking: str
    created_at: str
    updated_at: str
