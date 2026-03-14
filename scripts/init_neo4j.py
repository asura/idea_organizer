"""Initialize Neo4j indexes and constraints for the Research Idea Organizer."""

from neomodel import config, db

from backend.config import Settings


def init() -> None:
    """Create fulltext indexes on ResearchNode title and memo fields."""
    settings = Settings()
    config.DATABASE_URL = (
        f"bolt://{settings.neo4j_user}:{settings.neo4j_password}"
        f"@{settings.neo4j_uri.removeprefix('bolt://')}"
    )

    db.cypher_query("""
        CREATE FULLTEXT INDEX node_title_fulltext IF NOT EXISTS
        FOR (n:ResearchNode) ON EACH [n.title, n.memo]
    """)
    print("Fulltext index created successfully.")  # noqa: T201


if __name__ == "__main__":
    init()
