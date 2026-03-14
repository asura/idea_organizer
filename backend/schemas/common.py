"""Shared Pydantic schemas for pagination and filtering."""

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class FilterParams(BaseModel):
    node_type: str | None = None
    confidence: str | None = None
    status: str | None = None
    needs_review: bool | None = None
    search_query: str | None = None
    tags: list[str] | None = None
