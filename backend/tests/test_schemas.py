"""Tests for Pydantic request/response schemas.

These tests validate schema construction, defaults, and serialization
without any external dependencies (no Neo4j, no DuckDB).
"""

import pytest
from pydantic import ValidationError

from backend.schemas.common import FilterParams, PaginationParams
from backend.schemas.edges import EdgeCreate, EdgeResponse, EdgeUpdate
from backend.schemas.graph import GraphResponse
from backend.schemas.nodes import NodeCreate, NodeResponse, NodeUpdate


# ---------------------------------------------------------------------------
# NodeCreate
# ---------------------------------------------------------------------------
class TestNodeCreate:
    def test_minimal_create(self):
        """Only title is required; everything else falls back to defaults."""
        node = NodeCreate(title="Test Concept")
        assert node.title == "Test Concept"
        assert node.node_type == "concept"
        assert node.needs_review is True
        assert node.tags == []
        assert node.memo == ""
        assert node.position_x == 0.0
        assert node.position_y == 0.0

    def test_full_create_concept(self):
        node = NodeCreate(
            title="条件付きアクセス性",
            node_type="concept",
            description="条件に基づくアクセス制御",
            domain="GIS",
            tags=["GIS", "アクセス"],
            aliases=["conditional accessibility"],
            importance="high",
        )
        assert node.node_type == "concept"
        assert node.description == "条件に基づくアクセス制御"
        assert len(node.tags) == 2
        assert node.aliases == ["conditional accessibility"]

    def test_full_create_paper(self):
        node = NodeCreate(
            title="FlexiReg",
            node_type="paper",
            year=2024,
            authors=["Author A", "Author B"],
            venue="NeurIPS",
            url="https://example.com",
            read_status="reading",
        )
        assert node.year == 2024
        assert node.authors is not None and len(node.authors) == 2
        assert node.venue == "NeurIPS"
        assert node.read_status == "reading"

    def test_full_create_idea(self):
        node = NodeCreate(
            title="HGIベース任意領域対応",
            node_type="idea",
            motivation="既存手法の限界を超える",
            novelty_claim="任意形状への汎化",
            feasibility_note="データ量が課題",
            priority="high",
        )
        assert node.priority == "high"
        assert node.motivation == "既存手法の限界を超える"

    def test_full_create_question(self):
        node = NodeCreate(
            title="How to handle missing data?",
            node_type="question",
            category="methodology",
            urgency="high",
        )
        assert node.category == "methodology"
        assert node.urgency == "high"

    def test_full_create_evidence(self):
        node = NodeCreate(
            title="Experiment Result A",
            node_type="evidence",
            content="Accuracy improved by 5%",
            source="paper-xyz",
            reliability="high",
            evidence_date="2024-06-01",
            linked_excerpt="Table 3, row 2",
        )
        assert node.content == "Accuracy improved by 5%"
        assert node.linked_excerpt == "Table 3, row 2"

    def test_full_create_hypothesis(self):
        node = NodeCreate(
            title="温度が反応速度を決定する",
            node_type="hypothesis",
            statement="温度上昇により反応速度は指数的に増加する",
            basis="アレニウスの式に基づく推論",
            testability_note="実験室実験で検証可能",
            confidence_level="medium",
            hypothesis_status="draft",
        )
        assert node.node_type == "hypothesis"
        assert node.statement == "温度上昇により反応速度は指数的に増加する"
        assert node.confidence_level == "medium"

    def test_optional_fields_default_to_none(self):
        node = NodeCreate(title="Minimal")
        assert node.description is None
        assert node.year is None
        assert node.authors is None
        assert node.motivation is None
        assert node.category is None
        assert node.content is None
        assert node.statement is None

    def test_missing_title_raises_validation_error(self):
        with pytest.raises(ValidationError) as exc_info:
            NodeCreate()  # type: ignore[call-arg]
        assert "title" in str(exc_info.value)


# ---------------------------------------------------------------------------
# NodeUpdate
# ---------------------------------------------------------------------------
class TestNodeUpdate:
    def test_partial_update(self):
        update = NodeUpdate(title="Updated Title")
        assert update.title == "Updated Title"
        assert update.node_type is None
        assert update.memo is None

    def test_empty_update(self):
        """An empty update should produce an empty dict when excluding None."""
        update = NodeUpdate()
        dump = update.model_dump(exclude_none=True)
        assert dump == {}

    def test_multiple_fields_update(self):
        update = NodeUpdate(
            title="New",
            tags=["updated"],
            needs_review=False,
            position_x=10.5,
        )
        dump = update.model_dump(exclude_none=True)
        assert dump["title"] == "New"
        assert dump["tags"] == ["updated"]
        assert dump["needs_review"] is False
        assert dump["position_x"] == 10.5

    def test_all_fields_none_by_default(self):
        update = NodeUpdate()
        for field_name in NodeUpdate.model_fields:
            assert getattr(update, field_name) is None


# ---------------------------------------------------------------------------
# NodeResponse
# ---------------------------------------------------------------------------
class TestNodeResponse:
    def test_full_response(self):
        resp = NodeResponse(
            uid="abc123",
            title="Test",
            node_type="concept",
            needs_review=True,
            memo="",
            tags=[],
            position_x=0.0,
            position_y=0.0,
            created_at="2024-01-01T00:00:00",
            updated_at="2024-01-01T00:00:00",
        )
        assert resp.uid == "abc123"
        assert resp.title == "Test"
        assert resp.node_type == "concept"

    def test_response_with_optional_fields(self):
        resp = NodeResponse(
            uid="abc123",
            title="Deep Paper",
            node_type="paper",
            needs_review=False,
            memo="interesting",
            tags=["ML"],
            position_x=1.0,
            position_y=2.0,
            created_at="2024-01-01T00:00:00",
            updated_at="2024-06-15T12:30:00",
            year=2024,
            authors=["Alice", "Bob"],
            venue="ICML",
        )
        assert resp.year == 2024
        assert resp.authors == ["Alice", "Bob"]
        assert resp.venue == "ICML"
        # Unset optional fields remain None
        assert resp.description is None
        assert resp.motivation is None

    def test_missing_required_field_raises(self):
        with pytest.raises(ValidationError):
            NodeResponse(
                uid="abc",
                # title is missing
                node_type="concept",
                needs_review=True,
                memo="",
                tags=[],
                position_x=0.0,
                position_y=0.0,
                created_at="2024-01-01T00:00:00",
                updated_at="2024-01-01T00:00:00",
            )  # type: ignore[call-arg]


# ---------------------------------------------------------------------------
# EdgeCreate
# ---------------------------------------------------------------------------
class TestEdgeCreate:
    def test_minimal_create(self):
        edge = EdgeCreate(source_uid="a", target_uid="b")
        assert edge.edge_type == "RELATES_TO"
        assert edge.confidence == "medium"
        assert edge.status == "idea"
        assert edge.note == ""
        assert edge.evidence == ""
        assert edge.created_by_thinking == "manual"

    def test_full_create(self):
        edge = EdgeCreate(
            source_uid="a",
            target_uid="b",
            edge_type="SUPPORTS",
            confidence="high",
            status="checked",
            note="強い根拠あり",
            evidence="論文Xの実験結果",
            created_by_thinking="auto",
        )
        assert edge.edge_type == "SUPPORTS"
        assert edge.confidence == "high"
        assert edge.note == "強い根拠あり"

    def test_missing_source_raises(self):
        with pytest.raises(ValidationError):
            EdgeCreate(target_uid="b")  # type: ignore[call-arg]

    def test_missing_target_raises(self):
        with pytest.raises(ValidationError):
            EdgeCreate(source_uid="a")  # type: ignore[call-arg]


# ---------------------------------------------------------------------------
# EdgeUpdate
# ---------------------------------------------------------------------------
class TestEdgeUpdate:
    def test_partial_update(self):
        update = EdgeUpdate(confidence="low", note="再検討必要")
        dump = update.model_dump(exclude_none=True)
        assert "confidence" in dump
        assert "note" in dump
        assert "edge_type" not in dump

    def test_empty_update(self):
        update = EdgeUpdate()
        dump = update.model_dump(exclude_none=True)
        assert dump == {}


# ---------------------------------------------------------------------------
# EdgeResponse
# ---------------------------------------------------------------------------
class TestEdgeResponse:
    def test_full_response(self):
        resp = EdgeResponse(
            uid="edge-001",
            source_uid="node-a",
            target_uid="node-b",
            edge_type="SUPPORTS",
            confidence="high",
            status="checked",
            note="test note",
            evidence="some evidence",
            created_by_thinking="manual",
            created_at="2024-01-01T00:00:00",
            updated_at="2024-01-01T00:00:00",
        )
        assert resp.uid == "edge-001"
        assert resp.source_uid == "node-a"
        assert resp.edge_type == "SUPPORTS"


# ---------------------------------------------------------------------------
# GraphResponse
# ---------------------------------------------------------------------------
class TestGraphResponse:
    def test_empty_graph(self):
        graph = GraphResponse(nodes=[], edges=[])
        assert len(graph.nodes) == 0
        assert len(graph.edges) == 0

    def test_graph_with_data(self):
        node = NodeResponse(
            uid="n1",
            title="A",
            node_type="concept",
            needs_review=True,
            memo="",
            tags=[],
            position_x=0.0,
            position_y=0.0,
            created_at="2024-01-01T00:00:00",
            updated_at="2024-01-01T00:00:00",
        )
        edge = EdgeResponse(
            uid="e1",
            source_uid="n1",
            target_uid="n2",
            edge_type="RELATES_TO",
            confidence="medium",
            status="idea",
            note="",
            evidence="",
            created_by_thinking="manual",
            created_at="2024-01-01T00:00:00",
            updated_at="2024-01-01T00:00:00",
        )
        graph = GraphResponse(nodes=[node], edges=[edge])
        assert len(graph.nodes) == 1
        assert len(graph.edges) == 1
        assert graph.nodes[0].uid == "n1"
        assert graph.edges[0].source_uid == "n1"


# ---------------------------------------------------------------------------
# PaginationParams
# ---------------------------------------------------------------------------
class TestPaginationParams:
    def test_defaults(self):
        p = PaginationParams()
        assert p.limit == 100
        assert p.offset == 0

    def test_custom(self):
        p = PaginationParams(limit=50, offset=10)
        assert p.limit == 50
        assert p.offset == 10

    def test_limit_lower_bound(self):
        with pytest.raises(ValidationError):
            PaginationParams(limit=0)

    def test_limit_upper_bound(self):
        with pytest.raises(ValidationError):
            PaginationParams(limit=1001)

    def test_offset_non_negative(self):
        with pytest.raises(ValidationError):
            PaginationParams(offset=-1)


# ---------------------------------------------------------------------------
# FilterParams
# ---------------------------------------------------------------------------
class TestFilterParams:
    def test_all_none(self):
        f = FilterParams()
        assert f.node_type is None
        assert f.needs_review is None
        assert f.search_query is None
        assert f.tags is None
        assert f.confidence is None
        assert f.status is None

    def test_with_filters(self):
        f = FilterParams(node_type="paper", needs_review=True, tags=["GIS"])
        assert f.node_type == "paper"
        assert f.tags == ["GIS"]
        assert f.needs_review is True
