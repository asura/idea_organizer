"""Neo4j relationship models for research edges."""

from uuid import uuid4

from neomodel import (
    DateTimeProperty,
    StringProperty,
    StructuredRel,
)

from backend.models.enums import Confidence, EdgeStatus, EdgeType


def _edge_type_choices() -> dict[str, str]:
    return {e.value: e.value for e in EdgeType}


def _confidence_choices() -> dict[str, str]:
    return {e.value: e.value for e in Confidence}


def _edge_status_choices() -> dict[str, str]:
    return {e.value: e.value for e in EdgeStatus}


class ResearchRelationship(StructuredRel):
    """Typed, annotated edge between two ResearchNode instances."""

    uid = StringProperty(
        unique_index=True,
        default=lambda: str(uuid4()),
    )
    edge_type = StringProperty(
        choices=_edge_type_choices(),
        default=EdgeType.RELATES_TO.value,
    )
    confidence = StringProperty(
        choices=_confidence_choices(),
        default=Confidence.MEDIUM.value,
    )
    status = StringProperty(
        choices=_edge_status_choices(),
        default=EdgeStatus.IDEA.value,
    )
    note = StringProperty(default="")
    evidence = StringProperty(default="")
    created_by_thinking = StringProperty(default="manual")
    created_at = DateTimeProperty(default_now=True)
    updated_at = DateTimeProperty(default_now=True)
