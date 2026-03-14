"""Node CRUD service using neomodel."""

from datetime import datetime, timezone

from neomodel import DoesNotExist

from backend.analytics.event_log import log_event
from backend.models.nodes import ResearchNode
from backend.schemas.nodes import NodeCreate, NodeResponse, NodeUpdate


def _node_to_response(node: ResearchNode) -> NodeResponse:
    """Convert neomodel node to Pydantic response."""
    return NodeResponse(
        uid=node.uid,
        title=node.title,
        node_type=node.node_type,
        needs_review=node.needs_review,
        memo=node.memo or "",
        tags=node.tags or [],
        position_x=node.position_x or 0.0,
        position_y=node.position_y or 0.0,
        created_at=str(node.created_at) if node.created_at else "",
        updated_at=str(node.updated_at) if node.updated_at else "",
        # Concept-specific
        aliases=node.aliases if node.aliases else None,
        description=node.description if node.description else None,
        domain=node.domain if node.domain else None,
        importance=node.importance if node.importance else None,
        concept_status=node.concept_status if node.concept_status else None,
        # Paper-specific
        year=node.year,
        authors=node.authors if node.authors else None,
        venue=node.venue if node.venue else None,
        url=node.url if node.url else None,
        summary=node.summary if node.summary else None,
        contribution=node.contribution if node.contribution else None,
        limitations=node.limitations if node.limitations else None,
        read_status=(
            node.read_status
            if node.read_status and node.read_status != "unread"
            else None
        ),
        # Idea-specific
        motivation=node.motivation if node.motivation else None,
        novelty_claim=node.novelty_claim if node.novelty_claim else None,
        feasibility_note=node.feasibility_note if node.feasibility_note else None,
        priority=(
            node.priority
            if node.priority and node.priority != "medium"
            else None
        ),
        idea_status=node.idea_status if node.idea_status else None,
        # Question-specific
        category=node.category if node.category else None,
        urgency=(
            node.urgency
            if node.urgency and node.urgency != "medium"
            else None
        ),
        question_status=node.question_status if node.question_status else None,
        # Evidence-specific
        content=node.content if node.content else None,
        source=node.source if node.source else None,
        reliability=node.reliability if node.reliability else None,
        evidence_date=node.evidence_date if node.evidence_date else None,
        linked_excerpt=node.linked_excerpt if node.linked_excerpt else None,
    )


def create_node(data: NodeCreate) -> NodeResponse:
    """Create a new research node."""
    props = data.model_dump(exclude_none=True)
    node = ResearchNode(**props).save()

    log_event("node", node.uid, "create", new_data=props)
    return _node_to_response(node)


def get_node(uid: str) -> NodeResponse:
    """Get a node by uid.

    Raises:
        DoesNotExist: If no node with the given uid exists.
    """
    node = ResearchNode.nodes.get(uid=uid)
    return _node_to_response(node)


def update_node(uid: str, data: NodeUpdate) -> NodeResponse:
    """Update a node's properties.

    Raises:
        DoesNotExist: If no node with the given uid exists.
    """
    node = ResearchNode.nodes.get(uid=uid)
    old_data = {"title": node.title, "node_type": node.node_type}

    updates = data.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(node, key, value)
    node.updated_at = datetime.now(timezone.utc)
    node.save()

    log_event("node", uid, "update", old_data=old_data, new_data=updates)
    return _node_to_response(node)


def delete_node(uid: str) -> None:
    """Delete a node and its connected edges.

    Raises:
        DoesNotExist: If no node with the given uid exists.
    """
    node = ResearchNode.nodes.get(uid=uid)
    old_data = {"title": node.title, "node_type": node.node_type}

    # Disconnect all relationships first
    for connected in node.connected_to.all():
        node.connected_to.disconnect(connected)

    node.delete()
    log_event("node", uid, "delete", old_data=old_data)


def list_nodes(
    node_type: str | None = None,
    needs_review: bool | None = None,
    search_query: str | None = None,
    tags: list[str] | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[NodeResponse]:
    """List nodes with optional filters."""
    filters: dict = {}
    if node_type:
        filters["node_type"] = node_type
    if needs_review is not None:
        filters["needs_review"] = needs_review

    if filters:
        nodes = ResearchNode.nodes.filter(**filters).order_by("-created_at")[
            offset : offset + limit
        ]
    else:
        nodes = ResearchNode.nodes.order_by("-created_at")[
            offset : offset + limit
        ]

    results = [_node_to_response(n) for n in nodes]

    # Client-side tag filter (neomodel doesn't support array contains easily)
    if tags:
        results = [
            r for r in results if r.tags and any(t in r.tags for t in tags)
        ]

    return results
