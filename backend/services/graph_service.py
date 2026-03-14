"""Graph query service for full graph and neighborhood subgraph retrieval."""

from neomodel import db

from backend.models.nodes import ResearchNode
from backend.models.relationships import ResearchRelationship
from backend.schemas.edges import EdgeResponse
from backend.schemas.graph import GraphResponse
from backend.schemas.nodes import NodeResponse
from backend.services.edge_service import _rel_to_response
from backend.services.node_service import _node_to_response


def get_full_graph() -> GraphResponse:
    """Return all nodes and edges."""
    nodes = [_node_to_response(n) for n in ResearchNode.nodes.all()]

    query = """
        MATCH (s:ResearchNode)-[r:RESEARCH_EDGE]->(t:ResearchNode)
        RETURN s.uid, t.uid, r
    """
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
