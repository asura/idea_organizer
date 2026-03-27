"""Tests for the clear_graph service function."""

from unittest.mock import MagicMock, patch

import pytest

from backend.schemas.graph import GraphResponse


@pytest.fixture(autouse=True)
def _setup_duckdb(duckdb_conn):
    """Ensure every test in this module uses a fresh DuckDB instance."""


class TestClearGraph:
    @patch("backend.services.graph_service.db")
    def test_returns_empty_graph_response(self, mock_db: MagicMock) -> None:
        from backend.services.graph_service import clear_graph

        result = clear_graph()

        assert isinstance(result, GraphResponse)
        assert result.nodes == []
        assert result.edges == []

    @patch("backend.services.graph_service.db")
    def test_executes_detach_delete(self, mock_db: MagicMock) -> None:
        from backend.services.graph_service import clear_graph

        clear_graph()

        mock_db.cypher_query.assert_called_once_with(
            "MATCH (n:ResearchNode) DETACH DELETE n"
        )

    @patch("backend.services.graph_service.db")
    @patch("backend.services.graph_service.log_event")
    def test_logs_clear_event(
        self, mock_log: MagicMock, mock_db: MagicMock
    ) -> None:
        from backend.services.graph_service import clear_graph

        clear_graph()

        mock_log.assert_called_once_with("graph", "*", "clear")
