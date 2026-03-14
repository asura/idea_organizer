#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

NEO4J_CONTAINER="idea-organizer-neo4j"

# --- Neo4j 起動 (podman run を直接使用) ---
if podman inspect "$NEO4J_CONTAINER" >/dev/null 2>&1; then
    echo "Starting existing Neo4j container..."
    podman start "$NEO4J_CONTAINER"
else
    echo "Creating Neo4j container..."
    podman run -d \
        --name "$NEO4J_CONTAINER" \
        -p 7474:7474 \
        -p 7687:7687 \
        -e NEO4J_AUTH=neo4j/password123 \
        -e 'NEO4J_PLUGINS=["apoc"]' \
        -v idea_organizer_neo4j_data:/data \
        -v idea_organizer_neo4j_logs:/logs \
        docker.io/library/neo4j:5-community
fi

echo "Waiting for Neo4j to be ready..."
for i in $(seq 1 30); do
    if podman exec "$NEO4J_CONTAINER" cypher-shell -u neo4j -p password123 "RETURN 1" >/dev/null 2>&1; then
        echo "Neo4j is ready."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "ERROR: Neo4j did not become ready in time."
        exit 1
    fi
    echo "  Neo4j not ready yet, retrying in 2s... ($i/30)"
    sleep 2
done

# --- Backend 起動 ---
echo "Starting uvicorn..."
uv run uvicorn backend.main:app --reload --port 8000 &
UVICORN_PID=$!

# --- Frontend 起動 ---
VITE_PID=""
if [ -d frontend ] && [ -f frontend/package.json ]; then
    echo "Starting frontend dev server..."
    cd frontend
    npm run dev &
    VITE_PID=$!
    cd "$PROJECT_ROOT"
else
    echo "  No frontend directory found, skipping Vite."
fi

# --- 終了時のクリーンアップ ---
cleanup() {
    echo ""
    echo "Shutting down..."
    kill "$UVICORN_PID" 2>/dev/null || true
    [ -n "$VITE_PID" ] && kill "$VITE_PID" 2>/dev/null || true
    echo "Stopping Neo4j container..."
    podman stop "$NEO4J_CONTAINER" 2>/dev/null || true
    echo "Done."
}
trap cleanup EXIT

echo ""
echo "=== Research Idea Organizer ==="
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000/api/health"
echo "  Neo4j:    http://localhost:7474"
echo "  Press Ctrl+C to stop all services."
echo ""

wait
