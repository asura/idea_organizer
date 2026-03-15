# 計画: 仮説ノード追加 + パフォーマンス計測

## Context
- 研究アイデアの知識管理ツールに「仮説」(hypothesis) タイプのノードを追加する
- 編集結果の画面反映が遅い問題がある（~50ノードの小規模グラフで発生）
- パフォーマンスは**まず計測**し、事実に基づいて対策を決める

---

## Task 1: 仮説ノードタイプの追加

既存の5タイプ (concept/paper/idea/question/evidence) と同じパターンで機械的に追加する。

### 仮説ノード固有フィールド
| フィールド | 型 | 説明 |
|---|---|---|
| statement | str | 仮説の主張 |
| basis | str | 根拠・背景 |
| testability_note | str | 検証可能性メモ |
| confidence_level | str (high/medium/low) | 確信度（既存Confidence enumを再利用） |
| hypothesis_status | str (draft/testing/supported/refuted/revised) | 状態 |

### 変更ファイル（バックエンド）

1. **`backend/models/enums.py`** — `NodeType`に`HYPOTHESIS = "hypothesis"`追加、`HypothesisStatus` StrEnum新規追加
2. **`backend/models/nodes.py`** — ResearchNodeに5つのStringProperty追加（evidence blockの後）
3. **`backend/schemas/nodes.py`** — NodeCreate/NodeUpdate/NodeResponseに仮説フィールド追加
4. **`backend/services/node_service.py`** — `_node_to_response`に仮説フィールドのマッピング追加

### 変更ファイル（フロントエンド）

5. **`frontend/src/types/node.ts`** — NodeType unionに`'hypothesis'`追加、ResearchNodeDataに5フィールド追加
6. **`frontend/src/utils/colors.ts`** — 紫系の色 `#8B5CF6`、アイコン🧪、ラベル「仮説」
7. **`frontend/src/components/Toolbar/QuickInput.tsx`** — `h:` プレフィックス追加
8. **`frontend/src/components/Toolbar/MainToolbar.tsx`** — NODE_TYPESとNODE_BUTTON_COLORSに追加
9. **`frontend/src/components/DetailPanel/NodeEditPanel.tsx`** — HypothesisFieldsコンポーネント追加（既存パターンに従いファイル内に定義）、NODE_TYPE_OPTIONSに追加

### テスト

10. **`backend/tests/test_enums.py`** — NodeType数を6に更新、HypothesisStatusテスト追加
11. **`backend/tests/test_schemas.py`** — hypothesis用のcreate/optionalテスト追加

---

## Task 2: パフォーマンス計測の仕込み

推測で最適化せず、3層で計測して事実ベースでボトルネックを特定する。
環境変数で ON/OFF 可能にし、OFFのときオーバーヘッドゼロ。

### 計測ポイント

```
[ユーザー操作] → [フロントエンド Store] → [API通信(axios)] → [バックエンドAPI] → [Neo4jクエリ]
                  ↑ PERF:STORE              ↑ PERF:API          ↑ PERF:HTTP       ↑ PERF:DB
```

### 変更ファイル

1. **`backend/config.py`** — `enable_perf_logging: bool = False` 追加（env: `ENABLE_PERF_LOGGING`）
2. **`backend/services/perf.py`** (新規) — `timed_operation` コンテキストマネージャ
3. **`backend/main.py`** — TimingMiddleware追加（条件付き）、CORSに`expose_headers=["X-Response-Time-Ms"]`追加
4. **`backend/services/graph_service.py`** — get_full_graph内のnodes取得/edges取得を`timed_operation`で計測
5. **`backend/services/node_service.py`** — create_node/update_node/get_nodeを計測
6. **`backend/services/edge_service.py`** — create_edge/update_edgeを計測
7. **`frontend/src/api/client.ts`** — axios interceptorで往復時間+サーバー処理時間をconsole.log（`VITE_PERF_LOGGING=true`で有効）
8. **`frontend/src/store/graphStore.ts`** — 主要アクション(loadGraph/addNode/updateNode等)の実行時間をconsole.log

### 有効化方法
- バックエンド: `.env`に`ENABLE_PERF_LOGGING=true`
- フロントエンド: `frontend/.env.development`に`VITE_PERF_LOGGING=true`
- デフォルトはすべてOFF

---

## 実装順序

1. Task 1 バックエンド (enums → models → schemas → service → tests)
2. Task 1 フロントエンド (types → colors → QuickInput → MainToolbar → NodeEditPanel)
3. Task 2 バックエンド (config → perf.py → middleware → service計測)
4. Task 2 フロントエンド (client.ts → graphStore.ts)

## 検証方法

1. `uv run ruff check backend/ && uv run mypy backend/ && uv run pytest` — バックエンド全チェック
2. `cd frontend && npx tsc -b && npm run lint` — フロントエンド型チェック・lint
3. `ENABLE_PERF_LOGGING=true uv run uvicorn backend.main:app --reload` + `VITE_PERF_LOGGING=true npm run dev` で起動し、ノード作成・編集時のログを確認
4. 計測結果をもとに、ボトルネックが Network / Neo4j / 描画 のどこかを特定 → 次のアクションを決定
