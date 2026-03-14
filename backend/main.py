from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from neomodel import config as neomodel_config

from backend.analytics.duckdb_client import init_duckdb
from backend.api.router import router
from backend.config import settings


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
)

app.include_router(router)
