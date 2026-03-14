#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Starting Neo4j via docker compose..."
docker compose up -d

echo "Waiting for Neo4j to be ready..."
until docker compose exec neo4j cypher-shell -u neo4j -p password123 "RETURN 1" >/dev/null 2>&1; do
    echo "  Neo4j not ready yet, retrying in 2s..."
    sleep 2
done
echo "Neo4j is ready."

echo "Starting uvicorn..."
uvicorn backend.main:app --reload --port 8000 &
UVICORN_PID=$!

echo "Starting frontend dev server..."
if [ -d frontend ] && [ -f frontend/package.json ]; then
    cd frontend
    npm run dev &
    VITE_PID=$!
    cd "$PROJECT_ROOT"
else
    echo "  No frontend directory found, skipping Vite."
    VITE_PID=""
fi

cleanup() {
    echo "Shutting down..."
    kill "$UVICORN_PID" 2>/dev/null || true
    [ -n "$VITE_PID" ] && kill "$VITE_PID" 2>/dev/null || true
    docker compose down
}
trap cleanup EXIT

wait
