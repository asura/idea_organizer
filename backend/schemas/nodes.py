"""Pydantic schemas for ResearchNode CRUD operations."""

from pydantic import BaseModel, ConfigDict


class NodeCreate(BaseModel):
    """Payload for creating a new research node."""

    model_config = ConfigDict(from_attributes=True)

    title: str
    node_type: str = "concept"
    needs_review: bool = True
    memo: str = ""
    tags: list[str] = []
    position_x: float = 0.0
    position_y: float = 0.0

    # Concept-specific
    aliases: list[str] | None = None
    description: str | None = None
    domain: str | None = None
    importance: str | None = None
    concept_status: str | None = None

    # Paper-specific
    year: int | None = None
    authors: list[str] | None = None
    venue: str | None = None
    url: str | None = None
    summary: str | None = None
    contribution: str | None = None
    limitations: str | None = None
    read_status: str | None = None

    # Idea-specific
    motivation: str | None = None
    novelty_claim: str | None = None
    feasibility_note: str | None = None
    priority: str | None = None
    idea_status: str | None = None

    # Question-specific
    category: str | None = None
    urgency: str | None = None
    question_status: str | None = None

    # Evidence-specific
    content: str | None = None
    source: str | None = None
    reliability: str | None = None
    evidence_date: str | None = None
    linked_excerpt: str | None = None

    # Hypothesis-specific
    statement: str | None = None
    basis: str | None = None
    testability_note: str | None = None
    confidence_level: str | None = None
    hypothesis_status: str | None = None


class NodeUpdate(BaseModel):
    """Payload for partially updating a research node."""

    model_config = ConfigDict(from_attributes=True)

    title: str | None = None
    node_type: str | None = None
    needs_review: bool | None = None
    memo: str | None = None
    tags: list[str] | None = None
    position_x: float | None = None
    position_y: float | None = None

    # Concept-specific
    aliases: list[str] | None = None
    description: str | None = None
    domain: str | None = None
    importance: str | None = None
    concept_status: str | None = None

    # Paper-specific
    year: int | None = None
    authors: list[str] | None = None
    venue: str | None = None
    url: str | None = None
    summary: str | None = None
    contribution: str | None = None
    limitations: str | None = None
    read_status: str | None = None

    # Idea-specific
    motivation: str | None = None
    novelty_claim: str | None = None
    feasibility_note: str | None = None
    priority: str | None = None
    idea_status: str | None = None

    # Question-specific
    category: str | None = None
    urgency: str | None = None
    question_status: str | None = None

    # Evidence-specific
    content: str | None = None
    source: str | None = None
    reliability: str | None = None
    evidence_date: str | None = None
    linked_excerpt: str | None = None

    # Hypothesis-specific
    statement: str | None = None
    basis: str | None = None
    testability_note: str | None = None
    confidence_level: str | None = None
    hypothesis_status: str | None = None


class NodeResponse(BaseModel):
    """Full node representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    uid: str
    title: str
    node_type: str
    needs_review: bool
    memo: str
    tags: list[str]
    position_x: float
    position_y: float
    created_at: str
    updated_at: str

    # Concept-specific
    aliases: list[str] | None = None
    description: str | None = None
    domain: str | None = None
    importance: str | None = None
    concept_status: str | None = None

    # Paper-specific
    year: int | None = None
    authors: list[str] | None = None
    venue: str | None = None
    url: str | None = None
    summary: str | None = None
    contribution: str | None = None
    limitations: str | None = None
    read_status: str | None = None

    # Idea-specific
    motivation: str | None = None
    novelty_claim: str | None = None
    feasibility_note: str | None = None
    priority: str | None = None
    idea_status: str | None = None

    # Question-specific
    category: str | None = None
    urgency: str | None = None
    question_status: str | None = None

    # Evidence-specific
    content: str | None = None
    source: str | None = None
    reliability: str | None = None
    evidence_date: str | None = None
    linked_excerpt: str | None = None

    # Hypothesis-specific
    statement: str | None = None
    basis: str | None = None
    testability_note: str | None = None
    confidence_level: str | None = None
    hypothesis_status: str | None = None
