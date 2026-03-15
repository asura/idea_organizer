import logging
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from neomodel import config as neomodel_config
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from backend.analytics.duckdb_client import init_duckdb
from backend.api.router import router
from backend.config import settings

perf_logger = logging.getLogger("perf")


class TimingMiddleware(BaseHTTPMiddleware):
    """Log request processing time and add X-Response-Time-Ms header."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        perf_logger.info(
            "[PERF:HTTP] %s %s -> %d (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.1f}"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup: configure Neo4j connection
    neomodel_config.DATABASE_URL = (  # type: ignore[attr-defined]
        f"bolt://{settings.neo4j_user}:{settings.neo4j_password}"
        f"@{settings.neo4j_uri.removeprefix('bolt://')}"
    )

    # Startup: initialize DuckDB via the shared analytics client
    conn = init_duckdb(settings.duckdb_path)
    app.state.duckdb = conn

    yield

    # Shutdown: close DuckDB connection
    conn.close()


app = FastAPI(
    title="Research Idea Organizer API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Response-Time-Ms"],
)

if settings.enable_perf_logging:
    app.add_middleware(TimingMiddleware)
    logging.basicConfig(level=logging.INFO)
    perf_logger.setLevel(logging.INFO)

app.include_router(router)
