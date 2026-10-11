/* =========================================================
   Classical Cipher Structure Trainer
   - Tabs: 3タブ構成（概念、古典暗号の例、クイズ）
   - Mapping: 対応表を SVG で描く（配置は計算部 figureLayout が決め、画面の寸法を測らない）
   - Shuffle: Pointer Events（マウス・タッチ・ペン共通）とキーボードで並べ替え
   - Quiz: js/quiz-data.js の10問（一問一答形式、解説つき）
   計算は js/structure-core.js、文言は js/messages.js、問題は js/quiz-data.js に置く。
   ========================================================= */

const Core = window.StructureCore;
const T = (key, params) => window.Messages.t(key, params);
const SVG_NS = 'http://www.w3.org/2000/svg';

/** 暗号に使う乱数（偏りのない整数は計算部の randomInt が作る） */
const fillRandom = buf => window.crypto.getRandomValues(buf);

// ============================================================
// タブ切り替え機能（WAI-ARIA APG のタブ。←→・Home・End で移り、選んだタブをすぐ表示する）
// ============================================================
const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));

function selectTab(btn, moveFocus){
  tabs.forEach(b => {
    const on = b === btn;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  panels.forEach(p => p.classList.toggle('active', p.id === btn.getAttribute('aria-controls')));
  if(moveFocus) btn.focus();
}

tabs.forEach((btn, i) => {
  btn.addEventListener('click', () => selectTab(btn, false));
  btn.addEventListener('keydown', e => {
    const last = tabs.length - 1;
    const to = { ArrowLeft: i === 0 ? last : i - 1, ArrowRight: i === last ? 0 : i + 1, Home: 0, End: last }[e.key];
    if(to === undefined) return;
    e.preventDefault();
    selectTab(tabs[to], true);
  });
});

// ============================================================
// 配色の切り替え（js/theme.js が描画前に決めた配色をボタンで反転する）
// ============================================================
function renderThemeButton(){
  const btn = document.getElementById('btn-theme');
  if(!btn || !window.Theme) return;
  const dark = window.Theme.current() === 'dark';
  btn.setAttribute('aria-pressed', String(dark));
  btn.textContent = T('theme.label');
}

document.getElementById('btn-theme')?.addEventListener('click', () => {
  window.Theme.toggle();
  renderThemeButton();
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
  renderThemeButton();
  renderMapping();
  setupShuffleViz();
  setupQuiz();
});

// OS の配色が変わったら、ボタンの状態を合わせる（自分で選んだ配色は変えない）
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', renderThemeButton);

// ============================================================
// クイズシステム（一問一答形式・10問）
// ============================================================
// 問題は js/quiz-data.js（スクリプトとして読むので file:// でも動く）。
// 表示の前に計算部の validateQuiz で形を確かめる。文字はすべて textContent で入れる。

const quiz = {
  questions: null, // 検査済みの問題
  index: 0,        // いまの問題（0始まり）
  score: 0,        // 正解数
  answered: false, // いまの問題に答えたか（二重回答を防ぐ）
};

/** 子要素を作って文字を入れる */
function el(tag, className, text){
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text !== undefined) node.textContent = text;
  return node;
}

/**
 * クイズの初期化: 問題を検査して1問目を出す
 */
function setupQuiz(){
  const loader = document.getElementById('quiz-loader');
  const container = document.getElementById('quiz-container');
  if(!loader || !container) return;

  const questions = window.QuizData && window.QuizData.ja;
  const check = Core.validateQuiz(questions);
  if(!check.ok){
    // データの誤りは画面に出す（どの問題のどの項目か）
    const detail = check.errors.slice(0, 3).map(e => T(e.key, e.params)).join(' / ');
    loader.textContent = T('quiz.error.load', { detail });
    loader.classList.add('error');
    return;
  }

  quiz.questions = questions;
  loader.classList.add('hidden');
  container.classList.remove('hidden');

  document.getElementById('btn-quiz-next')?.addEventListener('click', handleNext);
  document.getElementById('btn-quiz-restart')?.addEventListener('click', restartQuiz);
  showQuestion();
}

/**
 * いまの問題を表示する
 */
function showQuestion(){
  const progressEl = document.getElementById('quiz-progress');
  const questionEl = document.getElementById('quiz-question');
  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-quiz-next');
  if(!quiz.questions || !progressEl || !questionEl || !feedbackEl || !nextBtn) return;

  const q = quiz.questions[quiz.index];
  const total = quiz.questions.length;

  quiz.answered = false;
  feedbackEl.classList.add('hidden');
  feedbackEl.classList.remove('correct', 'incorrect');
  feedbackEl.replaceChildren();
  nextBtn.disabled = true;
  nextBtn.textContent = T(quiz.index === total - 1 ? 'quiz.finish' : 'quiz.next');

  progressEl.textContent = T('quiz.progress', { n: quiz.index + 1, total, score: quiz.score });

  const title = el('h3', 'quiz-prompt', q.prompt);
  title.id = 'quiz-prompt';
  const choices = el('div', 'choices');
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-labelledby', 'quiz-prompt');
  q.choices.forEach((choice, i) => {
    const btn = el('button', 'choice-btn');
    btn.type = 'button';
    btn.dataset.index = String(i);
    btn.appendChild(el('span', 'choice-mark'));
    btn.appendChild(el('span', 'choice-text', choice));
    btn.addEventListener('click', () => handleAnswer(i));
    choices.appendChild(btn);
  });
  questionEl.replaceChildren(title, choices);
}

/**
 * 回答を処理する。正解・不正解は色だけでなく、印（✓✗）と文字でも示す
 * @param {number} selected - 選んだ選択肢の添字
 */
function handleAnswer(selected){
  if(quiz.answered) return;
  quiz.answered = true;

  const q = quiz.questions[quiz.index];
  const isCorrect = selected === q.answer;
  if(isCorrect) quiz.score++;

  const feedbackEl = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-quiz-next');
  const progressEl = document.getElementById('quiz-progress');

  document.querySelectorAll('#quiz-question .choice-btn').forEach(btn => {
    const i = Number(btn.dataset.index);
    btn.setAttribute('aria-disabled', 'true');
    const mark = btn.querySelector('.choice-mark');
    if(i === q.answer){
      btn.classList.add('correct');
      mark.textContent = '✓';
      btn.appendChild(el('span', 'choice-note', T('quiz.mark.correct')));
    }else if(i === selected){
      btn.classList.add('incorrect');
      mark.textContent = '✗';
      btn.appendChild(el('span', 'choice-note', T('quiz.mark.chosen')));
    }
  });

  const head = el('p', 'feedback-head');
  head.appendChild(el('span', 'feedback-icon', isCorrect ? '✓' : '✗'));
  head.appendChild(el('span', 'feedback-text', T(isCorrect ? 'quiz.correct' : 'quiz.incorrect')));
  if(!isCorrect) head.appendChild(el('span', 'feedback-answer', T('quiz.answerIs', { answer: q.choices[q.answer] })));
  const explanation = el('p', 'feedback-explanation', q.explanation);
  feedbackEl.replaceChildren(head, explanation);
  feedbackEl.classList.remove('hidden', 'correct', 'incorrect');
  feedbackEl.classList.add(isCorrect ? 'correct' : 'incorrect');

  if(progressEl) progressEl.textContent = T('quiz.progress', { n: quiz.index + 1, total: quiz.questions.length, score: quiz.score });
  nextBtn.disabled = false;
  nextBtn.focus({ preventScroll: true });
}

/**
 * 「次へ」: 次の問題か、最後なら結果
 */
function handleNext(){
  if(!quiz.answered) return;
  quiz.index++;
  if(quiz.index < quiz.questions.length) showQuestion();
  else showFinalResult();
}

/**
 * 最終結果を表示する
 */
function showFinalResult(){
  const container = document.getElementById('quiz-container');
  const result = document.getElementById('quiz-result');
  if(!container || !result) return;

  container.classList.add('hidden');
  const total = quiz.questions.length;
  const percent = Math.round((quiz.score / total) * 100);

  const scoreDiv = el('h3', 'score', T('quiz.result', { score: quiz.score, total, percent }));
  scoreDiv.tabIndex = -1;
  const msgDiv = el('p', 'msg', T(gradeKey(quiz.score, total)));
  const restartBtn = el('button', 'btn primary', T('quiz.retry'));
  restartBtn.type = 'button';
  restartBtn.addEventListener('click', restartQuiz);

  result.replaceChildren(scoreDiv, msgDiv, restartBtn);
  result.classList.remove('hidden');
  scoreDiv.focus();
}

/**
 * クイズを最初からやり直す
 */
function restartQuiz(){
  quiz.index = 0;
  quiz.score = 0;
  quiz.answered = false;

  const container = document.getElementById('quiz-container');
  const result = document.getElementById('quiz-result');
  if(!container || !result) return;

  result.classList.add('hidden');
  result.replaceChildren();
  container.classList.remove('hidden');
  showQuestion();
  document.querySelector('#quiz-question .choice-btn')?.focus();
}

/**
 * 正解数に応じた文言のキー（4問以下／5〜8問／9問以上。10問以外でも割合で同じ境目）
 */
function gradeKey(score, total){
  const rate = score / total;
  if(rate <= 0.4) return 'quiz.grade.low';
  if(rate <= 0.8) return 'quiz.grade.mid';
  return 'quiz.grade.high';
}
