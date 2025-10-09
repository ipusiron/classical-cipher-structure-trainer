# Technical Documentation

本ドキュメントでは、Classical Cipher Structure Trainer の技術的な実装の詳細、コアロジック、工夫した点を開発者向けに解説します。

---

## 📋 目次

1. [SVG Bézier曲線による対応関係の可視化](#1-svg-bézier曲線による対応関係の可視化)
2. [Fisher-Yatesシャッフルアルゴリズム](#2-fisher-yatesシャッフルアルゴリズム)
3. [ドラッグ&ドロップの実装](#3-ドラッグドロップの実装)
4. [偶奇入れ替えの繰り返し可能な実装](#4-偶奇入れ替えの繰り返し可能な実装)
5. [セキュリティ対策](#5-セキュリティ対策)
6. [レスポンシブデザインとアクセシビリティ](#6-レスポンシブデザインとアクセシビリティ)

---

## 1. SVG Bézier曲線による対応関係の可視化

### 概要
換字暗号の「対応関係」を視覚的に表現するため、SVGのBézier曲線を使って上段と下段の文字を滑らかな曲線で結んでいます。

### 実装詳細

```javascript
// script.js: buildMappingFigure関数（抜粋）
function buildMappingFigure(topId, bottomId, svgId, offset=3, customMapping=null){
  // 上段・下段の要素を取得し、SVG線を描画
  topCells.forEach((tc, i) => {
    let bc;
    if(customMapping){
      // ランダム置換の場合：カスタムマッピング配列を使用
      const targetLetter = customMapping[i];
      const targetIndex = letters.indexOf(targetLetter);
      bc = bottomCells[targetIndex];
    } else {
      // 規則的シフトの場合：オフセット値を使用
      bc = bottomCells[(i + offset) % bottomCells.length];
    }

    // 各要素の中心座標を計算
    const tcr = tc.getBoundingClientRect();
    const bcr = bc.getBoundingClientRect();
    const svgR = svg.getBoundingClientRect();
    const x1 = tcr.left + tcr.width/2 - svgR.left;
    const y1 = tcr.bottom - svgR.top + 4;
    const x2 = bcr.left + bcr.width/2 - svgR.left;
    const y2 = bcr.top - svgR.top - 4;

    // Bézier曲線のパスを生成
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    const midY = (y1 + y2) / 2;
    const d = `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke','#0ea5e9');
    svg.appendChild(path);
  });
}
```

### 工夫したポイント

1. **Cubic Bézier曲線の制御点**
   - 開始点: `(x1, y1)` - 上段要素の下端中央
   - 制御点1: `(x1, midY)` - 開始点から垂直方向に中間点まで
   - 制御点2: `(x2, midY)` - 終了点から垂直方向に中間点まで
   - 終了点: `(x2, y2)` - 下段要素の上端中央
   - この配置により、S字カーブの美しい曲線が描画されます

2. **レスポンシブ対応**
   - `getBoundingClientRect()` で実行時の要素位置を取得
   - ウィンドウリサイズ時に `drawMappingFigure()` を再実行
   - `viewBox` を動的に設定してSVGをスケーラブルに

3. **dual-mode設計**
   - `customMapping` パラメーターでランダム/規則的シフトを切り替え
   - ランダムの場合：Fisher-Yates シャッフル配列を使用
   - 規則的の場合：単純なオフセット計算

---

## 2. Fisher-Yatesシャッフルアルゴリズム

### 概要
「ランダムに対応させる」機能では、偏りのない完全ランダムな置換を生成するため、Fisher-Yates（Knuthシャッフル）アルゴリズムを採用しています。

### 実装詳細

```javascript
// script.js: ランダムマッピング生成
document.getElementById('btn-map-random')?.addEventListener('click', ()=>{
  const letters = ['A','B','C','D','E','F','G','H'];
  const shuffled = [...letters];
  // Fisher-Yates shuffle
  for(let i = shuffled.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  vizRandomMapping = shuffled;
  drawMappingFigure();
});
```

### アルゴリズムの特徴

- **時間計算量**: O(n) - 配列の長さに対して線形
- **空間計算量**: O(1) - 元の配列を直接シャッフル（in-place）
- **均一性**: すべての順列が等確率で生成される（n! 通り）

### なぜFisher-Yatesか？

単純な「ランダムに並べ替え」（例：`sort(() => Math.random() - 0.5)`）は、統計的に偏りが生じることが知られています。暗号教育ツールとして、正しいランダム性を示すためにFisher-Yatesを採用しました。

---

## 3. ドラッグ&ドロップの実装

### 概要
転置暗号の理解を深めるため、文字ブロックをドラッグ&ドロップで並べ替えられる体験型UIを実装しています。

### 実装詳細

#### 3.1 HTML5 Drag and Drop API

```javascript
// script.js: makeBlock関数（抜粋）
function makeBlock(ch){
  const el = document.createElement('div');
  el.className = 'block';
  el.draggable = true;

  // Drag events
  el.addEventListener('dragstart', e=>{
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('dragging');
    el.setAttribute('aria-grabbed','true');
  });

  el.addEventListener('dragend', ()=>{
    el.classList.remove('dragging');
    el.setAttribute('aria-grabbed','false');
  });

  return el;
}
```

#### 3.2 ドロップ位置の計算

```javascript
// script.js: getDragAfterElement関数
function getDragAfterElement(container, x, y){
  const els = [...container.querySelectorAll('.block:not(.dragging)')];
  return els.reduce((closest, child)=>{
    const rect = child.getBoundingClientRect();
    const offset = x - rect.left - rect.width/2;
    if(offset < 0 && Math.abs(offset) < closest.offset){
      return { offset: Math.abs(offset), element: child };
    }else{
      return closest;
    }
  }, { offset: Number.POSITIVE_INFINITY }).element;
}
```

**アルゴリズムの動作:**
1. ドラッグ中でない要素のみを対象
2. マウス位置から各要素の中心までの距離を計算
3. 左側にあるもっとも近い要素を特定
4. その要素の直前に挿入

#### 3.3 タッチイベント対応（モバイル）

```javascript
// script.js: タッチイベントのシミュレーション
el.addEventListener('touchstart', e=>{
  e.preventDefault();
  touchDragEl = el;
  el.classList.add('dragging');
});

el.addEventListener('touchmove', e=>{
  e.preventDefault();
  const touch = e.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;

  // ドロップゾーンの検出
  const dropZone = document.elementFromPoint(x, y)?.closest('.sortable');
  if(dropZone && touchDragEl){
    const after = getDragAfterElement(dropZone, x, y);
    if(after == null){
      dropZone.appendChild(touchDragEl);
    }else{
      dropZone.insertBefore(touchDragEl, after);
    }
  }
});
```

#### 3.4 キーボードナビゲーション（アクセシビリティ）

```javascript
// script.js: キーボード操作
el.addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
    e.preventDefault();
    const container = el.parentElement;
    const blocks = Array.from(container.querySelectorAll('.block'));
    const currentIndex = blocks.indexOf(el);

    if(e.key === 'ArrowLeft' && currentIndex > 0){
      container.insertBefore(el, blocks[currentIndex - 1]);
    }
    if(e.key === 'ArrowRight' && currentIndex < blocks.length - 1){
      container.insertBefore(blocks[currentIndex + 1], el);
    }
    el.focus();
  }
});
```

### 工夫したポイント

1. **3つの入力方法をサポート**
   - マウス（HTML5 Drag and Drop）
   - タッチ（タッチイベント）
   - キーボード（矢印キー）

2. **視覚的フィードバック**
   - ドラッグ中の要素に `.dragging` クラス（透明度変更）
   - ドロップゾーンに `.drag-over` クラス（背景色変更）
   - ホバー時のアニメーション（`transform: translateY(-2px)`）

3. **ARIA属性の活用**
   - `role="button"` - スクリーンリーダー対応
   - `aria-grabbed` - ドラッグ状態の通知
   - `aria-label` - 領域の説明

---

## 4. 偶奇入れ替えの繰り返し可能な実装

### 概要
「偶奇入れ替え」ボタンは、押すたびに現在の並び順に対して隣接ペアを交換する仕組みです。

### 実装詳細

```javascript
// script.js: 偶奇入れ替えボタン
document.getElementById('btn-viz-shuffle-evenodd')?.addEventListener('click', ()=>{
  // Get current state from blocks
  const blocks = Array.from(tgt.querySelectorAll('.block'));
  const currentText = blocks.map(b => b.textContent).join('');
  const arr = [...currentText];

  // Swap even and odd positions: 0↔1, 2↔3, 4↔5, ...
  for(let i = 0; i < arr.length - 1; i += 2){
    [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
  }
  fillFrom(arr.join(''));
});
```

### 工夫したポイント

**初期実装の問題点:**
```javascript
// ❌ 初期実装（常に元のテキストに対して実行）
const arr = [...text]; // text = "EDUCATION"（固定）
for(let i = 0; i < arr.length - 1; i += 2){
  [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
}
```

この実装では、何度ボタンを押しても同じ結果（`DECUATOIN`）になってしまいます。

**改善後の実装:**
```javascript
// ✅ 改善版（現在の状態から読み取る）
const blocks = Array.from(tgt.querySelectorAll('.block'));
const currentText = blocks.map(b => b.textContent).join('');
const arr = [...currentText];
```

この実装により、以下の動作が可能になります：
- 1回目: `EDUCATION` → `DECUATOIN`
- 2回目: `DECUATOIN` → `EDUCATION`（元に戻る）
- 3回目以降も繰り返し可能

**数学的背景:**
偶奇入れ替えは「対合（involution）」の一種です。同じ操作を2回適用すると元に戻る性質があります。

---

## 5. セキュリティ対策

### 5.1 Content Security Policy（CSP）

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self';
               img-src 'self' data: https:;
               connect-src 'self';">
```

**効果:**
- インラインスクリプトの実行を禁止（XSS対策）
- 外部リソースの読み込みを制限
- GitHub Pagesでの安全な公開

### 5.2 DOM操作の安全化

```javascript
// ❌ 危険な実装（XSS脆弱性）
element.innerHTML = userInput;

// ✅ 安全な実装
const textNode = document.createTextNode(userInput);
element.appendChild(textNode);

// または
element.textContent = userInput;
```

**適用箇所:**
- クイズの選択肢表示
- エラーメッセージの表示
- ユーザー入力の反映

### 5.3 JSON検証

```javascript
// script.js: validateQuizData関数
function validateQuizData(data){
  if(!data || typeof data !== 'object') return false;
  if(!Array.isArray(data.questions)) return false;

  return data.questions.every(q => {
    return q.id &&
           typeof q.prompt === 'string' &&
           Array.isArray(q.choices) &&
           typeof q.answer_index === 'number' &&
           q.answer_index >= 0 &&
           q.answer_index < q.choices.length;
  });
}
```

**検証項目:**
- データ型の確認
- 必須フィールドの存在確認
- 配列インデックスの境界チェック
- 不正なデータの検出と拒否

---

## 6. レスポンシブデザインとアクセシビリティ

### 6.1 メディアクエリによる適応

```css
/* style.css */
/* モバイル：折り返し許可 */
.blocks{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

/* PC（640px以上）：1行に収める */
@media (min-width: 640px){
  .blocks{
    flex-wrap:nowrap;
  }
}
```

### 6.2 アクセシビリティ対応

**実装した機能:**

1. **セマンティックHTML**
   ```html
   <nav role="tablist">
     <button role="tab" aria-selected="true" aria-controls="tab-intro">
   ```

2. **キーボード操作**
   - Tab/Shift+Tab: フォーカス移動
   - Enter/Space: ボタン実行
   - 矢印キー: ブロック移動

3. **フォーカススタイル**
   ```css
   .btn:focus{
     outline: 2px solid var(--brand);
     outline-offset: 2px;
   }
   ```

4. **ARIA属性**
   - `aria-label`: 要素の説明
   - `aria-grabbed`: ドラッグ状態
   - `aria-live`: 動的コンテンツの通知

---

## 🎨 パフォーマンス最適化

### 遅延レンダリング
```javascript
// タブ切り替え時にSVGを再描画（50ms遅延）
if(btn.id === 'btn-intro'){
  setTimeout(drawMappingFigure, 50);
}
```

**理由:**
- タブが非表示の状態では `getBoundingClientRect()` が正しい値を返さない
- DOM更新後にレンダリングが完了するのを待つ必要がある
- `setTimeout` で次のイベントループまで遅延

### イベントデリゲーション
```javascript
// ❌ 各ブロックにイベントリスナーを設定（非効率）
blocks.forEach(block => {
  block.addEventListener('click', handleClick);
});

// ✅ 親要素で一括処理（効率的）
container.addEventListener('click', e => {
  if(e.target.classList.contains('block')){
    handleClick(e);
  }
});
```

---

## 📚 参考資料

- [HTML5 Drag and Drop API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [Fisher–Yates shuffle - Wikipedia](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
- [Content Security Policy - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [SVG Paths - MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
- [ARIA: Drag-and-Drop Roles - W3C](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

---

## 🤝 コントリビューション

本プロジェクトへの貢献を歓迎します。以下の点にご注意ください：

1. **セキュリティ**: CSPを維持し、`innerHTML`の使用を避ける
2. **アクセシビリティ**: ARIA属性とキーボード操作を保持
3. **パフォーマンス**: 不要な再描画を避ける
4. **コードスタイル**: 既存のスタイルに合わせる

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0
