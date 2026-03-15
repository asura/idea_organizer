# 活用テンプレート

Research Idea Organizer の具体的な使い方を、2つの典型シナリオで紹介する。

---

## ① 課題山積の研究で解決策を整理する場合

**ゴール**: 複数の課題と解決候補の関係を可視化し、優先度を判断する

### Step 1: 中心課題をQuestionノードで登録

```
Ctrl+K → q:メインの研究課題（例：q:モデルの汎化性能が低い）
Ctrl+K → q:サブ課題1（例：q:学習データが不足している）
Ctrl+K → q:サブ課題2（例：q:特徴量設計が不十分）
Ctrl+K → q:サブ課題3（例：q:過学習が発生する）
```

### Step 2: 関連する知見をConceptとEvidenceで配置

```
Ctrl+K → c:データ拡張
Ctrl+K → c:正則化手法
Ctrl+K → e:Table 2 - ドロップアウト適用時のVal精度 +3%
Ctrl+K → p:Mixup: Beyond Empirical Risk Minimization
```

### Step 3: エッジで因果・関連を繋ぐ

| 接続元 → 接続先 | エッジタイプ | 確信度 |
|---|---|---|
| `c:データ拡張` → `q:学習データが不足` | RELATES_TO | medium |
| `p:Mixup論文` → `c:データ拡張` | SUPPORTS | high |
| `e:ドロップアウト結果` → `q:過学習が発生` | EVALUATES | high |
| `c:正則化手法` → `q:過学習が発生` | RELATES_TO | medium |

### Step 4: 解決アイデアをIdeaノードで追加

```
Ctrl+K → i:Mixup + CutMixの併用で精度改善できるか
Ctrl+K → i:事前学習済みモデルのfine-tuningに切り替え
```

エッジで各Ideaがどの課題を解決しうるかを `RELATES_TO` や `SUPPORTS` で接続する。

### Step 5: 俯瞰して判断

- **赤(Question)に接続が少ない** → まだ解決策が不足している課題
- **エッジの確信度がlow/点線ばかり** → 根拠が弱い領域、追加調査が必要
- **status=rejected（赤エッジ）** → 棄却済みのアプローチを明示

---

## ② 今から新規研究の提案をしたい場合

**ゴール**: アイデアの種を広げて構造化し、提案書のストーリーラインを組み立てる

### Step 1: 核となるアイデアを中心に置く

```
Ctrl+K → i:GNNで因果推論を効率化する手法の提案
```

### Step 2: 関連概念を放射状に展開

```
Ctrl+K → c:グラフニューラルネットワーク
Ctrl+K → c:因果推論
Ctrl+K → c:構造方程式モデル
Ctrl+K → c:介入データ
```

中心アイデアから各概念へ `RELATES_TO` / `REQUIRES` エッジを張る。

### Step 3: 先行研究をPaperノードで配置

```
Ctrl+K → p:DAGs with NO TEARS (Zheng+ 2018)
Ctrl+K → p:Causal Discovery with GNN (Yu+ 2019)
```

エッジで関係を明示：
- `p:DAGs with NO TEARS` → `c:構造方程式モデル`：**EXTENDS**
- `p:Causal Discovery with GNN` → `i:核アイデア`：**INSPIRES**
- `p:DAGs with NO TEARS` → `i:核アイデア`：**COMPETES_WITH**（差別化ポイント）

### Step 4: 研究課題（未解決の問い）を可視化

```
Ctrl+K → q:大規模グラフへのスケーラビリティは？
Ctrl+K → q:介入データなしで因果構造を学習できるか？
Ctrl+K → q:既存手法との比較実験の設計は？
```

### Step 5: 予備的エビデンスがあれば追加

```
Ctrl+K → e:合成データで因果構造の復元率85%を確認
```

`e:予備結果` → `i:核アイデア` を **SUPPORTS** (confidence=medium) で接続。

### Step 6: グラフから提案書ストーリーを読み取る

グラフの構造がそのまま提案書のロジックになる：

| グラフの要素 | 提案書のセクション |
|---|---|
| `c:概念` ノード群 | **背景・関連技術** |
| `p:先行研究` + COMPETES_WITH エッジ | **関連研究と差別化** |
| `i:核アイデア` + INSPIRES元 | **提案手法** |
| `q:未解決の問い` | **研究課題・研究計画** |
| `e:予備結果` + SUPPORTS エッジ | **予備実験・実現可能性** |

---

## ③ 仮説駆動で研究を進める場合

**ゴール**: 仮説を明示的に立て、根拠・検証方法・結果を構造的に管理する

### Step 1: 仮説をHypothesisノードで登録

```
Ctrl+K → h:GNNは因果構造の復元に有効である
Ctrl+K → h:介入データなしでも構造学習は可能
```

Hypothesisノード（🟣紫）には以下の専用フィールドがある：
- **statement**: 仮説の主張（ノードタイトルと別に詳細を記述可能）
- **basis**: 仮説の根拠・動機
- **testability_note**: 検証方法のメモ
- **confidence_level**: 確信度（low / medium / high）
- **hypothesis_status**: 状態（draft → testing → supported / refuted / revised）

### Step 2: 根拠となるノードを配置しエッジで接続

```
Ctrl+K → p:Causal Discovery with GNN (Yu+ 2019)
Ctrl+K → e:合成データで復元率85%を確認
Ctrl+K → c:グラフニューラルネットワーク
```

| 接続元 → 接続先 | エッジタイプ | 確信度 |
|---|---|---|
| `p:Yu+ 2019` → `h:GNNは因果構造の復元に有効` | SUPPORTS | medium |
| `e:復元率85%` → `h:GNNは因果構造の復元に有効` | SUPPORTS | high |
| `c:GNN` → `h:GNNは因果構造の復元に有効` | RELATES_TO | high |

### Step 3: 検証課題をQuestionノードで可視化

```
Ctrl+K → q:実データでも同様の復元率が得られるか？
Ctrl+K → q:ノード数1000以上でスケールするか？
```

各Questionを仮説に `EVALUATES` エッジで接続する。

### Step 4: 検証結果に応じてステータスを更新

仮説ノードの詳細パネルで `hypothesis_status` を更新：
- 実験が仮説を支持 → **supported**
- 反証された → **refuted**
- 条件付きで修正 → **revised**（新しい仮説ノードを作成し `EXTENDS` で接続）

### Step 5: 仮説の連鎖で研究の進展を記録

```
h:元の仮説 ──EXTENDS──→ h:修正された仮説
```

refuted/revised された仮説も削除せず残すことで、研究の試行錯誤の過程を記録できる。

---

## 共通Tips

- **`needs_review=true`** で雑に作り、後から詳細を書き足す（完璧を求めず量を出す）
- **確信度を正直につける** — low/medium/highの線種の違いが、根拠の薄い部分を一目で教えてくれる
- **CONTRADICTS エッジを恐れない** — 矛盾する情報も明示的に残すことで、議論の整理に役立つ
- **近傍検索 (`GET /api/graph/neighborhood/{uid}`)** で特定ノード周辺だけ深掘りできる
- **仮説は `draft` で気軽に作る** — status を段階的に更新し、研究の進展を可視化する
- **グラフの保存 (`POST /api/graph/save`)** で名前付きスナップショットを残し、異なる研究段階を比較できる
