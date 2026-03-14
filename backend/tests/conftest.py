"""Shared pytest fixtures and configuration."""

from collections.abc import Iterator

import pytest


def pytest_configure(config: pytest.Config) -> None:
    """Register custom markers."""
    config.addinivalue_line(
        "markers",
        "integration: marks tests that require a running Neo4j instance",
    )


@pytest.fixture()
def duckdb_conn(tmp_path):
    """Initialize an isolated DuckDB connection for each test.

    Uses tmp_path so every test gets a fresh database file,
    avoiding global state leakage between tests.
    """
    import backend.analytics.duckdb_client as duckdb_mod
    from backend.analytics.duckdb_client import init_duckdb

    db_path = str(tmp_path / "test_events.duckdb")
    conn = init_duckdb(db_path)
    yield conn

    # Teardown: close connection and reset global state
    conn.close()
    duckdb_mod._connection = None


@pytest.fixture()
def client() -> Iterator:  # type: ignore[type-arg]
    """HTTP test client for integration tests that need the full app."""
    from httpx import ASGITransport, Client

    from backend.main import app

    transport = ASGITransport(app=app)
    with Client(transport=transport, base_url="http://testserver") as c:  # type: ignore[arg-type]
        yield c
