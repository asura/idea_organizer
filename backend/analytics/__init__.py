"""DuckDB-backed analytics and event logging."""

from backend.analytics.duckdb_client import get_connection, init_duckdb
from backend.analytics.event_log import get_recent_events, log_event

__all__ = [
    "get_connection",
    "get_recent_events",
    "init_duckdb",
    "log_event",
]
