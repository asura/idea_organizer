#!/bin/bash
# 品質チェック一括実行スクリプト
set -euo pipefail
cd "$(dirname "$0")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
pass() { echo -e "${GREEN}✓ $1${NC}"; }

echo -e "${BOLD}=== Ruff (lint) ===${NC}"
uv run ruff check backend/ && pass "Ruff" || fail "Ruff"

echo -e "\n${BOLD}=== Ruff (format check) ===${NC}"
uv run ruff format --check backend/ && pass "Format" || fail "Format"

echo -e "\n${BOLD}=== Mypy ===${NC}"
uv run mypy backend/ && pass "Mypy" || fail "Mypy"

echo -e "\n${BOLD}=== Pytest ===${NC}"
uv run pytest -q -m "not integration" && pass "Pytest" || fail "Pytest"

echo -e "\n${BOLD}=== ESLint ===${NC}"
(cd frontend && npm run lint) && pass "ESLint" || fail "ESLint"

echo -e "\n${BOLD}=== TypeScript ===${NC}"
(cd frontend && npx tsc -b) && pass "TypeScript" || fail "TypeScript"

echo -e "\n${GREEN}${BOLD}All checks passed.${NC}"
