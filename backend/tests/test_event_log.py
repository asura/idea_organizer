"""Tests for DuckDB event log (uses in-memory / temp-file database).

Each test gets an isolated DuckDB instance via the ``duckdb_conn`` fixture,
so no external services are required.
"""

import json

import pytest

from backend.analytics import event_log


@pytest.fixture(autouse=True)
def _setup_duckdb(duckdb_conn):
    """Ensure every test in this module uses a fresh DuckDB instance."""


class TestLogEvent:
    def test_log_create_event(self):
        event_id = event_log.log_event(
            entity_type="node",
            entity_uid="node-123",
            action="create",
            new_data={"title": "Test Node", "node_type": "concept"},
        )
        assert event_id is not None
        assert len(event_id) == 36  # UUID format (8-4-4-4-12)

    def test_log_update_event(self):
        event_id = event_log.log_event(
            entity_type="node",
            entity_uid="node-123",
            action="update",
            old_data={"title": "Old Title"},
            new_data={"title": "New Title"},
        )
        assert event_id is not None

    def test_log_delete_event(self):
        event_id = event_log.log_event(
            entity_type="edge",
            entity_uid="edge-456",
            action="delete",
            old_data={"source_uid": "a", "target_uid": "b"},
        )
        assert event_id is not None

    def test_log_event_without_optional_data(self):
        event_id = event_log.log_event(
            entity_type="node",
            entity_uid="node-789",
            action="create",
        )
        assert event_id is not None

    def test_event_ids_are_unique(self):
        id1 = event_log.log_event("node", "n1", "create")
        id2 = event_log.log_event("node", "n2", "create")
        assert id1 != id2


class TestGetRecentEvents:
    def test_get_recent_events(self):
        event_log.log_event("node", "n1", "create", new_data={"title": "A"})
        event_log.log_event("node", "n2", "create", new_data={"title": "B"})
        event_log.log_event("edge", "e1", "create", new_data={"type": "SUPPORTS"})

        events = event_log.get_recent_events(limit=10)
        assert len(events) == 3
        # Most recent first
        assert events[0]["entity_uid"] == "e1"

    def test_get_recent_events_pagination(self):
        for i in range(5):
            event_log.log_event("node", f"n{i}", "create")

        page1 = event_log.get_recent_events(limit=2, offset=0)
        page2 = event_log.get_recent_events(limit=2, offset=2)
        assert len(page1) == 2
        assert len(page2) == 2
        assert page1[0]["entity_uid"] != page2[0]["entity_uid"]

    def test_get_recent_events_empty(self):
        events = event_log.get_recent_events(limit=10)
        assert events == []

    def test_event_data_roundtrip(self):
        """Verify that old_data / new_data survive the JSON roundtrip."""
        original = {"title": "Test", "tags": ["a", "b"]}
        event_log.log_event(
            "node",
            "n1",
            "create",
            new_data=original,
        )
        events = event_log.get_recent_events(limit=1)
        assert len(events) == 1
        stored = events[0]["new_data"]
        # DuckDB may return the JSON as a string or a dict depending on version
        if isinstance(stored, str):
            stored = json.loads(stored)
        assert stored["title"] == "Test"
        assert stored["tags"] == ["a", "b"]

    def test_event_columns_present(self):
        event_log.log_event("node", "n1", "create")
        events = event_log.get_recent_events(limit=1)
        row = events[0]
        expected_keys = {
            "event_id",
            "timestamp",
            "entity_type",
            "entity_uid",
            "action",
            "old_data",
            "new_data",
        }
        assert set(row.keys()) == expected_keys
