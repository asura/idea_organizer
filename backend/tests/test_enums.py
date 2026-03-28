"""Tests for enumeration types."""

from backend.models.enums import (
    Confidence,
    DecisionStatus,
    DecisionType,
    EdgeStatus,
    EdgeType,
    HypothesisStatus,
    NodeType,
)


def test_node_types():
    assert NodeType.CONCEPT == "concept"
    assert NodeType.PAPER == "paper"
    assert NodeType.IDEA == "idea"
    assert NodeType.QUESTION == "question"
    assert NodeType.EVIDENCE == "evidence"
    assert NodeType.HYPOTHESIS == "hypothesis"
    assert NodeType.DECISION == "decision"
    assert len(NodeType) == 7


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


def test_hypothesis_status():
    assert HypothesisStatus.DRAFT == "draft"
    assert HypothesisStatus.TESTING == "testing"
    assert HypothesisStatus.SUPPORTED == "supported"
    assert HypothesisStatus.REFUTED == "refuted"
    assert HypothesisStatus.REVISED == "revised"
    assert len(HypothesisStatus) == 5


def test_decision_type():
    assert DecisionType.ADOPT == "adopt"
    assert DecisionType.HOLD == "hold"
    assert DecisionType.REJECT == "reject"
    assert DecisionType.PARK == "park"
    assert len(DecisionType) == 4


def test_decision_status():
    assert DecisionStatus.ACTIVE == "active"
    assert DecisionStatus.SUPERSEDED == "superseded"
    assert len(DecisionStatus) == 2


def test_edge_status():
    assert EdgeStatus.IDEA == "idea"
    assert EdgeStatus.PLAUSIBLE == "plausible"
    assert EdgeStatus.CHECKED == "checked"
    assert EdgeStatus.REJECTED == "rejected"
    assert len(EdgeStatus) == 4


def test_node_type_str_comparison():
    """StrEnum values should be directly usable as plain strings."""
    assert NodeType.CONCEPT == "concept"
    assert NodeType.CONCEPT == "concept"
    assert isinstance(NodeType.CONCEPT, str)


def test_edge_type_str_comparison():
    assert EdgeType.SUPPORTS == "SUPPORTS"
    assert isinstance(EdgeType.SUPPORTS, str)
