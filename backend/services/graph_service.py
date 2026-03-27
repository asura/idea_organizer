"""Graph query service for full graph and neighborhood subgraph retrieval."""

from pathlib import Path

from neomodel import db

from backend.analytics.event_log import log_event
from backend.models.nodes import ResearchNode
from backend.models.relationships import ResearchRelationship
from backend.schemas.edges import EdgeResponse
from backend.schemas.graph import GraphResponse
from backend.schemas.nodes import NodeResponse
from backend.services.edge_service import _rel_to_response
from backend.services.node_service import _node_to_response
from backend.services.perf import timed_operation


def get_full_graph() -> GraphResponse:
    """Return all nodes and edges."""
    with timed_operation("get_full_graph:nodes"):
        nodes = [_node_to_response(n) for n in ResearchNode.nodes.all()]

    query = """
        MATCH (s:ResearchNode)-[r:RESEARCH_EDGE]->(t:ResearchNode)
        RETURN s.uid, t.uid, r
    """
    with timed_operation("get_full_graph:edges"):
        results, _ = db.cypher_query(query)
        edges: list[EdgeResponse] = []
        for source_uid, target_uid, rel_data in results:
            rel = ResearchRelationship.inflate(rel_data)
            edges.append(_rel_to_response(rel, source_uid, target_uid))

    return GraphResponse(nodes=nodes, edges=edges)


def get_neighborhood(uid: str, depth: int = 1) -> GraphResponse:
    """Return a subgraph around a node up to *depth* hops.

    Uses variable-length path matching (no APOC dependency).
    """
    # Clamp depth to a safe range
    depth = max(1, min(depth, 5))

    node_query = f"""
        MATCH (center:ResearchNode {{uid: $uid}})
        OPTIONAL MATCH path = (center)-[*1..{depth}]-(connected:ResearchNode)
        WITH COLLECT(DISTINCT connected) + [center] AS all_nodes
        UNWIND all_nodes AS n
        RETURN DISTINCT n
    """
    node_results, _ = db.cypher_query(node_query, {"uid": uid})
    nodes: list[NodeResponse] = []
    for (node_data,) in node_results:
        node = ResearchNode.inflate(node_data)
        nodes.append(_node_to_response(node))

    edge_query = f"""
        MATCH (center:ResearchNode {{uid: $uid}})
        OPTIONAL MATCH path = (center)-[*1..{depth}]-(connected:ResearchNode)
        WITH COLLECT(DISTINCT connected) + [center] AS all_nodes
        UNWIND all_nodes AS n1
        UNWIND all_nodes AS n2
        WITH n1, n2 WHERE id(n1) < id(n2)
        MATCH (n1)-[r:RESEARCH_EDGE]-(n2)
        RETURN DISTINCT startNode(r).uid AS source_uid,
               endNode(r).uid AS target_uid, r
    """
    edge_results, _ = db.cypher_query(edge_query, {"uid": uid})
    edges: list[EdgeResponse] = []
    for source_uid, target_uid, rel_data in edge_results:
        rel = ResearchRelationship.inflate(rel_data)
        edges.append(_rel_to_response(rel, source_uid, target_uid))

    return GraphResponse(nodes=nodes, edges=edges)


def clear_graph() -> GraphResponse:
    """Clear all nodes and edges, returning an empty graph."""
    log_event("graph", "*", "clear")
    db.cypher_query("MATCH (n:ResearchNode) DETACH DELETE n")
    return GraphResponse(nodes=[], edges=[])


def save_graph_to_file(file_path: str) -> int:
    """Save the full graph to a JSON file.

    Returns the total number of elements (nodes + edges) saved.
    """
    path = Path(file_path)
    if not path.parent.exists():
        msg = f"Directory does not exist: {path.parent}"
        raise ValueError(msg)

    graph = get_full_graph()
    path.write_text(graph.model_dump_json(indent=2), encoding="utf-8")
    return len(graph.nodes) + len(graph.edges)


def load_graph_from_file(file_path: str) -> GraphResponse:
    """Load a graph from a JSON file, replacing all existing data."""
    path = Path(file_path)
    if not path.is_file():
        msg = f"File not found: {file_path}"
        raise FileNotFoundError(msg)

    text = path.read_text(encoding="utf-8")
    graph = GraphResponse.model_validate_json(text)

    # Clear existing graph
    db.cypher_query("MATCH (n:ResearchNode) DETACH DELETE n")

    # Create nodes
    for node_data in graph.nodes:
        props = node_data.model_dump(exclude={"created_at", "updated_at"})
        ResearchNode(**props).save()
        # Restore original timestamps via Cypher
        db.cypher_query(
            "MATCH (n:ResearchNode {uid: $uid}) "
            "SET n.created_at = datetime($created_at), "
            "    n.updated_at = datetime($updated_at)",
            {
                "uid": node_data.uid,
                "created_at": node_data.created_at,
                "updated_at": node_data.updated_at,
            },
        )

    # Create edges via Cypher to preserve all original properties
    for edge_data in graph.edges:
        db.cypher_query(
            "MATCH (s:ResearchNode {uid: $source_uid}), "
            "      (t:ResearchNode {uid: $target_uid}) "
            "CREATE (s)-[r:RESEARCH_EDGE {"
            "  uid: $uid, edge_type: $edge_type, confidence: $confidence,"
            "  status: $status, note: $note, evidence: $evidence,"
            "  created_by_thinking: $created_by_thinking,"
            "  created_at: datetime($created_at),"
            "  updated_at: datetime($updated_at)"
            "}]->(t)",
            {
                "source_uid": edge_data.source_uid,
                "target_uid": edge_data.target_uid,
                "uid": edge_data.uid,
                "edge_type": edge_data.edge_type,
                "confidence": edge_data.confidence,
                "status": edge_data.status,
                "note": edge_data.note,
                "evidence": edge_data.evidence,
                "created_by_thinking": edge_data.created_by_thinking,
                "created_at": edge_data.created_at,
                "updated_at": edge_data.updated_at,
            },
        )

    return graph
