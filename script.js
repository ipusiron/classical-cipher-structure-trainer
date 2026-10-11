/* =========================================================
   Classical Cipher Structure Trainer
   - Tabs: 3タブ構成（概念、古典暗号の例、クイズ）
   - Mapping: 対応表を SVG で描く（配置は計算部 figureLayout が決め、画面の寸法を測らない）
   - Shuffle: Pointer Events（マウス・タッチ・ペン共通）とキーボードで並べ替え
   - Quiz: data/quiz.jsonから10問読み込み（一問一答形式）
   計算は js/structure-core.js、文言は js/messages.js に置く。
   ========================================================= */

const Core = window.StructureCore;
const T = (key, params) => window.Messages.t(key, params);
const SVG_NS = 'http://www.w3.org/2000/svg';

/** 暗号に使う乱数（偏りのない整数は計算部の randomInt が作る） */
const fillRandom = buf => window.crypto.getRandomValues(buf);

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
  });
});

// ============================================================
// マッピング図（換字暗号の対応関係を SVG で可視化）
// ============================================================
// 上段＝平文の文字 A〜H、下段＝暗号文の文字（A〜H か 1〜8）。
// 鍵 map は「上段の i 番目 → 下段の map[i] 番目」。シフトもランダムも同じ形で持つ。

const mapState = {
  offset: Core.DEFAULT_OFFSET, // シフト量（A→F）
  random: null,                // ランダムな対応表（null ならシフト）
  charset: 'letters',          // 下段の文字: 'letters'（A〜H）か 'numbers'（1〜8）
};

function currentMap(){
  return mapState.random || Core.shiftMap(Core.TOP_LETTERS.length, mapState.offset);
}

/** SVG の要素を作る（属性は setAttribute。style 属性は使わない） */
function svgEl(name, attrs){
  const el = document.createElementNS(SVG_NS, name);
  for(const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** 1つのセル（角丸の四角と文字） */
function svgCell(cx, y, size, ch){
  const g = svgEl('g', { class: 'map-cell' });
  g.appendChild(svgEl('rect', { x: cx - size / 2, y, width: size, height: size, rx: 9 }));
  const text = svgEl('text', { x: cx, y: y + size / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
  text.textContent = ch; // textContent で描く
  g.appendChild(text);
  return g;
}

/**
 * マッピング図を描く。
 * viewBox の座標で描くので、幅が変わっても拡大・縮小されるだけで折り返さない。
 * 非表示のタブの中でも同じ図になる（以前のような再描画は要らない）。
 */
function renderMapping(){
  const svg = document.getElementById('map-figure');
  const key = document.getElementById('map-key');
  const desc = document.getElementById('map-figure-desc');
  const charset = document.getElementById('map-charset');
  if(!svg || !key || !desc) return;

  const top = Core.TOP_LETTERS;
  const bottom = Core.BOTTOM_SETS[mapState.charset];
  const map = currentMap();
  const g = Core.figureLayout(top.length);

  svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  svg.replaceChildren();

  // 線（セルの下に置く）
  const lines = svgEl('g', { class: 'map-lines' });
  map.forEach((j, i) => {
    const d = Core.curvePath(g.xs[i], g.topY + g.cell + 4, g.xs[j], g.bottomY - 4);
    lines.appendChild(svgEl('path', { d, class: 'map-line' }));
  });
  svg.appendChild(lines);

  top.forEach((ch, i) => svg.appendChild(svgCell(g.xs[i], g.topY, g.cell, ch)));
  bottom.forEach((ch, i) => svg.appendChild(svgCell(g.xs[i], g.bottomY, g.cell, ch)));

  // 図の中身を文字でも示す（読み上げ・図が見えない人のため）
  const pairs = Core.mappingPairs(map, top, bottom).map(([from, to]) => T('map.pair', { from, to })).join(' ');
  const offset = Core.shiftOf(map);
  const kind = offset === null ? T('map.kind.random') : T('map.kind.shift', { offset });
  key.textContent = T('map.key', { kind, pairs });
  desc.textContent = T('map.figure', { pairs });
  if(charset) charset.textContent = T(`map.charset.${mapState.charset}`);
}

// 「対応表を回す」: シフト量を1つずつ増やす（A→B→C…→H→A）
document.getElementById('btn-map-rotate')?.addEventListener('click', () => {
  mapState.random = null;
  mapState.offset = (mapState.offset + 1) % Core.TOP_LETTERS.length;
  renderMapping();
});

// 「ランダムに対応させる」: 一様な順列（Fisher–Yates、乱数は crypto.getRandomValues）
document.getElementById('btn-map-random')?.addEventListener('click', () => {
  mapState.random = Core.randomPermutation(Core.TOP_LETTERS.length, fillRandom);
  renderMapping();
});

// 下段の文字を A〜H と 1〜8 で切り替える（対応表はそのまま）
document.getElementById('btn-map-toggle-charset')?.addEventListener('click', () => {
  mapState.charset = mapState.charset === 'letters' ? 'numbers' : 'letters';
  renderMapping();
});

// 「リセット」: 初期状態（シフト5、A〜H）に戻す
document.getElementById('btn-map-reset')?.addEventListener('click', () => {
  mapState.random = null;
  mapState.offset = Core.DEFAULT_OFFSET;
  mapState.charset = 'letters';
  renderMapping();
});

// ============================================================
// シャッフル図（転置暗号の順序入れ替えを体験）
// ============================================================
// 鍵 order は「並べ替えたあとの i 番目に、元の order[i] 番目の文字を置く」（取り出す向き）。
// 画面は order だけから描く。ドラッグ・キー操作・ボタンはどれも order を変えて描き直す。
// マウス・タッチ・ペンは Pointer Events、キーボードは「Space で持ち上げ→←→→Space で置く」。

const shuffleLetters = [...Core.SHUFFLE_WORD];
const shuffle = {
  order: Core.identity(shuffleLetters.length),
  focus: 0,        // Tab で入ったときにフォーカスするブロック（元の番号）
  grabbed: null,   // キーボードで持ち上げているブロック（元の番号）
  before: null,    // 持ち上げる前の並び（Esc で戻す）
  drag: null,      // ポインターで動かしている最中の情報
  rendering: false,
};
const shuffleItems = []; // 元の番号 → li 要素

function shuffleWord(){
  return Core.applyOrder(shuffleLetters, shuffle.order).join('');
}

function announceShuffle(key, params = {}){
  const status = document.getElementById('shuffle-status');
  if(status) status.textContent = T(key, { word: shuffleWord(), ...params });
}

/** order のとおりに li を並べ直す。並べ直しで外れたフォーカスは戻す */
function renderShuffle(){
  const list = document.getElementById('shuffle-list');
  const now = document.getElementById('shuffle-now');
  if(!list) return;
  const active = list.contains(document.activeElement) ? document.activeElement : null;
  shuffle.rendering = true;
  shuffle.order.forEach((src, pos) => {
    const li = shuffleItems[src];
    if(list.children[pos] !== li) list.insertBefore(li, list.children[pos] || null);
    const btn = li.firstElementChild;
    btn.setAttribute('aria-label', T('shuffle.block', { ch: shuffleLetters[src], from: src + 1, to: pos + 1 }));
    btn.setAttribute('aria-pressed', String(shuffle.grabbed === src));
    btn.tabIndex = src === shuffle.focus ? 0 : -1;
    li.classList.toggle('grabbed', shuffle.grabbed === src);
  });
  if(active && document.activeElement !== active) active.focus({ preventScroll: true });
  shuffle.rendering = false;
  if(now) now.textContent = T('shuffle.now', { word: shuffleWord() });
}

/** ボタン操作で並びを変える（持ち上げ中なら置いてから） */
function setShuffleOrder(order){
  shuffle.grabbed = null;
  shuffle.before = null;
  shuffle.order = order;
  renderShuffle();
  announceShuffle('shuffle.changed');
}

function dropGrabbed(){
  if(shuffle.grabbed === null) return;
  const src = shuffle.grabbed;
  shuffle.grabbed = null;
  shuffle.before = null;
  renderShuffle();
  announceShuffle('shuffle.dropped', { ch: shuffleLetters[src], pos: shuffle.order.indexOf(src) + 1 });
}

function onShuffleKeydown(e){
  const btn = e.target.closest('.block');
  if(!btn) return;
  const src = Number(btn.dataset.src);
  const pos = shuffle.order.indexOf(src);
  const last = shuffle.order.length - 1;

  if(e.key === ' ' || e.key === 'Enter'){
    e.preventDefault();
    if(shuffle.grabbed === src){
      dropGrabbed();
    }else{
      shuffle.grabbed = src;
      shuffle.before = [...shuffle.order];
      renderShuffle();
      announceShuffle('shuffle.grabbed', { ch: shuffleLetters[src], pos: pos + 1 });
    }
    return;
  }
  if(e.key === 'Escape' && shuffle.grabbed !== null){
    e.preventDefault();
    shuffle.order = shuffle.before;
    shuffle.grabbed = null;
    shuffle.before = null;
    renderShuffle();
    announceShuffle('shuffle.cancelled');
    return;
  }

  const target = { ArrowLeft: pos - 1, ArrowRight: pos + 1, Home: 0, End: last }[e.key];
  if(target === undefined) return;
  e.preventDefault();
  const to = Math.max(0, Math.min(last, target));
  if(shuffle.grabbed === src){
    // 持ち上げている: ブロックを動かす（フォーカスはこのブロックのまま）
    if(to === pos) return;
    shuffle.order = Core.moveIndex(shuffle.order, pos, to);
    renderShuffle();
    announceShuffle('shuffle.moved', { ch: shuffleLetters[src], pos: to + 1 });
  }else{
    // 持ち上げていない: フォーカスだけ隣のブロックへ
    shuffle.focus = shuffle.order[to];
    renderShuffle();
    shuffleItems[shuffle.focus].firstElementChild.focus();
  }
}

function onShufflePointerDown(e){
  const btn = e.target.closest('.block');
  if(!btn || !e.isPrimary || e.button !== 0) return;
  const list = e.currentTarget;
  dropGrabbed();
  shuffle.focus = Number(btn.dataset.src);
  shuffle.drag = { src: shuffle.focus, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  // 捕捉は li ではなく ol に置く（li は並べ直しで動くので、捕捉が外れないように）
  list.setPointerCapture(e.pointerId);
}

function onShufflePointerMove(e){
  const d = shuffle.drag;
  if(!d || e.pointerId !== d.id) return;
  if(!d.moved){
    if(Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    d.moved = true;
    shuffleItems[d.src].classList.add('dragging');
  }
  const others = shuffle.order.filter(s => s !== d.src);
  const boxes = others.map(s => shuffleItems[s].getBoundingClientRect());
  const next = [...others];
  next.splice(Core.insertionIndex(boxes, e.clientX, e.clientY), 0, d.src);
  if(next.join() !== shuffle.order.join()){
    shuffle.order = next;
    renderShuffle();
  }
}

function onShufflePointerEnd(e){
  const d = shuffle.drag;
  if(!d || e.pointerId !== d.id) return;
  shuffle.drag = null;
  shuffleItems[d.src].classList.remove('dragging');
  if(d.moved) announceShuffle('shuffle.dropped', { ch: shuffleLetters[d.src], pos: shuffle.order.indexOf(d.src) + 1 });
}

/**
 * シャッフル図の初期化とボタンイベント設定
 */
function setupShuffleViz(){
  const list = document.getElementById('shuffle-list');
  if(!list) return;

  shuffleLetters.forEach((ch, src) => {
    const li = document.createElement('li');
    li.className = 'slot';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'block';
    btn.dataset.src = String(src);
    btn.textContent = ch; // textContent で描く
    li.appendChild(btn);
    shuffleItems.push(li);
  });

  list.addEventListener('keydown', onShuffleKeydown);
  list.addEventListener('pointerdown', onShufflePointerDown);
  list.addEventListener('pointermove', onShufflePointerMove);
  list.addEventListener('pointerup', onShufflePointerEnd);
  list.addEventListener('pointercancel', onShufflePointerEnd);
  list.addEventListener('lostpointercapture', onShufflePointerEnd);
  list.addEventListener('focusin', e => {
    const btn = e.target.closest('.block');
    if(btn && !shuffle.rendering && shuffle.focus !== Number(btn.dataset.src)){
      shuffle.focus = Number(btn.dataset.src);
      renderShuffle();
    }
  });
  // 持ち上げたまま Tab などで外へ出たら、その場に置く
  list.addEventListener('focusout', e => {
    if(!shuffle.rendering && !list.contains(e.relatedTarget)) dropGrabbed();
  });

  renderShuffle();

  // ============================================================
  // シャッフルボタンのイベントハンドラ（どれも「いまの並び」に掛ける）
  // ============================================================

  // 「ランダムに並べ替え」: 一様な順列（Fisher–Yates、乱数は crypto.getRandomValues）
  document.getElementById('btn-shuffle-random')?.addEventListener('click', () => {
    setShuffleOrder(Core.randomPermutation(shuffleLetters.length, fillRandom));
  });

  // 「逆順にする」: いまの並びを反転（2回で元に戻る）
  document.getElementById('btn-shuffle-reverse')?.addEventListener('click', () => {
    setShuffleOrder(Core.reverseOrder(shuffle.order));
  });

  // 「偶奇を入れ替え」: 1・2番目、3・4番目…を交換（2回で元に戻る）
  // 例: EDUCATION → DECUTAOIN → EDUCATION
  document.getElementById('btn-shuffle-evenodd')?.addEventListener('click', () => {
    setShuffleOrder(Core.swapPairs(shuffle.order));
  });

  // 「リセット」: 元の並び（EDUCATION）に戻す
  document.getElementById('btn-shuffle-reset')?.addEventListener('click', () => {
    setShuffleOrder(Core.identity(shuffleLetters.length));
  });
}

// 初期化処理
window.addEventListener('load', () => {
  renderMapping();
  setupShuffleViz();
  setupQuiz();
});

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
