"""Event logging for mutation tracking via DuckDB."""

import json
import uuid
from typing import Any

from backend.analytics.duckdb_client import get_connection


def log_event(
    entity_type: str,
    entity_uid: str,
    action: str,
    old_data: dict[str, Any] | None = None,
    new_data: dict[str, Any] | None = None,
) -> str:
    """Log a mutation event and return the generated event_id.

    Args:
        entity_type: The kind of entity (e.g. ``"node"``, ``"edge"``).
        entity_uid: UID of the affected entity.
        action: Description of the action (e.g. ``"create"``, ``"update"``).
        old_data: Snapshot of the entity before the mutation.
        new_data: Snapshot of the entity after the mutation.

    Returns:
        The UUID string of the newly created event row.
    """
    conn = get_connection()
    event_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO events "
        "(event_id, entity_type, entity_uid, action, old_data, new_data) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        [
            event_id,
            entity_type,
            entity_uid,
            action,
            json.dumps(old_data) if old_data else None,
            json.dumps(new_data) if new_data else None,
        ],
    )
    return event_id


def get_recent_events(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Retrieve recent events ordered by timestamp descending.

    Args:
        limit: Maximum number of events to return.
        offset: Number of events to skip for pagination.

    Returns:
        A list of event dictionaries.
    """
    conn = get_connection()
    result = conn.execute(
        "SELECT * FROM events ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        [limit, offset],
    ).fetchall()
    columns = [
        "event_id",
        "timestamp",
        "entity_type",
        "entity_uid",
        "action",
        "old_data",
        "new_data",
    ]
    return [dict(zip(columns, row, strict=True)) for row in result]
