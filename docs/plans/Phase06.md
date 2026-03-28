# Decision ノードタイプ追加

## Context

現在のアプリは Concept / Paper / Idea / Question / Evidence / Hypothesis の6タイプを持ち、「考える→調べる→仮説を立てる→検証する」までカバーしている。しかし「何を採用/保留/却下するか」を記録する専用ノードがない。Decision ノードを**軽量に**追加し、研究の採否ログとして機能させる。

Idea = 「できるかもしれない案」、Decision = 「今回はこれで進める判断」。この区別が重要。

## 方針

- Phase 1 は属性3つだけ: `decision_type`, `rationale`, `review_trigger`
- エッジは既存タイプ流用（RELATES_TO, SUPPORTS 等）。専用エッジは追加しない
- MiniMap の hypothesis 色抜けバグも同時修正

## 変更ファイル一覧（11ファイル）

### Backend（4ファイル）

#### 1. `backend/models/enums.py`
- `NodeType` に `DECISION = "decision"` 追加
- `DecisionType(StrEnum)` 新設: adopt / hold / reject / park
- `DecisionStatus(StrEnum)` 新設: active / superseded（Phase 1 ではモデルに使わないが enum だけ定義）

#### 2. `backend/models/nodes.py`
- Hypothesis セクションの後に Decision セクション追加:
  - `decision_type = StringProperty(default="")`
  - `rationale = StringProperty(default="")`
  - `review_trigger = StringProperty(default="")`

#### 3. `backend/schemas/nodes.py`
- `NodeCreate`, `NodeUpdate`, `NodeResponse` 全てに追加:
  - `decision_type: str | None = None`
  - `rationale: str | None = None`
  - `review_trigger: str | None = None`

#### 4. `backend/services/node_service.py`
- `_node_to_response()` に Decision 用マッピング追加（空文字→None 変換）

### Frontend（5ファイル）

#### 5. `frontend/src/types/node.ts`
- `NodeType` union に `'decision'` 追加
- `ResearchNodeData` に `decision_type?`, `rationale?`, `review_trigger?` 追加

#### 6. `frontend/src/utils/colors.ts`
- `NODE_COLORS`: `decision: { bg: '#FFF7ED', border: '#EA580C', text: '#9A3412' }`（オレンジ系）
- `NODE_ICONS`: `decision: '⚖️'`
- `NODE_TYPE_LABELS`: `decision: '判断'`

#### 7. `frontend/src/components/Toolbar/QuickInput.tsx`
- `PREFIX_MAP` に `'d:': 'decision'` 追加
- placeholder に `d: 判断` 追加
- バッジ span 追加（オレンジ系）

#### 8. `frontend/src/components/Toolbar/MainToolbar.tsx`
- `NODE_TYPES` 配列に `'decision'` 追加
- `NODE_BUTTON_COLORS` に `decision: '#EA580C'` 追加

#### 9. `frontend/src/components/DetailPanel/NodeEditPanel.tsx`
- `NODE_TYPE_OPTIONS` に `{ value: 'decision', label: '判断' }` 追加
- `DECISION_TYPE_OPTIONS = ['adopt', 'hold', 'reject', 'park']` 定数追加
- `DecisionFields` コンポーネント新設:
  - 決定タイプ: select (adopt/hold/reject/park)
  - 判断理由: textarea
  - 再評価トリガー: textarea
- 条件レンダリング追加: `{nodeType === 'decision' && <DecisionFields ... />}`

### バグ修正（1ファイル）

#### 10. `frontend/src/components/Canvas/GraphCanvas.tsx`
- MiniMap の `colors` に `hypothesis: '#8B5CF6'` 追加（既存バグ修正）
- MiniMap の `colors` に `decision: '#EA580C'` 追加

### テスト（1ファイル）

#### 11. `backend/tests/`
- enum テスト: `NodeType` の数を7に更新、`DecisionType`/`DecisionStatus` テスト追加
- schema テスト: Decision ノード作成テスト追加、optional フィールドのデフォルト None 検証追加

## 変更不要（確認済み）

- `backend/api/nodes.py` — 汎用 CRUD、型非依存
- `backend/models/relationships.py` — エッジタイプ変更なし
- `frontend/src/store/graphStore.ts` — 型非依存
- `frontend/src/api/nodes.ts` — 型非依存
- `frontend/src/components/Canvas/CustomNode.tsx` — ルックアップテーブル参照のみ

## 実装順

1. Backend enums → model → schemas → service
2. Backend tests
3. Frontend types → colors → QuickInput → MainToolbar → NodeEditPanel → GraphCanvas

## 検証

```bash
# Backend
uv run ruff check backend/
uv run mypy backend/
uv run pytest -m "not integration" -v

# Frontend
cd frontend && npm run lint && npx tsc -b

# 全体
./scripts/check.sh
```

手動確認:
- QuickInput で `d: 分離＋後段fusionを採用` → オレンジの Decision ノード生成
- ツールバーの判断ボタン → ノード生成
- ノード選択 → 詳細パネルに決定タイプ/判断理由/再評価トリガー表示
- MiniMap で hypothesis が紫、decision がオレンジで表示
