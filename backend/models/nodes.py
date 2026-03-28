"""Neo4j node model for all research entity types.

A single ``ResearchNode`` class covers every node type (concept, paper, idea,
question, evidence).  The ``node_type`` field discriminates between types and
type-specific fields default to empty/neutral values so they can be left unset
for irrelevant types.
"""

from neomodel import (
    ArrayProperty,
    BooleanProperty,
    DateTimeProperty,
    FloatProperty,
    IntegerProperty,
    RelationshipTo,
    StringProperty,
    StructuredNode,
    UniqueIdProperty,
)

from backend.models.relationships import ResearchRelationship


class ResearchNode(StructuredNode):
    """Unified graph node for all research entity types."""

    # ------------------------------------------------------------------
    # Common fields
    # ------------------------------------------------------------------
    uid = UniqueIdProperty()
    title = StringProperty(required=True, index=True)
    node_type = StringProperty(required=True, index=True)
    needs_review = BooleanProperty(default=True)
    memo = StringProperty(default="")
    tags = ArrayProperty(StringProperty(), default=list)
    position_x = FloatProperty(default=0.0)
    position_y = FloatProperty(default=0.0)
    created_at = DateTimeProperty(default_now=True)
    updated_at = DateTimeProperty(default_now=True)

    # ------------------------------------------------------------------
    # Concept-specific
    # ------------------------------------------------------------------
    aliases = ArrayProperty(StringProperty(), default=list)
    description = StringProperty(default="")
    domain = StringProperty(default="")
    importance = StringProperty(default="")
    concept_status = StringProperty(default="")

    # ------------------------------------------------------------------
    # Paper-specific
    # ------------------------------------------------------------------
    year = IntegerProperty()
    authors = ArrayProperty(StringProperty(), default=list)
    venue = StringProperty(default="")
    url = StringProperty(default="")
    summary = StringProperty(default="")
    contribution = StringProperty(default="")
    limitations = StringProperty(default="")
    read_status = StringProperty(default="unread")

    # ------------------------------------------------------------------
    # Idea-specific
    # ------------------------------------------------------------------
    motivation = StringProperty(default="")
    novelty_claim = StringProperty(default="")
    feasibility_note = StringProperty(default="")
    priority = StringProperty(default="medium")
    idea_status = StringProperty(default="")

    # ------------------------------------------------------------------
    # Question-specific
    # ------------------------------------------------------------------
    category = StringProperty(default="")
    urgency = StringProperty(default="medium")
    question_status = StringProperty(default="")

    # ------------------------------------------------------------------
    # Evidence-specific
    # ------------------------------------------------------------------
    content = StringProperty(default="")
    source = StringProperty(default="")
    reliability = StringProperty(default="")
    evidence_date = StringProperty(default="")
    linked_excerpt = StringProperty(default="")

    # ------------------------------------------------------------------
    # Hypothesis-specific
    # ------------------------------------------------------------------
    statement = StringProperty(default="")
    basis = StringProperty(default="")
    testability_note = StringProperty(default="")
    confidence_level = StringProperty(default="medium")
    hypothesis_status = StringProperty(default="draft")

    # ------------------------------------------------------------------
    # Decision-specific
    # ------------------------------------------------------------------
    decision_type = StringProperty(default="")
    rationale = StringProperty(default="")
    review_trigger = StringProperty(default="")

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------
    connected_to = RelationshipTo(
        "ResearchNode",
        "RESEARCH_EDGE",
        model=ResearchRelationship,
    )
