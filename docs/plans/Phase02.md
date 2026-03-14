# Phase 2 実装計画: 削除・編集・Undo/Redo

## Context

Phase 1 で基本的なグラフキャンバス（ノード作成・エッジ作成・位置保存）は完成したが、
**ノード/エッジの削除・編集UIが存在しない**ため実用に耐えない。
Undo/Redo も未実装で、誤操作のリカバリができない。
この計画で Sprint 4（Phase 2 の最初のスプリント）として、これら3機能を実装する。

## 方針決定

- **Undo/Redo**: フロントエンドのみ（zundo + Zustand temporal middleware）
- **編集パネル**: 右サイドバー形式

---

## Increment 1: 削除（最優先）

### 1.1 キーボード削除 + エッジ選択修正

**変更ファイル:**
- `frontend/src/components/Canvas/GraphCanvas.tsx`
  - `onDelete` コールバックを追加（React Flow の `deleteKeyCode` prop または `onNodesDelete`/`onEdgesDelete`）
  - `window.confirm()` で確認後、`graphStore.removeNode` / `removeEdge` を呼ぶ
- `frontend/src/components/Canvas/CustomEdge.tsx`
  - エッジラベルの `onClick` で `uiStore.selectEdge(id)` を呼ぶ（現在未接続）

### 1.2 ツールバー削除ボタン

**変更ファイル:**
- `frontend/src/components/Toolbar/MainToolbar.tsx`
  - `selectedNodeId` / `selectedEdgeId` を読み取り、選択時のみ「🗑 削除」ボタンを表示
  - 確認ダイアログ → `removeNode` / `removeEdge`

### 1.3 右クリックコンテキストメニュー

**新規ファイル:**
- `frontend/src/components/Canvas/ContextMenu.tsx`
  - 位置指定の `div`、メニュー項目: 「削除」「編集」（編集は Increment 2 で接続）
  - クリックアウトで閉じる

**変更ファイル:**
- `frontend/src/store/uiStore.ts`
  - `contextMenu: { x, y, nodeId?, edgeId? } | null` state 追加
  - `openContextMenu()` / `closeContextMenu()` actions 追加
- `frontend/src/components/Canvas/GraphCanvas.tsx`
  - `onNodeContextMenu` / `onEdgeContextMenu` で `uiStore.openContextMenu` を呼ぶ
  - `<ContextMenu />` をレンダー

---

## Increment 2: 編集パネル

### 2.1 graphStore に `updateEdge` アクション追加

**変更ファイル:**
- `frontend/src/store/graphStore.ts`
  - `updateEdge(uid, data)` を追加。`edgesApi.updateEdge` を呼び、ローカル state を更新
  - パターンは既存の `updateNode` をミラー

### 2.2 uiStore に detailPanel state 追加

**変更ファイル:**
- `frontend/src/store/uiStore.ts`
  - `detailPanelOpen: boolean` 追加
  - ノード/エッジ選択時に自動で `true` にする

### 2.3 DetailPanel コンポーネント群

**新規ファイル:**
- `frontend/src/components/DetailPanel/DetailPanel.tsx`
  - 右サイドバー wrapper（width: 320px, position: absolute right）
  - `selectedNodeId` → `NodeEditPanel`、`selectedEdgeId` → `EdgeEditPanel` を描画
  - 閉じるボタン + 削除ボタン

- `frontend/src/components/DetailPanel/NodeEditPanel.tsx`
  - 共通フィールド: title（テキスト）, memo（textarea）, tags（カンマ区切り）, needs_review（チェックボックス）
  - タイプ別フィールド（NodeType に応じて表示切替）:
    - Concept: description, domain, importance, concept_status, aliases
    - Paper: year, authors, venue, url, summary, contribution, limitations, read_status
    - Idea: motivation, novelty_claim, feasibility_note, priority, idea_status
    - Question: category, urgency, question_status
    - Evidence: content, source, reliability, evidence_date, linked_excerpt
  - ローカル state でフォーム値を管理、変更フィールドのみ `graphStore.updateNode` で保存
  - 保存トリガー: 「保存」ボタン（blur での auto-save は誤操作リスクがあるため明示的に）

- `frontend/src/components/DetailPanel/EdgeEditPanel.tsx`
  - フィールド: edge_type（select/8種）, confidence（select/3段階）, status（select/4段階）, note（textarea）
  - source/target ノード名を読み取り専用で表示
  - `graphStore.updateEdge` で保存

### 2.4 App.tsx に DetailPanel を組み込み

**変更ファイル:**
- `frontend/src/App.tsx`
  - `<DetailPanel />` をキャンバスコンテナ内に配置（absolute positioning）

### 2.5 コンテキストメニューに「編集」追加

**変更ファイル:**
- `frontend/src/components/Canvas/ContextMenu.tsx`
  - 「編集」メニュー項目 → ノード/エッジを選択し、detailPanel を開く

---

## Increment 3: Undo/Redo

### 3.1 zundo インストール

```bash
cd frontend && npm install zundo
```

### 3.2 graphStore に temporal middleware を適用

**変更ファイル:**
- `frontend/src/store/graphStore.ts`
  - `temporal` middleware で wrap
  - `partialize`: `nodes` と `edges` のみ追跡
  - `equality`: position/dragging/selected の変更を無視（ドラッグでスタック汚染を防ぐ）
  - `limit: 50` でスタックサイズ制限
  - `useTemporalStore` hook をエクスポート

### 3.3 ツールバーに Undo/Redo ボタン

**変更ファイル:**
- `frontend/src/components/Toolbar/MainToolbar.tsx`
  - 「↩ 元に戻す」「↪ やり直し」ボタン追加
  - `pastStates.length === 0` / `futureStates.length === 0` で disable

### 3.4 キーボードショートカット

**変更ファイル:**
- `frontend/src/components/Canvas/GraphCanvas.tsx`（または専用 hook）
  - `Cmd+Z` / `Ctrl+Z` → undo
  - `Cmd+Shift+Z` / `Ctrl+Shift+Z` → redo
  - input/textarea フォーカス時はスキップ

### 3.5 バックエンド同期の方針

フロントエンドのみの undo/redo のため、undo 後にバックエンドとの不整合が生じる。
**当面の対応**: undo/redo は UI 状態のみ。ページリロードでバックエンドの真の状態に戻る。
将来的にバックエンド連携が必要になれば、イベントログ修正と合わせて対応する。

---

## 実装順序

```
Increment 1 (削除)
  1.1 キーボード削除 + エッジ選択
  1.2 ツールバー削除ボタン
  1.3 コンテキストメニュー
    ↓
Increment 2 (編集)
  2.1 graphStore.updateEdge
  2.2 uiStore.detailPanelOpen
  2.3 DetailPanel / NodeEditPanel / EdgeEditPanel
  2.4 App.tsx 組み込み
  2.5 コンテキストメニュー「編集」
    ↓
Increment 3 (Undo/Redo)
  3.1 zundo インストール
  3.2 temporal middleware 適用
  3.3 ツールバーボタン
  3.4 キーボードショートカット
```

## 変更ファイル一覧

| ファイル | 操作 | Increment |
|---------|------|-----------|
| `frontend/src/components/Canvas/GraphCanvas.tsx` | 変更 | 1, 3 |
| `frontend/src/components/Canvas/CustomEdge.tsx` | 変更 | 1 |
| `frontend/src/components/Toolbar/MainToolbar.tsx` | 変更 | 1, 3 |
| `frontend/src/store/uiStore.ts` | 変更 | 1, 2 |
| `frontend/src/store/graphStore.ts` | 変更 | 2, 3 |
| `frontend/src/App.tsx` | 変更 | 2 |
| `frontend/src/components/Canvas/ContextMenu.tsx` | **新規** | 1, 2 |
| `frontend/src/components/DetailPanel/DetailPanel.tsx` | **新規** | 2 |
| `frontend/src/components/DetailPanel/NodeEditPanel.tsx` | **新規** | 2 |
| `frontend/src/components/DetailPanel/EdgeEditPanel.tsx` | **新規** | 2 |

## 検証方法

各 Increment 完了後にブラウザで手動検証：

### Increment 1 検証
- ノード選択 → Delete/Backspace → 確認ダイアログ → ノード削除
- エッジラベルクリック → エッジ選択される
- 選択中にツールバー「削除」ボタンが表示 → クリックで削除
- ノード右クリック → コンテキストメニュー → 「削除」で削除
- リロード後もノードが消えている（API 経由で削除済み）

### Increment 2 検証
- ノードクリック → 右サイドバーにフォーム表示
- タイトル変更 → 「保存」→ キャンバス上のノードに反映
- タイプ別フィールド（Paper の year, Idea の priority 等）が正しく表示・編集可能
- エッジラベルクリック → EdgeEditPanel に切替
- edge_type/confidence/status 変更 → エッジの線種・色に反映
- コンテキストメニュー「編集」→ パネルが開く

### Increment 3 検証
- ノード作成 → Cmd+Z → ノード消える → Cmd+Shift+Z → ノード戻る
- ノード削除 → Cmd+Z → ノード復活
- ノードドラッグ移動では undo スタックに積まれない
- ツールバーの undo/redo ボタンが状態に応じて有効/無効
- input フォーカス中は Cmd+Z がブラウザデフォルト動作（フォーム内 undo）になる
