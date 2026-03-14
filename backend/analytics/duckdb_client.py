"""DuckDB connection management for the analytics event log."""

from pathlib import Path

import duckdb

_connection: duckdb.DuckDBPyConnection | None = None


def init_duckdb(db_path: str) -> duckdb.DuckDBPyConnection:
    """Initialize DuckDB and create the events table.

    Args:
        db_path: Filesystem path for the DuckDB database file.

    Returns:
        The active DuckDB connection.
    """
    global _connection  # noqa: PLW0603
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    _connection = duckdb.connect(str(path))
    _connection.execute("""
        CREATE TABLE IF NOT EXISTS events (
            event_id VARCHAR PRIMARY KEY,
            timestamp TIMESTAMPTZ DEFAULT current_timestamp,
            entity_type VARCHAR NOT NULL,
            entity_uid VARCHAR NOT NULL,
            action VARCHAR NOT NULL,
            old_data JSON,
            new_data JSON
        )
    """)
    return _connection


def get_connection() -> duckdb.DuckDBPyConnection:
    """Return the active DuckDB connection.

    Raises:
        RuntimeError: If ``init_duckdb`` has not been called yet.
    """
    if _connection is None:
        raise RuntimeError("DuckDB not initialized. Call init_duckdb() first.")
    return _connection
