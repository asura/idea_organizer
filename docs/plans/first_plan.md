# Research Idea Organizer - Implementation Plan

## Context

研究者が研究アイデアを property graph として整理する個人用ツール。
概念・文献・アイデア・論点・エビデンスとその関係を、**曖昧さ・確信度を保ったまま**可視化・編集できる。

**成功条件**: 最初は雑に置ける → 後から型付けできる → 意味を残せる → 観点で見直せる

**利用形態**: 個人ローカル (Docker + ブラウザ)
**初期ゴール**: Phase 1 = Sprint 0-3 (Backend + 基本UI + 結合)
**言語方針**: コードは英語、コメント/README は日本語OK

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Pydantic v2 |
| Graph DB | Neo4j 5.x (Docker) + neomodel 6.0+ |
| Analytics/History | DuckDB (embedded) |
| Frontend | React 18 + TypeScript + Vite |
| Graph UI | React Flow (@xyflow/react v12) |
| State Management | Zustand |
| Pkg Mgmt | uv (Python), npm (Frontend) |

---

## Directory Structure

```
idea_organizer/
├── docker-compose.yml
├── pyproject.toml
├── .env.example / .gitignore
├── backend/
│   ├── main.py                    # FastAPI app + lifespan
│   ├── config.py                  # pydantic-settings
│   ├── models/
│   │   ├── enums.py               # NodeType, EdgeType, Confidence, Status
│   │   ├── base.py                # 共通mixin (uid, timestamps, memo)
│   │   ├── nodes.py               # 5 node types (neomodel StructuredNode)
│   │   └── relationships.py       # RESEARCH_EDGE (neomodel StructuredRel)
│   ├── schemas/
│   │   ├── nodes.py               # Pydantic v2 request/response
│   │   ├── edges.py
│   │   ├── graph.py               # GraphResponse (bulk)
│   │   └── common.py              # Pagination, Filter
│   ├── api/
│   │   ├── router.py              # APIRouter集約
│   │   ├── nodes.py               # /api/nodes CRUD
│   │   ├── edges.py               # /api/edges CRUD
│   │   ├── graph.py               # /api/graph (full + neighborhood)
│   │   └── search.py              # /api/search
│   ├── services/
│   │   ├── node_service.py
│   │   ├── edge_service.py
│   │   ├── graph_service.py
│   │   └── search_service.py
│   ├── analytics/
│   │   ├── duckdb_client.py       # DuckDB init + connection
│   │   └── event_log.py           # Event sourcing (undo/redo用の基盤だけ)
│   └── tests/
│       ├── conftest.py
│       ├── test_node_crud.py
│       └── test_edge_crud.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts / tsconfig.json
│   └── src/
│       ├── App.tsx
│       ├── api/                    # client.ts, nodes.ts, edges.ts, graph.ts
│       ├── store/                  # graphStore.ts, uiStore.ts
│       ├── types/                  # node.ts, edge.ts
│       ├── components/
│       │   ├── Canvas/             # GraphCanvas, CustomNode, CustomEdge
│       │   └── Toolbar/            # MainToolbar, QuickInput
│       ├── hooks/                  # useGraphData
│       └── utils/                  # colors.ts, edgeStyles.ts
└── scripts/
    ├── init_neo4j.py
    └── dev.sh
```

---

## Key Design Decisions

1. **単一 relationship type**: `RESEARCH_EDGE` + `edge_type` property で MVP をシンプルに
2. **Quick rough input**: 全ノードに `needs_review: bool`。タイトルだけで即座作成
3. **Undo/Redo 基盤のみ**: DuckDB event log テーブルは作るが、Phase 1 では undo/redo API は実装しない
4. **neomodel sync mode**: FastAPI sync endpoints で開始
5. **WebSocket なし**: 個人利用なのでリアルタイム同期は不要。通常の HTTP でシンプルに
6. **Node position**: Neo4j ノードの x/y property として保存

---

## Sprint 0: Project Scaffolding

> 0A (Backend) と 0B (Frontend) は **並列実行可能**

### 0A: Backend Scaffolding
**作成ファイル:**
- `pyproject.toml` — fastapi, uvicorn, neomodel, duckdb, pydantic-settings, pytest, mypy strict, ruff
- `docker-compose.yml` — Neo4j 5.x (ports: 7474, 7687)
- `.env.example` — NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, DUCKDB_PATH
- `.gitignore`
- `backend/main.py` — FastAPI app factory, lifespan hook (neomodel connect + DuckDB init)
- `backend/config.py` — pydantic-settings Settings class
- 空の `__init__.py` 群
- `backend/tests/conftest.py` — TestClient fixture

### 0B: Frontend Scaffolding
**作成ファイル:**
- `frontend/` — Vite + React 18 + TypeScript プロジェクト
- Dependencies: `@xyflow/react`, `zustand`, `axios`, `@dagrejs/dagre`
- `vite.config.ts` — API proxy → localhost:8000
- `frontend/src/App.tsx` — React Flow 空キャンバス placeholder

---

## Sprint 1: Core Data Layer

> 1A と 1B は並列可能。1C は 1A+1B 完了後。1D は独立して並列可能。

### 1A: Neo4j Models (neomodel)
**ファイル:** `backend/models/enums.py`, `base.py`, `nodes.py`, `relationships.py`

- `enums.py`: NodeType(5種), EdgeType(8種), Confidence(high/medium/low), EdgeStatus(idea/plausible/checked/rejected)
- `base.py`: uid (UniqueIdProperty), created_at, updated_at, memo
- `nodes.py`: 5つの StructuredNode (Concept, Paper, Idea, Question, Evidence)
  - 全ノード共通: title, node_type, needs_review, tags, position_x, position_y
  - Concept: aliases, description, domain, importance, status
  - Paper: year, authors, venue, url, summary, contribution, limitations, read_status
  - Idea: description, motivation, novelty_claim, feasibility_note, priority, status
  - Question: description, category, urgency, status
  - Evidence: content, source, reliability, date, linked_excerpt
- `relationships.py`: ResearchRelationship(StructuredRel) — edge_type, confidence, status, note, evidence, created_by_thinking

### 1B: Pydantic Schemas
**ファイル:** `backend/schemas/nodes.py`, `edges.py`, `graph.py`, `common.py`

- NodeCreate: `title` のみ必須、他は全て Optional（雑入力対応）
- EdgeCreate: source_uid + target_uid 必須、edge_type デフォルト RELATES_TO、confidence デフォルト medium
- GraphResponse: `nodes: list[NodeResponse]`, `edges: list[EdgeResponse]`

### 1C: API Endpoints + Services
**ファイル:** `backend/api/nodes.py`, `edges.py`, `graph.py`, `search.py`, `router.py`, `backend/services/node_service.py`, `edge_service.py`, `graph_service.py`, `search_service.py`

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/nodes | ノード作成 |
| GET | /api/nodes | 一覧 (filter/pagination) |
| GET | /api/nodes/{uid} | 取得 |
| PATCH | /api/nodes/{uid} | 更新 |
| DELETE | /api/nodes/{uid} | 削除 (+接続エッジも削除) |
| POST | /api/edges | エッジ作成 |
| GET | /api/edges/{uid} | 取得 |
| PATCH | /api/edges/{uid} | 更新 |
| DELETE | /api/edges/{uid} | 削除 |
| GET | /api/graph | 全グラフ取得 |
| GET | /api/graph/neighborhood/{uid} | N-hop 近傍 |
| GET | /api/search?q=... | 全文検索 |

### 1D: DuckDB Event Log (基盤のみ)
**ファイル:** `backend/analytics/duckdb_client.py`, `event_log.py`

- events テーブル作成 (event_id, timestamp, entity_type, entity_uid, action, old_data, new_data)
- `log_event()` 関数。各 service の mutation 時に呼ぶ
- Phase 1 では undo/redo API は未実装（テーブルへの記録のみ）

### 1E: Backend Tests
**ファイル:** `backend/tests/test_node_crud.py`, `test_edge_crud.py`
- Node: 5型の作成・最小入力での作成・更新・削除
- Edge: 作成・confidence/status 更新・削除

---

## Sprint 2: Basic Graph UI

> Sprint 1 と **並列実行可能**。0B 完了後すぐ開始。

### 2A: TypeScript Types + Zustand Store
**ファイル:** `frontend/src/types/node.ts`, `edge.ts`, `store/graphStore.ts`, `store/uiStore.ts`

- Types: backend schemas のミラー
- graphStore: nodes/edges 配列 + React Flow change handlers + CRUD actions
- uiStore: selectedNodeId, selectedEdgeId, filters

### 2B: Canvas + Custom Nodes/Edges
**ファイル:** `frontend/src/components/Canvas/GraphCanvas.tsx`, `CustomNode.tsx`, `CustomEdge.tsx`, `utils/colors.ts`, `utils/edgeStyles.ts`

- **CustomNode**: type別カラー (Concept=青, Paper=緑, Idea=黄, Question=赤, Evidence=灰)
  - needs_review=true → opacity 低下
  - タイトル + type アイコン表示
- **CustomEdge**: confidence→線種 (solid/dashed/dotted), status→色 (gray/blue/green/red)
  - edge_type ラベル表示
- **GraphCanvas**: React Flow wrapper、onConnect でエッジ作成、ダブルクリックでノード作成

### 2C: Toolbar + QuickInput
**ファイル:** `frontend/src/components/Toolbar/MainToolbar.tsx`, `QuickInput.tsx`

- MainToolbar: ノード追加ボタン (type選択ドロップダウン)
- QuickInput: Cmd+K で起動。タイトル入力 → Enter で即座にノード作成 (`needs_review=true`)
  - prefix対応: `p:論文名` → Paper, `c:概念名` → Concept, `i:アイデア` → Idea, `q:質問` → Question, `e:メモ` → Evidence

---

## Sprint 3: Integration

> Sprint 1 + 2 完了後

### 3A: API Client Layer
**ファイル:** `frontend/src/api/client.ts`, `nodes.ts`, `edges.ts`, `graph.ts`
- axios instance (baseURL: '/api', Vite proxy経由)
- 各 endpoint の関数

### 3B: Store ↔ API 接続
**更新:** `graphStore.ts`, `frontend/src/hooks/useGraphData.ts`
- loadGraph() で fetchFullGraph() → React Flow format に変換 (position_x/y → position)
- CRUD actions を API 呼び出しに接続
- dagre による初期レイアウト (position が未設定のノード用)

### 3C: Auto-save + Position Persistence
**ファイル:** `frontend/src/hooks/useAutoSave.ts`
- ノードドラッグ後に position を PATCH で保存 (debounce 500ms)

---

## Phase 1 完了時の Verification

1. `docker compose up -d` → Neo4j 起動確認 (localhost:7474)
2. `uv run pytest` → バックエンドテスト全パス
3. `scripts/dev.sh` → backend (uvicorn) + frontend (vite) 同時起動
4. ブラウザ (localhost:5173) で以下を確認:
   - ダブルクリックでノード作成
   - Cmd+K で QuickInput → タイトルのみでノード作成
   - ノード間をドラッグしてエッジ作成
   - ノード/エッジの type 別ビジュアル (色、線種) が正しい
   - ノードのドラッグ移動 → 位置が永続化される
   - API 経由で検索が動作する

---

## Phase 2 以降 (後回し)

- Sprint 4: 右ペイン詳細編集、検索UI、フィルタUI、Undo/Redo
- Sprint 5: テンプレート、未分類一覧、auto-layout、ビジュアルポリッシュ
- Future: WebSocket同期、共同編集、AI支援、分析ダッシュボード
