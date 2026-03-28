# Research Idea Organizer

研究アイデアを **プロパティグラフ** として整理する個人用ツール。
概念・文献・アイデア・論点・エビデンス・仮説・判断とその関係を、曖昧さ・確信度を保ったまま可視化・編集できる。

## クイックスタート

```bash
# 一括起動（推奨）
./scripts/dev.sh
```

ブラウザで http://localhost:5173 を開く。

### 手動起動

```bash
# 1. Neo4j 起動（podman）
podman run -d \
  --name idea-organizer-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password123 \
  -e 'NEO4J_PLUGINS=["apoc"]' \
  -v idea_organizer_neo4j_data:/data \
  docker.io/library/neo4j:5-community

# 2. バックエンド起動
uv run uvicorn backend.main:app --reload --port 8000

# 3. フロントエンド起動
cd frontend && npm run dev
```

## 使い方

### ノードの作成

| 方法 | 操作 |
|------|------|
| ダブルクリック | キャンバスの空白をダブルクリック → デフォルトのConceptノードを作成 |
| QuickInput | `Cmd+K`（macOS）/ `Ctrl+K` → タイトルを入力して Enter |
| ツールバー | 上部ツールバーのタイプ別ボタンをクリック |

### QuickInput のプレフィックス

タイトルの先頭にプレフィックスを付けると、ノードタイプを指定できる：

| プレフィックス | タイプ | 例 |
|:---:|--------|-----|
| `c:` | Concept（概念） | `c:強化学習` |
| `p:` | Paper（文献） | `p:Attention Is All You Need` |
| `i:` | Idea（アイデア） | `i:GNNで因果推論できるか` |
| `q:` | Question（論点） | `q:サンプル効率の限界は？` |
| `e:` | Evidence（エビデンス） | `e:Table 3の結果` |
| `h:` | Hypothesis（仮説） | `h:GNNは因果構造の復元に有効` |
| `d:` | Decision（判断） | `d:分離＋後段fusionを採用` |

プレフィックスなしの場合は Concept として作成される。
すべてのノードは `needs_review=true` で作成され、後から詳細を追記できる。

### エッジの作成

ノードのハンドル（端の丸い点）からドラッグして別のノードに接続する。
デフォルトのエッジタイプは `RELATES_TO`、確信度は `medium`。

### ノードの移動

ノードをドラッグして移動できる。位置は自動保存される（500ms debounce）。

## ノードタイプ

| タイプ | 色 | 用途 |
|--------|:---:|------|
| Concept | 🔵 青 | 概念・用語の整理 |
| Paper | 🟢 緑 | 文献の記録 |
| Idea | 🟡 黄 | 研究アイデア |
| Question | 🔴 赤 | 未解決の論点・疑問 |
| Evidence | ⚪ 灰 | データ・実験結果・引用 |
| Hypothesis | 🟣 紫 | 検証可能な仮説の管理 |
| Decision | 🟠 橙 | 研究方針の採否判断ログ |

## エッジタイプ

| タイプ | 意味 |
|--------|------|
| RELATES_TO | 一般的な関連 |
| SUPPORTS | 支持する |
| CONTRADICTS | 矛盾する |
| EXTENDS | 拡張する |
| REQUIRES | 前提とする |
| INSPIRES | 着想を得た |
| EVALUATES | 評価する |
| COMPETES_WITH | 競合する |

エッジの見た目は属性によって変わる：
- **確信度（confidence）** → 線種：high=実線、medium=破線、low=点線
- **ステータス（status）** → 色：idea=灰、plausible=青、checked=緑、rejected=赤

## 活用テンプレート

具体的な使い方のシナリオは [docs/usage-templates.md](docs/usage-templates.md) を参照：
- **① 課題山積の研究で解決策を整理する場合** — Question→Concept→Idea の流れで課題と解決策をマッピング
- **② 新規研究の提案をしたい場合** — 核アイデアから放射状に概念・先行研究・論点を展開し、提案書のストーリーを構築
- **③ 仮説駆動で研究を進める場合** — Hypothesisノードを中心に、根拠・検証計画・結果を構造化
- **④ 研究方針の採否を記録する場合** — Decisionノードで採用/保留/却下/棚上げを判断理由とセットで記録

## アーキテクチャ

```
Browser (localhost:5173)
  └── React + React Flow + Zustand
        └── Vite Proxy (/api → :8000)
              └── FastAPI (localhost:8000)
                    ├── Neo4j 5.x (localhost:7687) — グラフDB
                    └── DuckDB (data/events.duckdb) — イベントログ
```

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| `GET` | `/api/health` | ヘルスチェック |
| `POST` | `/api/nodes` | ノード作成 |
| `GET` | `/api/nodes` | ノード一覧（フィルタ・ページネーション） |
| `GET` | `/api/nodes/{uid}` | ノード取得 |
| `PATCH` | `/api/nodes/{uid}` | ノード更新 |
| `DELETE` | `/api/nodes/{uid}` | ノード削除（接続エッジも削除） |
| `POST` | `/api/edges` | エッジ作成 |
| `GET` | `/api/edges/{uid}` | エッジ取得 |
| `PATCH` | `/api/edges/{uid}` | エッジ更新 |
| `DELETE` | `/api/edges/{uid}` | エッジ削除 |
| `GET` | `/api/graph` | 全グラフ取得 |
| `GET` | `/api/graph/neighborhood/{uid}` | N-hop 近傍取得 |
| `POST` | `/api/graph/save` | グラフ保存（名前付き） |
| `POST` | `/api/graph/load` | グラフ読み込み |
| `GET` | `/api/search?q=...` | 全文検索 |

## 開発

```bash
# テスト実行
uv run pytest

# 型チェック
uv run mypy backend --strict

# Lint
uv run ruff check backend
```

## 現在の開発状況

### Phase 1（完了 ✅）
- Sprint 0: プロジェクト基盤（Backend + Frontend scaffolding）
- Sprint 1: データ層（Neo4j models, Pydantic schemas, API, Services, Tests）
- Sprint 2: グラフUI（CustomNode/Edge, Toolbar, QuickInput）
- Sprint 3: 結合（API client, Store↔API接続, Auto-save）

### Phase 2（完了 ✅）
- 削除・編集UI（右サイドバー詳細パネル、コンテキストメニュー）
- Undo/Redo（zundo + Zustand temporal middleware）

### Phase 3（完了 ✅）
- グラフの保存/読み込み（JSON ファイルへの save/load）

### Phase 4（完了 ✅）
- 仮説（Hypothesis）ノードタイプの追加
- パフォーマンス計測基盤の導入

### Phase 5（完了 ✅）
- 判断（Decision）ノードタイプの追加
- MiniMap の Hypothesis 色表示修正

### 今後の構想
- 検索UI、フィルタUI、テンプレート、auto-layout
- WebSocket同期、共同編集、AI支援、分析ダッシュボード

詳細な計画は [docs/plans/](docs/plans/) を参照（Phase01〜Phase04）。
