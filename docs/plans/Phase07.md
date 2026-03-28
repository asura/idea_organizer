# ノード自動レイアウト機能の実装計画

## Context

ノード数が増えるにつれ手動配置が困難になる問題を解決する。
現状は完全手動配置（ランダム初期位置 + ドラッグ）で、`@dagrejs/dagre` はインストール済みだが未使用。
Level 1 → 2 → 3 の段階的アプローチで実装する。

## 新規ファイル

| ファイル | 役割 |
|---------|------|
| `frontend/src/layout/dagreLayout.ts` | dagre による階層レイアウト計算 |
| `frontend/src/layout/smartPlacement.ts` | 新規ノードのスマート配置 |
| `frontend/src/layout/forceSimulation.ts` | d3-force シミュレーションエンジン |
| `frontend/src/store/layoutStore.ts` | レイアウト関連の状態管理 |
| `frontend/src/hooks/useForceLayout.ts` | force ↔ React Flow ブリッジ |
| `frontend/src/components/Toolbar/LayoutControls.tsx` | レイアウト操作UI |

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `frontend/src/components/Toolbar/MainToolbar.tsx` | `<LayoutControls />` を挿入 |
| `frontend/src/components/Canvas/GraphCanvas.tsx` | ドラッグ時のpin/unpin、useForceLayout呼び出し |
| `frontend/src/hooks/useAutoSave.ts` | アニメーション中のデバウンス延長 |
| `frontend/src/store/graphStore.ts` | addNode に connectedToNodeId パラメータ追加 |
| `frontend/package.json` | d3-force + @types/d3-force 追加 |

---

## Phase 1: Level 1 — ワンクリック自動整列

### 1-1. `layout/dagreLayout.ts`
- `computeDagreLayout(nodes, edges, direction: 'TB' | 'LR')` → `Map<string, {x, y}>`
- dagre の `rankdir`, `nodesep: 60`, `ranksep: 80` を設定
- ノードサイズ: width=220, height=80（CustomNode の中間値）
- dagre は中心座標を返すので、半分ずらして React Flow の左上原点に変換

### 1-2. `store/layoutStore.ts`（初期版）
```ts
interface LayoutState {
  dagreDirection: 'TB' | 'LR'
  isAnimating: boolean
  // Level 3 の状態は後で追加
}
```

### 1-3. `components/Toolbar/LayoutControls.tsx`
- 「整列」ボタン + TB/LR 切替ドロップダウン
- クリック → `computeDagreLayout` → `onNodesChange` に position changes を流す
- 既存ツールバーのスタイルに合わせる（border, borderRadius: 6, fontSize: 12）

### 1-4. アニメーション
- レイアウト適用時、`requestAnimationFrame` で現在位置→目標位置を300msかけて補間
- `isAnimating` フラグで auto-save のデバウンスを 3000ms に延長

### 1-5. `MainToolbar.tsx`
- Undo/Redo と ファイル操作の間に `<LayoutControls />` を追加

---

## Phase 2: Level 2 — 新規ノードのスマート配置

### 2-1. `layout/smartPlacement.ts`
- `computeConnectedNodePosition(sourceNode, existingNodes)` → `{x, y}`
  - ソースノードの下方 100px（TB）/ 右方 150px（LR）に配置
- `findNonOverlappingPosition(candidate, existingNodes)` → `{x, y}`
  - AABB 衝突判定（20px パディング）で重なり回避
  - 右→下にスパイラル探索、最大20回

### 2-2. `graphStore.ts` の `addNode` 変更
- オプショナル引数 `connectedToNodeId?: string` を追加
- 指定時: `computeConnectedNodePosition` を使って位置決定
- 未指定時: 現状のランダム配置を維持

### 2-3. `onConnect` フローへの統合
- 新しいエッジ接続時、ターゲットノードが直近2秒以内に作成されたものなら再配置を検討
- ただし最初は手動接続のみで、後から拡張可能にしておく

---

## Phase 3: Level 3 — インタラクティブ力学シミュレーション

### 3-1. 依存追加
```
npm install d3-force @types/d3-force
```

### 3-2. `layout/forceSimulation.ts`

**ForceConfig（デフォルト値）:**
| パラメータ | 値 | 説明 |
|-----------|-----|------|
| centerStrength | 0.05 | 中心引力（飛散防止の主力） |
| chargeStrength | -300 | ノード間反発 |
| linkDistance | 200 | エッジの理想距離 |
| linkStrength | 0.3 | エッジの引力 |
| collideRadius | 120 | 衝突回避半径 |
| velocityDecay | 0.5 | 速度減衰（高い=落ち着きが早い） |
| boundingBox | 3000×2000 | ハードな移動制限 |

**飛散防止の3重防御:**
1. **center force** — 全ノードをキャンバス中心に常に引き寄せる
2. **velocity decay 0.5** — 速度が毎tick半減し、急加速しない
3. **bounding box clamp** — tick毎に `clamp(x, -1500, 1500)` で物理的にはみ出しを阻止

**API:**
```ts
createForceSimulation(nodes, edges, config, onTick) → {
  simulation, updateNodes, pinNode, unpinNode, stop, reheat
}
```

### 3-3. `hooks/useForceLayout.ts`
- `forceEnabled` トグルで simulation を start/stop
- tick コールバック → `onNodesChange` に position changes を流す
- tick を ~30fps にスロットル（React re-render 負荷軽減）
- nodes/edges の構造変更を検知して `updateNodes` で同期
- cleanup で `stop()`

### 3-4. `GraphCanvas.tsx` の変更
- `onNodeDragStart` → `pinNode(id, x, y)` でドラッグ中固定
- `onNodeDragStop` → ピン維持（ユーザーが意図的に配置した位置を尊重）
- `useForceLayout()` フック呼び出し

### 3-5. `LayoutControls.tsx` の拡張
- 「Force: ON/OFF」トグルボタン
- ⚙ アイコン → ポップオーバーでスライダー:
  - 中心引力 (0.01–0.2)
  - 反発力 (-100–-800)
  - リンク距離 (50–400)
  - 速度減衰 (0.2–0.8)

### 3-6. `useAutoSave.ts` の変更
- `layoutStore.isAnimating` を参照
- `true` の間はデバウンスを 1000ms → 3000ms に延長
- simulation が冷却 (alpha < 0.01) したら最終位置を保存

---

## 検証計画

### Level 1
- [ ] 5ノード + 4エッジの小グラフで TB/LR 整列を確認
- [ ] 20ノード以上のグラフでレイアウト結果が読みやすいか確認
- [ ] アニメーションがスムーズか確認
- [ ] 整列後の位置がNeo4jに保存されるか確認
- [ ] `npm run lint` + `npx tsc -b` が通ること

### Level 2
- [ ] ツールバーからノード追加 → 既存ノードと重ならないか確認
- [ ] エッジ接続後のノード再配置が自然か確認

### Level 3
- [ ] Force ON → ノードが散らばりすぎず収束するか確認
- [ ] ドラッグ中はノードが固定されるか確認
- [ ] bounding box の外に飛ばないか確認
- [ ] Force OFF → シミュレーション停止、最終位置が保存されるか確認
- [ ] 50ノードで UI がカクつかないか確認
- [ ] `./scripts/check.sh` が通ること
