/* =========================================================
   Classical Cipher Structure Trainer
   - Tabs: 3タブ構成（概念、古典暗号の例、クイズ）
   - Mapping: SVG Bézier曲線による対応関係の可視化
   - Shuffle: HTML5 Drag & Drop + タッチイベント対応
   - Quiz: data/quiz.jsonから10問読み込み（一問一答形式）
   ========================================================= */

// ============================================================
// タブ切り替え機能
// ============================================================
const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    // すべてのタブとパネルの active クラスを削除
    tabs.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));

    // クリックされたタブとそれに対応するパネルを active に
    btn.classList.add('active');
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    panel.classList.add('active');

    // 概念タブに切り替えた際にSVGを再描画
    // 理由: 非表示状態では getBoundingClientRect() が正しい値を返さないため
    if(btn.id === 'btn-intro'){
      setTimeout(drawMappingFigure, 50); // DOM更新完了を待つ
    }
  });
});

// ============================================================
// マッピング図（換字暗号の対応関係をSVG線で可視化）
// ============================================================

/**
 * マッピング図を構築してSVG線を描画
 * @param {string} topId - 上段（平文）のコンテナID
 * @param {string} bottomId - 下段（暗号文）のコンテナID
 * @param {string} svgId - SVG要素のID
 * @param {number} offset - シフト量（規則的な対応の場合）
 * @param {Array|null} customMapping - カスタムマッピング配列（ランダム対応の場合）
 */
function buildMappingFigure(topId, bottomId, svgId, offset=3, customMapping=null){
  const top = document.getElementById(topId);
  const bottom = document.getElementById(bottomId);
  const svg = document.getElementById(svgId);
  if(!top || !bottom || !svg) return;

  // A-Hの文字セルを生成（上下とも同じ文字列）
  const letters = ['A','B','C','D','E','F','G','H'];
  top.innerHTML = '';
  bottom.innerHTML = '';

  // 上段（平文）の文字セルを生成
  letters.forEach(ch => {
    const c = document.createElement('div');
    c.className = 'cell';
    c.textContent = ch; // textContent使用でXSS対策
    top.appendChild(c);
  });

  // 下段（暗号文）の文字セルを生成
  letters.forEach(ch => {
    const c = document.createElement('div');
    c.className = 'cell';
    c.textContent = ch;
    bottom.appendChild(c);
  });

  // SVG Bézier曲線で対応関係を描画
  const rect = svg.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`); // レスポンシブ対応
  svg.innerHTML = '';
  const topCells = Array.from(top.children);
  const bottomCells = Array.from(bottom.children);

  // 各上段文字に対して対応する下段文字への線を描画
  topCells.forEach((tc, i) => {
    let bc; // 対応する下段の文字セル

    if(customMapping){
      // ランダム対応モード: Fisher-Yatesシャッフル配列を使用
      const targetLetter = customMapping[i];
      const targetIndex = letters.indexOf(targetLetter);
      bc = bottomCells[targetIndex];
    } else {
      // 規則的シフトモード: オフセット値を使用
      bc = bottomCells[(i + offset) % bottomCells.length];
    }

    // 各セルの中心座標を計算
    const tcr = tc.getBoundingClientRect();
    const bcr = bc.getBoundingClientRect();
    const svgR = svg.getBoundingClientRect();
    const x1 = tcr.left + tcr.width/2 - svgR.left; // 上段セルの中心X
    const y1 = tcr.bottom - svgR.top + 4;           // 上段セルの下端Y
    const x2 = bcr.left + bcr.width/2 - svgR.left; // 下段セルの中心X
    const y2 = bcr.top - svgR.top - 4;              // 下段セルの上端Y

    // Cubic Bézier曲線のパスを生成
    // 制御点を中間Y座標に配置することでS字カーブを作成
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    const midY = (y1 + y2) / 2;
    const d = `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('fill','none');
    path.setAttribute('stroke','#0ea5e9');
    path.setAttribute('stroke-width','2');
    path.setAttribute('opacity','0.85');
    svg.appendChild(path);
  });
}

// マッピング図の状態管理
let vizOffset = 5; // 初期シフト量（A→F）
let vizRandomMapping = null; // ランダムマッピング配列（nullの場合は規則的シフト）

/**
 * マッピング図を描画（ラッパー関数）
 */
function drawMappingFigure(){
  buildMappingFigure('viz-map-top','viz-map-bottom','viz-map-lines', vizOffset, vizRandomMapping);
}

// 初期化処理
window.addEventListener('load', () => {
  drawMappingFigure();
  setupShuffleViz();
  setupQuiz();
});

// ウィンドウリサイズ時にSVG再描画
window.addEventListener('resize', drawMappingFigure);

// ============================================================
// マッピング図の操作ボタン
// ============================================================

// 「対応表を回す」ボタン: シフト量を1つずつ増やす（A→B→C...→H→A）
document.getElementById('btn-map-rotate')?.addEventListener('click', ()=>{
  vizRandomMapping = null; // ランダムマッピングをクリア
  vizOffset = (vizOffset + 1) % 8; // 0-7でループ
  drawMappingFigure();
});

// 「ランダムに対応させる」ボタン: Fisher-Yatesシャッフルで完全にランダムな対応を生成
document.getElementById('btn-map-random')?.addEventListener('click', ()=>{
  const letters = ['A','B','C','D','E','F','G','H'];
  const shuffled = [...letters];

  // Fisher-Yatesシャッフルアルゴリズム
  // - 配列を後ろから順に処理
  // - 各要素を未処理部分のランダム位置の要素と交換
  // - O(n)の時間計算量で一様分布を保証
  for(let i = shuffled.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // ES6分割代入で交換
  }

  vizRandomMapping = shuffled; // ランダムマッピング配列をセット
  drawMappingFigure();
});

// 「リセット」ボタン: 初期状態（A→F）に戻す
document.getElementById('btn-map-reset')?.addEventListener('click', ()=>{
  vizRandomMapping = null; // ランダムマッピングをクリア
  vizOffset = 5; // A→F（シフト5）
  drawMappingFigure();
});

// ============================================================
// シャッフル図（転置暗号の順序入れ替えを体験）
// ============================================================
// ドラッグ＆ドロップでブロックの順序を自由に入れ替え可能
// マウス操作、タッチ操作、キーボード操作の3つに対応

let touchDragEl = null; // タッチ操作時のドラッグ中要素を保持

/**
 * ドラッグ可能なブロック要素を生成
 * @param {string} ch - 表示する文字
 * @return {HTMLElement} ドラッグ可能なブロック要素
 */
function makeBlock(ch){
  const el = document.createElement('div');
  el.className = 'block';
  el.textContent = ch; // textContent使用でXSS対策
  el.draggable = true; // HTML5 Drag & Drop API有効化
  el.setAttribute('role','button'); // スクリーンリーダー対応
  el.setAttribute('aria-grabbed','false'); // ARIA: ドラッグ状態
  el.setAttribute('tabindex','0'); // キーボードフォーカス可能に

  // ============================================================
  // マウス操作: HTML5 Drag & Drop API
  // ============================================================
  el.addEventListener('dragstart', e=>{
    e.dataTransfer.setData('text/plain', ch); // ドラッグデータをセット
    el.classList.add('dragging'); // 視覚的フィードバック
    el.setAttribute('aria-grabbed','true');
  });
  el.addEventListener('dragend', ()=>{
    el.classList.remove('dragging');
    el.setAttribute('aria-grabbed','false');
  });

  // ============================================================
  // タッチ操作: スマートフォン・タブレット対応
  // ============================================================
  // 理由: Drag & Drop APIはタッチデバイスで動作しないため独自実装
  el.addEventListener('touchstart', e=>{
    touchDragEl = el; // グローバル変数にドラッグ中要素を保存
    el.classList.add('dragging');
    el.setAttribute('aria-grabbed','true');
  });
  el.addEventListener('touchend', ()=>{
    if(touchDragEl === el){
      el.classList.remove('dragging');
      el.setAttribute('aria-grabbed','false');
      touchDragEl = null;
    }
  });

  // ============================================================
  // キーボード操作: アクセシビリティ対応
  // ============================================================
  // 左右矢印キーでブロックを移動
  el.addEventListener('keydown', e=>{
    if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
      e.preventDefault();
      const parent = el.parentElement;
      if(!parent) return;
      const blocks = Array.from(parent.querySelectorAll('.block'));
      const idx = blocks.indexOf(el);

      // ArrowLeft: 左へ移動（前の要素と位置を交換）
      if(e.key === 'ArrowLeft' && idx > 0){
        parent.insertBefore(el, blocks[idx - 1]);
      }
      // ArrowRight: 右へ移動（次の要素の後ろに挿入）
      else if(e.key === 'ArrowRight' && idx < blocks.length - 1){
        parent.insertBefore(blocks[idx + 1], el);
      }
    }
  });

  return el;
}

/**
 * ドロップゾーンのイベントハンドラを設定
 * @param {HTMLElement} zone - ドロップ対象のコンテナ要素
 */
function setupDropZone(zone){
  // ============================================================
  // マウス操作: dragoverイベントでリアルタイム挿入
  // ============================================================
  zone.addEventListener('dragover', e=>{
    e.preventDefault(); // デフォルト動作（ドロップ禁止）を解除
    const dragging = document.querySelector('.block.dragging');
    const after = getDragAfterElement(zone, e.clientX, e.clientY);
    if(!dragging) return;

    zone.classList.add('drag-over'); // 視覚的フィードバック

    // ドラッグ中の要素を適切な位置に挿入
    if(after == null) zone.appendChild(dragging); // 末尾に追加
    else zone.insertBefore(dragging, after); // afterの前に挿入
  });

  // ドロップゾーンから離れた時の視覚的フィードバックを解除
  zone.addEventListener('dragleave', e=>{
    if(e.target === zone){
      zone.classList.remove('drag-over');
    }
  });

  // ドロップ完了時の処理
  zone.addEventListener('drop', e=>{
    zone.classList.remove('drag-over');
  });

  // ============================================================
  // タッチ操作: touchmoveイベントでリアルタイム挿入
  // ============================================================
  zone.addEventListener('touchmove', e=>{
    e.preventDefault(); // スクロール防止
    if(!touchDragEl) return;

    const touch = e.touches[0]; // 最初のタッチ座標を取得
    const after = getDragAfterElement(zone, touch.clientX, touch.clientY);
    zone.classList.add('drag-over');

    // ドラッグ中の要素を適切な位置に挿入
    if(after == null) zone.appendChild(touchDragEl);
    else zone.insertBefore(touchDragEl, after);
  }, {passive: false}); // passiveをfalseにしてpreventDefault()を有効化

  // タッチ終了時の視覚的フィードバックを解除
  zone.addEventListener('touchend', ()=>{
    zone.classList.remove('drag-over');
  });
}

/**
 * カーソル位置にもっとも近い挿入先要素を取得
 * @param {HTMLElement} container - コンテナ要素
 * @param {number} x - カーソルのX座標
 * @param {number} y - カーソルのY座標
 * @return {HTMLElement|undefined} 挿入先の次の要素（末尾の場合はundefined）
 */
function getDragAfterElement(container, x, y){
  // ドラッグ中でない全ブロックを取得
  const els = [...container.querySelectorAll('.block:not(.dragging)')];

  // reduce()でもっとも近い要素を探索
  // アルゴリズム: カーソルがブロック中心より左にあり、かつ距離が最小の要素を選択
  return els.reduce((closest, child)=>{
    const rect = child.getBoundingClientRect();
    const offset = x - rect.left - rect.width/2; // ブロック中心からの距離

    // カーソルがブロックの左側にあり、かつ現在の最小距離より近い場合
    if(offset < 0 && Math.abs(offset) < closest.offset){
      return { offset: Math.abs(offset), element: child };
    }else{
      return closest;
    }
  }, { offset: Number.POSITIVE_INFINITY }).element; // 初期値: 無限大の距離
}

/**
 * シャッフル図の初期化とボタンイベント設定
 */
function setupShuffleViz(){
  const src = document.getElementById('viz-shuffle-source');
  const tgt = document.getElementById('viz-shuffle-target');
  if(!src || !tgt) return;

  // 元テキスト「EDUCATION」を取得（空白除去、大文字化）
  const text = src.textContent.replace(/\s+/g,'').toUpperCase();

  /**
   * 文字列からブロック要素を生成してドロップゾーンに配置
   * @param {string} str - 表示する文字列
   */
  function fillFrom(str){
    tgt.innerHTML = ''; // 既存ブロックをクリア
    [...str].forEach(ch => tgt.appendChild(makeBlock(ch))); // 各文字をブロック化
  }

  // 初期配置: "EDUCATION"
  fillFrom(text);
  setupDropZone(tgt); // ドラッグ＆ドロップ有効化

  // ============================================================
  // シャッフルボタンのイベントハンドラ
  // ============================================================

  // 「ランダム並べ替え」ボタン: Fisher-Yatesシャッフル
  document.getElementById('btn-viz-shuffle-random')?.addEventListener('click', ()=>{
    const arr = [...text];
    // Fisher-Yatesシャッフルアルゴリズム（マッピング図と同じ）
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    fillFrom(arr.join(''));
  });

  // 「逆順に並べ替え」ボタン: 単純な反転
  document.getElementById('btn-viz-shuffle-reverse')?.addEventListener('click', ()=>{
    const arr = [...text].reverse();
    fillFrom(arr.join(''));
  });

  // 「偶奇入れ替え」ボタン: 隣接ペアを交換（involution）
  // 理由: 2回実行すると元に戻る性質（自己逆写像）を体験できる
  document.getElementById('btn-viz-shuffle-evenodd')?.addEventListener('click', ()=>{
    // 現在の状態を取得（ユーザーがドラッグで並べ替えた結果を反映）
    const blocks = Array.from(tgt.querySelectorAll('.block'));
    const currentText = blocks.map(b => b.textContent).join('');
    const arr = [...currentText];

    // 偶数インデックスと奇数インデックスを交換: 0↔1, 2↔3, 4↔5, ...
    // 例: EDUCATION → DEUACTION → EDUCATION（2回で元通り）
    for(let i = 0; i < arr.length - 1; i += 2){
      [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
    }
    fillFrom(arr.join(''));
  });

  // 「リセット」ボタン: 初期状態に戻す
  document.getElementById('btn-viz-shuffle-reset')?.addEventListener('click', ()=>{
    fillFrom(text); // "EDUCATION"に戻す
  });
}

// ============================================================
// クイズシステム（一問一答形式・10問）
// ============================================================
// data/quiz.jsonから問題を読み込み、セキュアに検証して表示

/**
 * クイズデータの妥当性を検証
 * @param {Object} data - quiz.jsonから読み込んだデータ
 * @return {boolean} データが正しい形式か
 *
 * 検証項目:
 * - dataがオブジェクトか
 * - questionsが配列か
 * - 各問題がprompt（string）、choices（配列）、answer_index（number）を持つか
 * - answer_indexがchoicesの範囲内か
 */
function validateQuizData(data){
  // 最上位の型チェック
  if(!data || typeof data !== 'object') return false;
  if(!Array.isArray(data.questions)) return false;

  // 各問題の構造を検証
  return data.questions.every(q => {
    return q && typeof q === 'object' &&
           typeof q.prompt === 'string' &&
           Array.isArray(q.choices) &&
           q.choices.length > 0 &&
           q.choices.every(c => typeof c === 'string') &&
           typeof q.answer_index === 'number' &&
           q.answer_index >= 0 &&
           q.answer_index < q.choices.length; // 範囲外参照を防止
  });
}

// クイズの状態管理
let quizData = null; // quiz.jsonから読み込んだ全問題データ
let currentQuestionIndex = 0; // 現在の問題番号（0始まり）
let quizScore = 0; // 正解数
let hasAnswered = false; // 現在の問題に回答済みか（二重回答防止）

/**
 * クイズシステムの初期化
 * - data/quiz.jsonを非同期で読み込み
 * - データを検証してセキュリティを確保
 * - 最初の問題を表示
 */
async function setupQuiz(){
  const loader = document.getElementById('quiz-loader');
  const container = document.getElementById('quiz-container');
  const result = document.getElementById('quiz-result');
  if(!loader || !container || !result) return;

  try{
    // クイズデータを読み込み（キャッシュ無効化で最新版を取得）
    const res = await fetch('data/quiz.json', { cache: 'no-store' });
    if(!res.ok){
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();

    // データ検証: 不正なJSONやXSS攻撃を防止
    if(!validateQuizData(data)){
      throw new Error('Invalid quiz data format');
    }

    quizData = data;
    loader.classList.add('hidden'); // ローディング表示を非表示
    container.classList.remove('hidden'); // クイズUIを表示

    // ボタンイベントハンドラを設定
    document.getElementById('btn-quiz-next')?.addEventListener('click', handleNext);
    document.getElementById('btn-quiz-restart')?.addEventListener('click', restartQuiz);

    // 最初の問題を表示
    showQuestion();

  }catch(err){
    // エラー発生時はユーザーにフィードバック
    console.error('Quiz loading error:', err);
    loader.classList.remove('hidden');
    loader.classList.add('error');
    loader.textContent = 'クイズの読み込みに失敗しました。ページをリロードしてください。';
  }
}

/**
 * 現在の問題を表示
 * - 問題文と選択肢ボタンを動的に生成
 * - XSS対策のためtextContentを使用
 * - 前回の回答フィードバックをリセット
 */
function showQuestion(){
  const progressEl = document.getElementById('quiz-progress');
  const questionEl = document.getElementById('quiz-question');
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-quiz-next');

  if(!quizData || !progressEl || !questionEl || !feedbackEl || !nextBtn) return;

  // ============================================================
  // 状態をリセット
  // ============================================================
  hasAnswered = false; // 未回答状態に
  feedbackEl.classList.add('hidden'); // フィードバック非表示
  feedbackEl.classList.remove('correct', 'incorrect');
  feedbackEl.innerHTML = '';
  nextBtn.disabled = true; // 「次へ」ボタンを無効化（回答するまで押せない）

  const q = quizData.questions[currentQuestionIndex];
  const total = quizData.questions.length;

  // ============================================================
  // 進捗状況を表示: 「問題 1 / 10」
  // ============================================================
  progressEl.textContent = `問題 ${currentQuestionIndex + 1} / ${total}`;

  // ============================================================
  // 問題文を表示
  // ============================================================
  questionEl.innerHTML = ''; // 前の問題をクリア
  const title = document.createElement('h3');
  title.textContent = q.prompt; // textContent使用でXSS対策
  questionEl.appendChild(title);

  // ============================================================
  // 選択肢ボタンを生成
  // ============================================================
  const choicesContainer = document.createElement('div');
  choicesContainer.className = 'choices';

  q.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-btn';
    btn.textContent = choice; // textContent使用でXSS対策
    btn.dataset.index = String(i); // 後で選択されたインデックスを取得するため
    btn.addEventListener('click', () => handleAnswer(i, q.answer_index));
    choicesContainer.appendChild(btn);
  });

  questionEl.appendChild(choicesContainer);
}

/**
 * ユーザーの回答を処理
 * @param {number} selectedIndex - ユーザーが選択した選択肢のインデックス
 * @param {number} correctIndex - 正解の選択肢のインデックス
 */
function handleAnswer(selectedIndex, correctIndex){
  if(hasAnswered) return; // 二重回答を防止
  hasAnswered = true;

  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-quiz-next');
  const choiceBtns = document.querySelectorAll('.choice-btn');

  if(!feedbackEl || !nextBtn) return;

  const isCorrect = selectedIndex === correctIndex;

  // ============================================================
  // スコア更新
  // ============================================================
  if(isCorrect){
    quizScore++;
  }

  // ============================================================
  // 選択肢ボタンの視覚的フィードバック
  // ============================================================
  choiceBtns.forEach(btn => {
    btn.disabled = true; // 全ボタンを無効化（再選択防止）
    const idx = parseInt(btn.dataset.index, 10);

    // 正解の選択肢を緑色で表示
    if(idx === correctIndex){
      btn.classList.add('correct');
    }
    // 不正解の選択肢を赤色で表示（ユーザーが選択した場合のみ）
    else if(idx === selectedIndex && !isCorrect){
      btn.classList.add('incorrect');
    }
  });

  // ============================================================
  // フィードバックメッセージを表示
  // ============================================================
  feedbackEl.innerHTML = '';

  // アイコン: ✓（正解）または ✗（不正解）
  const icon = document.createElement('div');
  icon.className = 'feedback-icon';
  icon.textContent = isCorrect ? '✓' : '✗';

  // テキスト: 「正解！」または「不正解」
  const text = document.createElement('div');
  text.className = 'feedback-text';
  text.textContent = isCorrect ? '正解！' : '不正解';

  feedbackEl.appendChild(icon);
  feedbackEl.appendChild(text);
  feedbackEl.classList.remove('hidden');
  feedbackEl.classList.remove('correct', 'incorrect');
  feedbackEl.classList.add(isCorrect ? 'correct' : 'incorrect'); // 色分け

  // 「次へ」ボタンを有効化
  nextBtn.disabled = false;
}

/**
 * 「次へ」ボタンのハンドラ
 * - 次の問題を表示するか、全問終了なら結果画面へ
 */
function handleNext(){
  currentQuestionIndex++;

  // まだ問題が残っている場合
  if(currentQuestionIndex < quizData.questions.length){
    showQuestion();
  }
  // 全問終了した場合
  else {
    showFinalResult();
  }
}

/**
 * 最終結果画面を表示
 * - スコア、正解率、フィードバックメッセージを表示
 * - スムーズスクロールで結果を画面中央に
 */
function showFinalResult(){
  const container = document.getElementById('quiz-container');
  const result = document.getElementById('quiz-result');

  if(!container || !result) return;

  container.classList.add('hidden'); // クイズUIを非表示

  const total = quizData.questions.length;
  const percent = Math.round((quizScore / total) * 100);
  const msg = gradeMessage(quizScore, total); // スコアに応じたメッセージ

  // ============================================================
  // 結果画面の構築
  // ============================================================
  result.innerHTML = '';

  // スコア表示: 「最終結果：7/10問正解（70%）」
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'score';
  scoreDiv.textContent = `最終結果：${quizScore}/${total}問正解（${percent}%）`;

  // フィードバックメッセージ
  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg';
  msgDiv.textContent = msg;

  // 「もう一度挑戦」ボタン
  const restartBtn = document.createElement('button');
  restartBtn.type = 'button';
  restartBtn.className = 'btn';
  restartBtn.textContent = 'もう一度挑戦';
  restartBtn.addEventListener('click', restartQuiz);

  result.appendChild(scoreDiv);
  result.appendChild(msgDiv);
  result.appendChild(restartBtn);
  result.classList.remove('hidden');
  result.scrollIntoView({ behavior:'smooth', block:'center' }); // スムーズスクロール
}

/**
 * クイズを最初からやり直す
 * - 全状態をリセットして最初の問題を表示
 */
function restartQuiz(){
  currentQuestionIndex = 0;
  quizScore = 0;
  hasAnswered = false;

  const container = document.getElementById('quiz-container');
  const result = document.getElementById('quiz-result');

  if(!container || !result) return;

  result.classList.add('hidden'); // 結果画面を非表示
  result.innerHTML = '';
  container.classList.remove('hidden'); // クイズUIを表示

  showQuestion(); // 最初の問題を表示
}

/**
 * スコアに応じたフィードバックメッセージを生成
 * @param {number} score - 正解数
 * @param {number} total - 問題総数
 * @return {string} フィードバックメッセージ
 *
 * スコア基準:
 * - 0-4問: 「もう一歩」→ 概念タブへの誘導
 * - 5-8問: 「理解は順調」→ 実践ツールへの誘導
 * - 9-10問: 「合格！」→ 達成感を与える
 */
function gradeMessage(score, total){
  if(score <= 4) return 'もう一歩。「概念」タブの図解に戻り「線＝対応」「ブロック＝並べ替え」を確認しよう。';
  if(score <= 8) return '理解は順調。「古典暗号の例」タブの各リンク先へ進み、鍵の正体（対応表／並べ替え）を実体験しよう。';
  return '合格！ 古典暗号は「換字 × 転置」の整理で迷わない。';
}
