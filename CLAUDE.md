# Idea Organizer - Claude Code 設定

## プロジェクト概要
研究アイデアのグラフベース知識管理ツール。
Backend: FastAPI + neomodel (Neo4j) + DuckDB / Frontend: React + TypeScript + Vite + React Flow

## コマンド

### Backend (プロジェクトルートで実行)
- lint: `uv run ruff check backend/`
- format: `uv run ruff format backend/`
- type check: `uv run mypy backend/`
- test: `uv run pytest`
- test (単体のみ): `uv run pytest -m "not integration"`
- サーバ起動: `uv run uvicorn backend.main:app --reload`

### Frontend (`frontend/` で実行)
- lint: `npm run lint`
- type check: `npx tsc -b`
- build: `npm run build`
- dev: `npm run dev`

### 全体チェック (プロジェクトルートで実行)
- `./scripts/check.sh`

## コーディングルール

### Python (backend/)
- ruff (E, F, W, I, UP, B, SIM) + mypy strict に従う
- Python 3.12+ の機能を活用 (type union `X | Y`, etc.)
- Pydantic v2 スタイル (model_config, field_validator)

### TypeScript (frontend/)
- ESLint + TypeScript strict に従う
- Zustand でステート管理、React Flow でグラフ描画

## 構成
```
backend/
  api/          # FastAPI ルーター
  models/       # neomodel ノード/リレーション定義
  schemas/      # Pydantic スキーマ
  services/     # ビジネスロジック
  analytics/    # DuckDB イベントログ
  tests/        # pytest テスト
frontend/
  src/
    components/ # React コンポーネント
    store/      # Zustand ストア
    api/        # axios API クライアント
```

## インフラ
- Neo4j: podman で起動 (`podman run ...` — 詳細は README.md 参照)
- 開発用ポート: Backend 8000 / Frontend 5173 / Neo4j 7474,7687
