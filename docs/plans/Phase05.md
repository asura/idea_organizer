# 「新規作成」機能の追加

## Context
現在のIdea Organizerはワークスペース概念がなく、Neo4j上に1つのフラットなグラフのみ存在する。
新しい検討テーマを開始するには、既存データを保存→DBクリア→空キャンバスで開始、という流れが必要。
既存のJSON保存/読込機能を拡張し、「新規作成」ボタンを追加する。

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `backend/services/graph_service.py` | `clear_graph()` 関数追加 |
| `backend/api/graph.py` | `POST /graph/clear` エンドポイント追加 |
| `frontend/src/api/graph.ts` | `clearGraph()` API関数追加 |
| `frontend/src/store/graphStore.ts` | `clearGraph` アクション追加 |
| `frontend/src/components/Toolbar/MainToolbar.tsx` | 「新規作成」ボタン追加 |
| `backend/tests/test_graph_clear.py` | ユニットテスト追加 |

## 実装手順

### Step 1: Backend サービス関数
**`backend/services/graph_service.py`**

```python
from backend.analytics.event_log import log_event  # 追加

def clear_graph() -> GraphResponse:
    """全ノード・エッジを削除し、空のグラフを返す。"""
    log_event("graph", "*", "clear")
    db.cypher_query("MATCH (n:ResearchNode) DETACH DELETE n")
    return GraphResponse(nodes=[], edges=[])
```

- `MATCH (n:ResearchNode) DETACH DELETE n` は既存の `load_graph_from_file` L103 で使用済みのパターン
- `log_event` で DuckDB にイベント記録（既存の node_service/edge_service と同パターン）

### Step 2: Backend APIエンドポイント
**`backend/api/graph.py`**

```python
@router.post("/clear", response_model=GraphResponse)
def clear_graph() -> GraphResponse:
    """全ノード・エッジを削除し、新しい空のグラフを開始する。"""
    return graph_service.clear_graph()
```

- リクエストボディ不要、`GraphResponse`（空リスト）を返す

### Step 3: Frontend API クライアント
**`frontend/src/api/graph.ts`**

```typescript
export async function clearGraph(): Promise<GraphData> {
  const { data } = await api.post('/graph/clear');
  return data;
}
```

### Step 4: Zustand ストアアクション
**`frontend/src/store/graphStore.ts`**

- `GraphState` interfaceに `clearGraph: () => Promise<void>` を追加
- 実装:

```typescript
clearGraph: async () => {
  set({ isLoading: true, error: null });
  try {
    await graphApi.clearGraph();
    set({ nodes: [], edges: [], isLoading: false });
  } catch (err) {
    console.error('Failed to clear graph:', err);
    set({ isLoading: false, error: 'Failed to clear graph' });
    throw err;
  }
},
```

### Step 5: ツールバーUI
**`frontend/src/components/Toolbar/MainToolbar.tsx`**

- `useTemporalStore()` の destructure に `clear` を追加（zundo で確認済み）
- ハンドラ追加:

```typescript
const handleNewGraph = useCallback(async () => {
  if (!window.confirm(
    '現在のグラフはすべて削除されます。保存していない場合はデータが失われます。続行しますか？'
  )) return;
  try {
    await clearGraph();
    clear();  // undo/redo 履歴もクリア
  } catch {
    window.alert('初期化に失敗しました');
  }
}, [clearGraph, clear]);
```

- 保存/読込ボタンの前にティール色の「+ 新規作成」ボタンを配置:

```
[+ 新規作成] [保存] [読込]
 ティール色    グレー   グレー
```

### Step 6: テスト
**`backend/tests/test_graph_clear.py`**

- `clear_graph()` が正しいCypherを発行すること
- 空の `GraphResponse` を返すこと
- `log_event` が呼ばれること

## 検証方法

1. `uv run pytest -m "not integration"` — 既存テスト + 新規テスト通過
2. `uv run ruff check backend/` + `uv run mypy backend/` — lint/型チェック通過
3. `cd frontend && npx tsc -b && npm run lint` — フロントエンドチェック通過
4. 手動確認:
   - ノードを数個作成 → 「新規作成」クリック → 確認ダイアログ表示
   - キャンセル → 何も変わらない
   - OK → キャンバスが空になる、undo履歴もクリア
   - 「読込」で以前保存したJSONを読み込めること
