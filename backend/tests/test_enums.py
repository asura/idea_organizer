"""Tests for enumeration types."""

from backend.models.enums import NodeType, EdgeType, Confidence, EdgeStatus


def test_node_types():
    assert NodeType.CONCEPT == "concept"
    assert NodeType.PAPER == "paper"
    assert NodeType.IDEA == "idea"
    assert NodeType.QUESTION == "question"
    assert NodeType.EVIDENCE == "evidence"
    assert len(NodeType) == 5


def test_edge_types():
    assert EdgeType.RELATES_TO == "RELATES_TO"
    assert EdgeType.SUPPORTS == "SUPPORTS"
    assert EdgeType.CONTRADICTS == "CONTRADICTS"
    assert EdgeType.EXTENDS == "EXTENDS"
    assert EdgeType.REQUIRES == "REQUIRES"
    assert EdgeType.INSPIRES == "INSPIRES"
    assert EdgeType.EVALUATES == "EVALUATES"
    assert EdgeType.COMPETES_WITH == "COMPETES_WITH"
    assert len(EdgeType) == 8


def test_confidence():
    assert Confidence.HIGH == "high"
    assert Confidence.MEDIUM == "medium"
    assert Confidence.LOW == "low"
    assert len(Confidence) == 3


def test_edge_status():
    assert EdgeStatus.IDEA == "idea"
    assert EdgeStatus.PLAUSIBLE == "plausible"
    assert EdgeStatus.CHECKED == "checked"
    assert EdgeStatus.REJECTED == "rejected"
    assert len(EdgeStatus) == 4


def test_node_type_str_comparison():
    """StrEnum values should be directly usable as plain strings."""
    assert NodeType.CONCEPT == "concept"
    assert "concept" == NodeType.CONCEPT
    assert isinstance(NodeType.CONCEPT, str)


def test_edge_type_str_comparison():
    assert EdgeType.SUPPORTS == "SUPPORTS"
    assert isinstance(EdgeType.SUPPORTS, str)
