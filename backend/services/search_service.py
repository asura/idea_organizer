"""Full-text search service for research nodes."""

from neomodel import db

from backend.models.nodes import ResearchNode
from backend.schemas.nodes import NodeResponse
from backend.services.node_service import _node_to_response


def search_nodes(query: str, limit: int = 50) -> list[NodeResponse]:
    """Full-text search on node titles and memos.

    Attempts to use a Neo4j fulltext index first (``node_title_fulltext``).
    Falls back to case-insensitive ``CONTAINS`` if the index is unavailable.
    """
    if not query.strip():
        return []

    # Try fulltext index first
    try:
        cypher = """
            CALL db.index.fulltext.queryNodes('node_title_fulltext', $query)
            YIELD node, score
            RETURN node
            ORDER BY score DESC
            LIMIT $limit
        """
        results, _ = db.cypher_query(cypher, {"query": query, "limit": limit})
        return [_node_to_response(ResearchNode.inflate(row[0])) for row in results]
    except Exception:
        # Fallback: case-insensitive CONTAINS
        cypher = """
            MATCH (n:ResearchNode)
            WHERE toLower(n.title) CONTAINS toLower($query)
               OR toLower(n.memo) CONTAINS toLower($query)
            RETURN n
            ORDER BY n.created_at DESC
            LIMIT $limit
        """
        results, _ = db.cypher_query(cypher, {"query": query, "limit": limit})
        return [_node_to_response(ResearchNode.inflate(row[0])) for row in results]
