"""Edge CRUD service using neomodel and Cypher queries."""

from datetime import UTC, datetime

from neomodel import db

from backend.analytics.event_log import log_event
from backend.models.nodes import ResearchNode
from backend.models.relationships import ResearchRelationship
from backend.schemas.edges import EdgeCreate, EdgeResponse, EdgeUpdate
from backend.services.perf import timed_operation


def _rel_to_response(
    rel: ResearchRelationship, source_uid: str, target_uid: str
) -> EdgeResponse:
    """Convert neomodel relationship to Pydantic response."""
    return EdgeResponse(
        uid=rel.uid,
        source_uid=source_uid,
        target_uid=target_uid,
        edge_type=rel.edge_type or "RELATES_TO",
        confidence=rel.confidence or "medium",
        status=rel.status or "idea",
        note=rel.note or "",
        evidence=rel.evidence or "",
        created_by_thinking=rel.created_by_thinking or "manual",
        created_at=str(rel.created_at) if rel.created_at else "",
        updated_at=str(rel.updated_at) if rel.updated_at else "",
    )


def create_edge(data: EdgeCreate) -> EdgeResponse:
    """Create a new edge between two nodes.

    Raises:
        DoesNotExist: If either source or target node does not exist.
    """
    with timed_operation("create_edge:fetch_nodes"):
        source = ResearchNode.nodes.get(uid=data.source_uid)
        target = ResearchNode.nodes.get(uid=data.target_uid)

    props = {
        "edge_type": data.edge_type,
        "confidence": data.confidence,
        "status": data.status,
        "note": data.note,
        "evidence": data.evidence,
        "created_by_thinking": data.created_by_thinking,
    }

    with timed_operation("create_edge:connect"):
        rel = source.connected_to.connect(target, props)

    log_event(
        "edge",
        rel.uid,
        "create",
        new_data={
            "source_uid": data.source_uid,
            "target_uid": data.target_uid,
            **props,
        },
    )
    return _rel_to_response(rel, data.source_uid, data.target_uid)


def get_edge(uid: str) -> EdgeResponse:
    """Get an edge by uid using Cypher query.

    Raises:
        ValueError: If no edge with the given uid exists.
    """
    query = """
        MATCH (s:ResearchNode)-[r:RESEARCH_EDGE {uid: $uid}]->(t:ResearchNode)
        RETURN s.uid AS source_uid, t.uid AS target_uid, r
    """
    with timed_operation("get_edge:cypher"):
        results, _ = db.cypher_query(query, {"uid": uid})
    if not results:
        raise ValueError(f"Edge with uid '{uid}' not found")

    source_uid, target_uid, rel_data = results[0]
    rel = ResearchRelationship.inflate(rel_data)
    return _rel_to_response(rel, source_uid, target_uid)


def update_edge(uid: str, data: EdgeUpdate) -> EdgeResponse:
    """Update an edge's properties using Cypher.

    Raises:
        ValueError: If no edge with the given uid exists.
    """
    updates = data.model_dump(exclude_none=True)
    if not updates:
        return get_edge(uid)

    updates["updated_at"] = datetime.now(UTC).isoformat()

    set_clauses = ", ".join(f"r.{k} = ${k}" for k in updates)
    query = f"""
        MATCH (s:ResearchNode)-[r:RESEARCH_EDGE {{uid: $uid}}]->(t:ResearchNode)
        SET {set_clauses}
        RETURN s.uid AS source_uid, t.uid AS target_uid, r
    """
    params = {"uid": uid, **updates}
    with timed_operation("update_edge:cypher"):
        results, _ = db.cypher_query(query, params)
    if not results:
        raise ValueError(f"Edge with uid '{uid}' not found")

    source_uid, target_uid, rel_data = results[0]
    rel = ResearchRelationship.inflate(rel_data)

    log_event("edge", uid, "update", new_data=updates)
    return _rel_to_response(rel, source_uid, target_uid)


def delete_edge(uid: str) -> None:
    """Delete an edge by uid.

    Raises:
        ValueError: If no edge with the given uid exists.
    """
    query = """
        MATCH (s:ResearchNode)-[r:RESEARCH_EDGE {uid: $uid}]->(t:ResearchNode)
        DELETE r
        RETURN s.uid, t.uid
    """
    results, _ = db.cypher_query(query, {"uid": uid})
    if not results:
        raise ValueError(f"Edge with uid '{uid}' not found")

    log_event(
        "edge",
        uid,
        "delete",
        old_data={
            "source_uid": results[0][0],
            "target_uid": results[0][1],
        },
    )


def list_edges(
    edge_type: str | None = None,
    confidence: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[EdgeResponse]:
    """List all edges with optional filters."""
    where_clauses: list[str] = []
    params: dict = {"limit": limit, "offset": offset}

    if edge_type:
        where_clauses.append("r.edge_type = $edge_type")
        params["edge_type"] = edge_type
    if confidence:
        where_clauses.append("r.confidence = $confidence")
        params["confidence"] = confidence
    if status:
        where_clauses.append("r.status = $status")
        params["status"] = status

    where = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    query = f"""
        MATCH (s:ResearchNode)-[r:RESEARCH_EDGE]->(t:ResearchNode)
        {where}
        RETURN s.uid AS source_uid, t.uid AS target_uid, r
        ORDER BY r.created_at DESC
        SKIP $offset LIMIT $limit
    """
    results, _ = db.cypher_query(query, params)

    edges: list[EdgeResponse] = []
    for source_uid, target_uid, rel_data in results:
        rel = ResearchRelationship.inflate(rel_data)
        edges.append(_rel_to_response(rel, source_uid, target_uid))
    return edges
