# Graph Save/Load機能

## Context
現在、グラフの編集結果はNeo4jにのみ保存される。物理ファイル（JSON）へのsave/loadを追加し、グラフのスナップショットを手軽にバックアップ・復元できるようにする。UIは最小限（`window.prompt`でファイルパス指定）。

## 方針
- サーバーサイドファイルI/O（バックエンドがファイルを読み書き）
- ファイル形式: 既存の`GraphResponse`スキーマそのままのJSON
- Load時は既存グラフを全削除して置換

## 変更ファイル一覧

### 1. `backend/schemas/graph.py` — リクエストスキーマ追加
- `FilePathRequest(BaseModel)` を追加: `file_path: str`

### 2. `backend/services/graph_service.py` — Save/Loadロジック
**`save_graph_to_file(file_path: str) -> int`**
- `get_full_graph()` で`GraphResponse`取得
- `model_dump_json(indent=2)` でJSON化し `pathlib.Path.write_text()` で保存
- 親ディレクトリ不在時は `ValueError` 送出
- 保存した要素数（nodes + edges）を返却

**`load_graph_from_file(file_path: str) -> GraphResponse`**
1. ファイル読み込み → `GraphResponse.model_validate_json()` でパース
2. 既存データ全削除: `MATCH (n:ResearchNode) DETACH DELETE n`
3. ノード作成: 各`NodeResponse`のpropsで `ResearchNode(**props).save()`
   - `uid`は明示的に指定（auto-generateを上書き）
   - `created_at`/`updated_at`はneomodelのDateTimePropertyが自動設定するため、Cypherで後から上書き
4. エッジ作成: 各`EdgeResponse`に対しCypherで`CREATE (s)-[r:RESEARCH_EDGE {...}]->(t)`
   - `uid`, `edge_type`, `confidence`, `status`, `note`, `evidence`, `created_by_thinking`, timestamps をすべて保持
5. 作成後の`GraphResponse`を返却

### 3. `backend/api/graph.py` — エンドポイント追加
- `POST /graph/save` — `FilePathRequest`受取、`save_graph_to_file`呼出、メッセージ返却
- `POST /graph/load` — `FilePathRequest`受取、`load_graph_from_file`呼出、`GraphResponse`返却
- エラー: 404(ファイル不在), 400(不正JSON/パス不正)

### 4. `frontend/src/api/graph.ts` — API関数追加
- `saveGraphToFile(filePath: string) -> Promise<{ message: string }>`
- `loadGraphFromFile(filePath: string) -> Promise<GraphData>`

### 5. `frontend/src/store/graphStore.ts` — ストアアクション追加
- `saveToFile(filePath: string) -> Promise<string>` — API呼出、メッセージ返却
- `loadFromFile(filePath: string) -> Promise<void>` — API呼出、結果を`toRFNode`/`toRFEdge`変換してset

### 6. `frontend/src/components/Toolbar/MainToolbar.tsx` — UI追加
- Undo/Redoボタンの隣に「保存」「読込」ボタン追加
- `window.prompt()` でファイルパス入力（デフォルト: `/tmp/graph.json`）
- Load時は `window.confirm()` で上書き確認

## 実装順序
1. Schema (`backend/schemas/graph.py`)
2. Service (`backend/services/graph_service.py`)
3. API (`backend/api/graph.py`)
4. Frontend API (`frontend/src/api/graph.ts`)
5. Frontend Store (`frontend/src/store/graphStore.ts`)
6. Frontend UI (`frontend/src/components/Toolbar/MainToolbar.tsx`)

## 検証
- `./scripts/check.sh` でlint/type/testパス確認
- 手動テスト: save → ファイル内容確認 → load → グラフ復元確認
