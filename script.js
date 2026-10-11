/* =========================================================
   Classical Cipher Structure Trainer
   - Tabs: 5タブ構成（概念、実験室、見分ける、古典暗号の例、クイズ）
   - Lab: 英文に換字・転置・多表式を掛け、保たれるもの・順番の入れ替え・暗号文からの見分けを数える
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

  // 鍵を見る: 逆の表（下段 → 上段）と、対応表の数
  const inv = Core.invert(map);
  const inversePairs = bottom.map((ch, j) => T('map.pair', { from: ch, to: top[inv[j]] })).join(' ');
  const invEl = document.getElementById('map-inverse');
  if(invEl) invEl.textContent = T('map.inverse', { pairs: inversePairs });
  const countEl = document.getElementById('map-count');
  if(countEl) countEl.textContent = T('map.count', { n: top.length, total: Core.groupDigits(Core.factorial(top.length)) });
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

  // 鍵を見る: 並べ替えの鍵（取り出す向き、1始まり）と元に戻す鍵、並べ方の数
  const oneBased = o => o.map(i => i + 1).join(' ');
  const keyEl = document.getElementById('shuffle-key');
  if(keyEl) keyEl.textContent = T('shuffle.key', { order: oneBased(shuffle.order) });
  const invEl = document.getElementById('shuffle-inverse');
  if(invEl) invEl.textContent = T('shuffle.inverse', { order: oneBased(Core.invert(shuffle.order)) });
  const countEl = document.getElementById('shuffle-count');
  if(countEl) {
    countEl.textContent = T('shuffle.count', { word: Core.SHUFFLE_WORD, n: shuffleLetters.length,
      total: Core.groupDigits(Core.factorial(shuffleLetters.length)) });
  }
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

// ============================================================
// 古典暗号の例（js/catalog.js の一覧からカードを描く）
// ============================================================
// カード全体を押せるように、見出しのリンクの ::after をカードに広げる（CSS）。
// リンクの名前は暗号の名前だけにして、説明とツール名はカードの文として読む。

function renderCatalog(){
  const box = document.getElementById('catalog');
  if(!box || !window.Catalog) return;
  const { KINDS, tools, url } = window.Catalog;

  const sections = KINDS.map(kind => {
    const items = tools.filter(t => t.kind === kind);
    const section = el('section', 'cipher-category');
    const title = el('h3', 'category-title', T(`catalog.kind.${kind}`));
    title.id = `catalog-${kind}`;
    section.setAttribute('aria-labelledby', title.id);
    section.appendChild(title);
    section.appendChild(el('p', 'category-desc', T(`catalog.kind.${kind}.desc`, { count: items.length })));

    const grid = el('ul', 'cipher-grid');
    items.forEach(t => {
      const card = el('li', 'cipher-card');
      const head = el('h4', 'cipher-name');
      const text = window.Catalog.textOf(t, window.Messages.lang);
      const link = el('a', null, text.name);
      link.href = url(t.slug);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(el('span', 'sr-only', T('catalog.newTab')));
      head.appendChild(link);
      card.appendChild(head);
      card.appendChild(el('span', `cipher-tag tag-${t.sub}`, T(`catalog.sub.${t.sub}`)));
      card.appendChild(el('p', 'cipher-desc', text.desc));
      card.appendChild(el('p', 'cipher-tool', T('catalog.tool', { day: String(t.day).padStart(3, '0'), title: t.title })));
      const arrow = el('span', 'cipher-arrow', '→');
      arrow.setAttribute('aria-hidden', 'true');
      card.appendChild(arrow);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    section.dataset.kind = kind;
    return section;
  });

  // 分類で絞り込む（ラジオボタン。選んだ分類の節だけを見せる）
  const filter = el('fieldset', 'catalog-filter');
  filter.appendChild(el('legend', null, T('catalog.filter.legend')));
  for(const kind of ['all', ...KINDS]){
    const count = kind === 'all' ? tools.length : tools.filter(t => t.kind === kind).length;
    const label = el('label', 'filter-chip');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'catalog-filter';
    radio.value = kind;
    radio.checked = kind === catalogFilter;
    radio.addEventListener('change', () => {
      catalogFilter = kind;
      sections.forEach(s => { s.hidden = kind !== 'all' && s.dataset.kind !== kind; });
      const status = document.getElementById('catalog-status');
      if(status) status.textContent = T('catalog.filter.status', { label: T(`catalog.filter.${kind}`), count });
    });
    label.appendChild(radio);
    label.appendChild(el('span', null, T('catalog.filter.option', { label: T(`catalog.filter.${kind}`), count })));
    filter.appendChild(label);
  }
  sections.forEach(s => { s.hidden = catalogFilter !== 'all' && s.dataset.kind !== catalogFilter; });
  box.replaceChildren(filter, ...sections);
}

let catalogFilter = 'all'; // 古典暗号の例の絞り込み（言語を切り替えて描き直しても保つ）

// ============================================================
// 実験室（英文に換字・転置・多表式を掛けて、保たれるものを比べる）
// ============================================================
// 計算は js/lab-core.js（LabCore）。英語の頻度は js/english-freq.js。
// 入力欄の値と各欄の設定だけから画面を描く（前の結果を持ち越さない）。

const Lab = window.LabCore;
const FREQ = window.EnglishFreq.FREQ;
const SHOW_MAX = 600; // 画面に出す英字の上限（それより後ろは数だけ示す）

const labState = {
  randomMap: null, // 「ランダムな換字表」の表（作り直すまで同じ）
  cipher: '',      // いまの暗号文（「見分ける」へ送る）
};

/** 5文字ごとに区切って表示用にする。長い文は SHOW_MAX 文字で切る */
function displayLetters(text){
  const head = text.slice(0, SHOW_MAX).replace(/(.{5})/g, '$1 ').trim();
  return text.length > SHOW_MAX ? `${head} ${T('lab.more', { n: text.length - SHOW_MAX })}` : head;
}

/** 欄の値から操作を作る。誤りは { error } */
function labOperation(){
  const method = document.getElementById('lab-method').value;
  const num = id => Number(document.getElementById(id).value);
  const key = (id, min) => Lab.parseKeyword(document.getElementById(id).value, { min });
  if(method === 'shift'){
    const v = num('lab-shift');
    return Number.isInteger(v) && v >= 1 && v <= 25 ? { op: { type: 'shift', shift: v } } : { error: { key: 'lab.error.shift', params: {} } };
  }
  if(method === 'keyword'){
    const k = key('lab-subkey', 1);
    return k.error ? k : { op: { type: 'keyword', key: k.value } };
  }
  if(method === 'random'){
    if(!labState.randomMap) labState.randomMap = Lab.randomKey(fillRandom);
    return { op: { type: 'map', map: labState.randomMap } };
  }
  if(method === 'vigenere'){
    const k = key('lab-vigkey', 1);
    return k.error ? k : { op: { type: 'vigenere', key: k.value } };
  }
  if(method === 'railfence'){
    const v = num('lab-rails');
    return Number.isInteger(v) && v >= 2 && v <= Lab.MAX_RAILS ? { op: { type: 'railfence', rails: v } } : { error: { key: 'lab.error.rails', params: {} } };
  }
  if(method === 'columnar'){
    const k = key('lab-colkey', 2);
    return k.error ? k : { op: { type: 'columnar', key: k.value } };
  }
  return { op: { type: 'reverse' } };
}

/** 鍵の中身を文で示す */
function labKeyInfo(op, plain){
  if(op.type === 'shift' || op.type === 'keyword' || op.type === 'map'){
    const map = op.type === 'shift' ? Lab.shiftKey(op.shift) : op.type === 'keyword' ? Lab.keywordKey(op.key) : op.map;
    return T('lab.key.sub', { plain: Lab.ALPHABET.join(''), cipher: Lab.cipherAlphabet(map) });
  }
  if(op.type === 'vigenere') return T('lab.key.vig', { key: op.key });
  const order = op.type === 'reverse' ? Lab.reverseOrder(plain.length)
    : op.type === 'railfence' ? Lab.railFenceOrder(plain.length, op.rails) : Lab.columnarOrder(plain.length, op.key);
  const shown = order.slice(0, 20).map(i => i + 1).join(' ');
  return T('lab.key.trans', { order: order.length > 20 ? `${shown} …` : shown });
}

/** 多い文字を「E 37・T 30・A 24」の形に */
function topText(text){
  return Lab.topLetters(text, 3).map(e => `${e.ch} ${e.c}`).join(T('list.sep'));
}

/** 文字ごとの出現回数の棒グラフ（平文と暗号文で縦の目盛りをそろえる） */
function renderBars(box, counts, max, label){
  const cols = counts.map((c, i) => {
    const col = el('div', 'bar-col');
    col.setAttribute('title', T('lab.bars.tip', { ch: Lab.ALPHABET[i], c }));
    const bar = el('div', c > 0 ? 'bar' : 'bar zero');
    bar.style.height = `${max > 0 ? Math.max(c / max * 100, c > 0 ? 3 : 0) : 0}%`; // CSSOM（style 属性ではない）
    const track = el('div', 'bar-track');
    track.appendChild(bar);
    col.appendChild(track);
    col.appendChild(el('span', 'bar-label', Lab.ALPHABET[i]));
    return col;
  });
  box.replaceChildren(...cols);
  const top = counts.map((c, i) => ({ ch: Lab.ALPHABET[i], c })).filter(e => e.c > 0)
    .sort((a, b) => b.c - a.c).slice(0, 3).map(e => `${e.ch} ${e.c}`).join(T('list.sep'));
  box.setAttribute('aria-label', T('lab.bars.aria', { label, top: top || T('lab.none') }));
}

function renderCountTable(table, plainCounts, cipherCounts){
  const head = el('thead');
  const hr = el('tr');
  for(const k of ['lab.count.letter', 'lab.count.plain', 'lab.count.cipher']){
    const th = el('th', null, T(k));
    th.scope = 'col';
    hr.appendChild(th);
  }
  head.appendChild(hr);
  const body = el('tbody');
  Lab.ALPHABET.forEach((ch, i) => {
    const tr = el('tr');
    const th = el('th', null, ch);
    th.scope = 'row';
    tr.appendChild(th);
    tr.appendChild(el('td', null, String(plainCounts[i])));
    tr.appendChild(el('td', null, String(cipherCounts[i])));
    body.appendChild(tr);
  });
  table.replaceChildren(head, body);
}

function renderLab(){
  const input = document.getElementById('lab-input');
  if(!input) return;
  const method = document.getElementById('lab-method').value;
  document.querySelectorAll('#tab-lab .param').forEach(p => { p.hidden = p.dataset.param !== method; });

  const plain = Lab.letters(input.value);
  document.getElementById('lab-count').textContent = T('lab.count', { letters: plain.length, chars: [...input.value].length, max: Lab.MAX_INPUT });
  const errorEl = document.getElementById('lab-error');
  const outputs = ['lab-plain', 'lab-cipher', 'lab-keyinfo', 'lab-explain'].map(id => document.getElementById(id));
  const tbody = document.getElementById('lab-tbody');
  const toDetect = document.getElementById('btn-lab-to-detect');

  const { op, error } = labOperation();
  errorEl.textContent = error ? T(error.key, error.params) : '';
  if(error || plain.length === 0){
    outputs.forEach(o => { o.textContent = ''; });
    if(!error) outputs[3].textContent = T('lab.empty');
    tbody.replaceChildren();
    ['lab-bars-plain', 'lab-bars-cipher', 'lab-count-table'].forEach(id => document.getElementById(id).replaceChildren());
    labState.cipher = '';
    toDetect.disabled = true;
    renderMix();
    return;
  }

  const cipher = Lab.apply(plain, op);
  labState.cipher = cipher;
  toDetect.disabled = false;
  outputs[0].textContent = displayLetters(plain);
  outputs[1].textContent = displayLetters(cipher);
  outputs[2].textContent = labKeyInfo(op, plain);

  // 保たれたもの
  const inv = Lab.invariants(plain, cipher);
  const icP = Lab.ic(plain);
  const icC = Lab.ic(cipher);
  const chiP = Lab.chiSquare(plain, FREQ);
  const chiC = Lab.chiSquare(cipher, FREQ);
  const short = s => (s.length > 12 ? `${s.slice(0, 12)}…` : s);
  const rows = [
    ['lab.row.counts', topText(plain), topText(cipher), inv.counts],
    ['lab.row.profile', Lab.profile(plain).slice(0, 5).join(', '), Lab.profile(cipher).slice(0, 5).join(', '), inv.profile],
    ['lab.row.pattern', short(plain), short(cipher), inv.pattern],
    ['lab.row.ic', icP.toFixed(4), icC.toFixed(4), Math.abs(icP - icC) < 1e-12],
    ['lab.row.chi', chiP.toFixed(1), chiC.toFixed(1), Math.abs(chiP - chiC) < 1e-9],
  ];
  tbody.replaceChildren(...rows.map(([key, a, b, kept]) => {
    const tr = el('tr');
    const th = el('th', null, T(key));
    th.scope = 'row';
    tr.appendChild(th);
    // 狭い画面では見出しの行を隠し、各セルの前に data-label の見出しを出す（CSS）
    const cell = (cls, text, label) => {
      const td = el('td', cls, text);
      td.dataset.label = T(label);
      return td;
    };
    tr.appendChild(cell('mono-cell', a, 'lab.count.plain'));
    tr.appendChild(cell('mono-cell', b, 'lab.count.cipher'));
    tr.appendChild(cell(kept ? 'kept yes' : 'kept no', T(kept ? 'lab.kept.yes' : 'lab.kept.no'), 'lab.result'));
    return tr;
  }));
  outputs[3].textContent = T(`lab.explain.${Lab.family(op)}`);

  // 棒グラフと表（縦の目盛りは2つの大きいほうにそろえる）
  const pc = Lab.counts(plain);
  const cc = Lab.counts(cipher);
  const max = Math.max(...pc, ...cc);
  renderBars(document.getElementById('lab-bars-plain'), pc, max, T('lab.bars.plain'));
  renderBars(document.getElementById('lab-bars-cipher'), cc, max, T('lab.bars.cipher'));
  renderCountTable(document.getElementById('lab-count-table'), pc, cc);
  renderMix();
}

// ------------------------------------------------------------
// 重ねる（換字と転置の順番を入れ替える）
// ------------------------------------------------------------
const MIX_SUB = { keyword: { type: 'keyword', key: 'ZEBRA' }, shift: { type: 'shift', shift: 3 }, vigenere: { type: 'vigenere', key: 'LEMON' } };
const MIX_TRANS = { columnar: { type: 'columnar', key: 'KEY' }, railfence: { type: 'railfence', rails: 3 }, reverse: { type: 'reverse' } };

function renderMix(){
  const ab = document.getElementById('mix-ab');
  if(!ab) return;
  const ba = document.getElementById('mix-ba');
  const verdict = document.getElementById('mix-verdict');
  const note = document.getElementById('mix-note');
  const plain = Lab.letters(document.getElementById('lab-input').value);
  if(plain.length === 0){
    [ab, ba, note].forEach(o => { o.textContent = ''; });
    verdict.textContent = T('lab.empty');
    verdict.className = 'verdict';
    return;
  }
  const sub = MIX_SUB[document.getElementById('mix-sub').value];
  const trans = MIX_TRANS[document.getElementById('mix-trans').value];
  const c = Lab.commute(plain, sub, trans);
  ab.textContent = displayLetters(c.ab);
  ba.textContent = displayLetters(c.ba);
  if(c.same){
    verdict.textContent = T('mix.same');
  }else{
    let i = 0;
    while(c.ab[i] === c.ba[i]) i++;
    verdict.textContent = T('mix.diff', { pos: i + 1 });
  }
  verdict.className = c.same ? 'verdict yes' : 'verdict no';
  note.textContent = T(Lab.invariants(plain, c.ab).profile ? 'mix.note.profileKept' : 'mix.note.profileBroken');
}

// ------------------------------------------------------------
// 見分ける（暗号文だけから）
// ------------------------------------------------------------

function renderDetect(){
  const input = document.getElementById('detect-input');
  if(!input) return;
  const text = Lab.letters(input.value);
  document.getElementById('detect-count').textContent = T('detect.count', { letters: text.length, min: Lab.MIN_LETTERS });
  const box = document.getElementById('detect-result');
  const links = document.getElementById('detect-links');

  let kind = null;
  if(text.length === 0){
    box.replaceChildren(el('p', 'field-note', T('detect.empty')));
  }else{
    const r = Lab.classify(text, FREQ);
    kind = r.kind;
    const th = Lab.THRESHOLDS;
    const head = el('p', `verdict kind-${r.kind}`, T(`detect.kind.${r.kind}`));
    const steps = el('ol', 'detect-steps');
    steps.appendChild(el('li', null, T('detect.step.n', { n: r.n, min: Lab.MIN_LETTERS })));
    if(r.kind !== 'short'){
      const low = r.chi < th.chiMax;
      steps.appendChild(el('li', null, T(low ? 'detect.step.chiLow' : 'detect.step.chiHigh', { chi: r.chi.toFixed(1), max: th.chiMax })));
      if(!low){
        const high = r.ic >= th.icMin;
        steps.appendChild(el('li', null, T(high ? 'detect.step.icHigh' : 'detect.step.icLow', { ic: r.ic.toFixed(4), min: th.icMin })));
      }
    }
    const top = el('p', 'field-note', T('detect.top', { letters: Lab.topLetters(text, 6).map(e => `${e.ch} ${e.c}`).join(T('list.sep')) }));
    const caution = el('p', 'field-note', T('detect.caution'));
    box.replaceChildren(head, steps, top, caution);
  }

  // 案内するツール（見分けた結果ごと。暗号文を渡せるものは #text= で渡す）
  const groups = kind && kind !== 'short' ? [...Lab.HANDOFF[kind], ...Lab.HANDOFF.any] : Lab.HANDOFF.any;
  links.replaceChildren(...groups.map(entry => {
    const { url, withText } = Lab.handoffUrl(entry, text);
    const li = el('li');
    const a = el('a', null, T('detect.link.name', { title: entry.title, day: String(entry.day).padStart(3, '0') }));
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.appendChild(el('span', 'sr-only', T('catalog.newTab')));
    li.appendChild(a);
    li.appendChild(el('span', 'link-note', T(withText ? 'detect.link.withText' : 'detect.link.page')));
    return li;
  }));
}

function renderAccuracy(){
  const table = document.getElementById('detect-accuracy');
  const acc = window.ClassifyAccuracy;
  if(!table || !acc) return;
  document.getElementById('detect-method').textContent = T('detect.method', {
    train: T('detect.book', acc.train), test: T('detect.book', acc.test), per: acc.perClass,
    chi: acc.thresholds.chiMax, ic: acc.thresholds.icMin,
  });
  const head = el('thead');
  const hr = el('tr');
  for(const k of ['detect.acc.length', 'detect.acc.transposition', 'detect.acc.mono', 'detect.acc.poly']){
    const th = el('th', null, T(k));
    th.scope = 'col';
    hr.appendChild(th);
  }
  head.appendChild(hr);
  const body = el('tbody');
  for(const [len, v] of Object.entries(acc.evaluation)){
    const tr = el('tr');
    const th = el('th', null, T('detect.acc.letters', { n: len }));
    th.scope = 'row';
    tr.appendChild(th);
    for(const k of ['transposition', 'mono', 'poly']) tr.appendChild(el('td', null, `${v[k]}%`));
    body.appendChild(tr);
  }
  table.replaceChildren(head, body);
  document.getElementById('detect-limits').textContent = T('detect.limits');
}

/** 例を入れる（『二都物語』の冒頭に、それぞれの暗号を掛けた文） */
function detectExample(op){
  const input = document.getElementById('detect-input');
  input.value = Lab.apply(Lab.letters(Lab.SAMPLES.DETECT), op);
  renderDetect();
}

function setupLab(){
  const input = document.getElementById('lab-input');
  if(!input) return;
  input.value = Lab.SAMPLES.LAB;
  let pending = 0;
  const schedule = () => {
    if(pending) return;
    pending = requestAnimationFrame(() => { pending = 0; renderLab(); });
  };
  for(const id of ['lab-input', 'lab-shift', 'lab-subkey', 'lab-vigkey', 'lab-rails', 'lab-colkey']){
    document.getElementById(id).addEventListener('input', schedule);
  }
  for(const id of ['lab-method', 'mix-sub', 'mix-trans']){
    document.getElementById(id).addEventListener('change', renderLab);
  }
  document.getElementById('btn-lab-random').addEventListener('click', () => {
    labState.randomMap = Lab.randomKey(fillRandom);
    renderLab();
  });
  document.getElementById('btn-lab-to-detect').addEventListener('click', () => {
    if(!labState.cipher) return;
    document.getElementById('detect-input').value = labState.cipher;
    renderDetect();
    selectTab(document.getElementById('btn-detect'), true);
  });
  renderLab();

  const detect = document.getElementById('detect-input');
  let pendingDetect = 0;
  detect.addEventListener('input', () => {
    if(pendingDetect) return;
    pendingDetect = requestAnimationFrame(() => { pendingDetect = 0; renderDetect(); });
  });
  document.getElementById('btn-detect-ex-trans').addEventListener('click', () => detectExample({ type: 'columnar', key: 'ZEBRAS' }));
  document.getElementById('btn-detect-ex-mono').addEventListener('click', () => detectExample({ type: 'keyword', key: 'ZEBRA' }));
  document.getElementById('btn-detect-ex-poly').addEventListener('click', () => detectExample({ type: 'vigenere', key: 'LEMON' }));
  document.getElementById('btn-detect-clear').addEventListener('click', () => {
    detect.value = '';
    renderDetect();
    detect.focus();
  });
  renderDetect();
  renderAccuracy();
}

// ============================================================
// 日英の切り替え
// ============================================================
// index.html の日本語は js/i18n.js が控えて js/i18n-en.js で入れ替え、
// JavaScript が描く部分は messages.js の文言で描き直す（計算はし直さない）。

function renderLangButton(){
  const btn = document.getElementById('btn-lang');
  if(!btn) return;
  btn.textContent = T('lang.switch');
  btn.setAttribute('lang', window.Messages.lang === 'ja' ? 'en' : 'ja');
}

function setLanguage(lang, { store = false, rerender = true } = {}){
  window.I18n.apply(lang, window.I18nEn);
  window.Messages.setLang(lang);
  document.documentElement.lang = lang;
  if(store) window.I18n.store(lang);
  renderLangButton();
  if(!rerender) return;
  renderThemeButton();
  renderMapping();
  renderShuffle();
  renderLab();
  renderDetect();
  renderAccuracy();
  renderCatalog();
  rerenderQuiz();
}

// 画面を描く前に、静的な日本語を控えて、初めの言語にする
window.I18n.collect(document.body);
setLanguage(window.I18n.initialLanguage(window.location.search, window.I18n.stored(), navigator.language), { rerender: false });

document.getElementById('btn-lang')?.addEventListener('click', () => {
  setLanguage(window.Messages.lang === 'ja' ? 'en' : 'ja', { store: true });
});

// 初期化処理
window.addEventListener('load', () => {
  renderThemeButton();
  renderMapping();
  setupShuffleViz();
  setupLab();
  renderCatalog();
  setupQuiz();
});

// OS の配色が変わったら、ボタンの状態を合わせる（自分で選んだ配色は変えない）
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', renderThemeButton);

// ============================================================
// クイズシステム（一問一答形式・20問）
// ============================================================
// 問題は js/quiz-data.js（スクリプトとして読むので file:// でも動く）。
// 表示の前に計算部の validateQuiz で形を確かめる。文字はすべて textContent で入れる。
// 「順番と選択肢を混ぜる」をオンにすると、出題順と選択肢の並びを一様な順列で混ぜる。

const quiz = {
  questions: null, // 検査済みの問題
  order: [],       // 出題順（問題の添字）
  choiceOrders: [],// 問題ごとの選択肢の並び（選択肢の添字）
  index: 0,        // いま何問目か（0始まり）
  score: 0,        // 正解数
  answered: false, // いまの問題に答えたか（二重回答を防ぐ）
  log: [],         // 答えの記録 { q: 問題の添字, chosen: 選んだ選択肢の添字 }
};

/** 出題順と選択肢の並びを決める（混ぜないときは元の順） */
function arrangeQuiz(){
  const mix = document.getElementById('quiz-shuffle')?.checked;
  const n = quiz.questions.length;
  quiz.order = mix ? Core.randomPermutation(n, fillRandom) : Core.identity(n);
  quiz.choiceOrders = quiz.questions.map(q => (mix ? Core.randomPermutation(q.choices.length, fillRandom) : Core.identity(q.choices.length)));
}

function currentQuestion(){
  return quiz.questions[quiz.order[quiz.index]];
}

/** 表示する言語の問題（id・正解の添字・選択肢の数は日英で同じ） */
function quizQuestions(){
  const data = window.QuizData || {};
  return data[window.Messages.lang] || data.ja;
}

/** 言語を切り替えたあと、いまの状態のまま描き直す（採点も順番も変えない） */
function rerenderQuiz(){
  if(!quiz.questions) return;
  quiz.questions = quizQuestions();
  const result = document.getElementById('quiz-result');
  if(result && !result.classList.contains('hidden')){
    showFinalResult();
    return;
  }
  const answered = quiz.answered;
  const last = quiz.log[quiz.log.length - 1];
  showQuestion();
  if(answered && last){
    quiz.answered = true;
    renderAnswer(last.chosen);
  }
}

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

  const questions = quizQuestions();
  const check = Core.validateQuiz(questions);
  if(!check.ok){
    // データの誤りは画面に出す（どの問題のどの項目か）
    const detail = check.errors.slice(0, 3).map(e => T(e.key, e.params)).join(' / ');
    loader.textContent = T('quiz.error.load', { detail });
    loader.classList.add('error');
    return;
  }

  quiz.questions = questions;
  arrangeQuiz();
  loader.classList.add('hidden');
  container.classList.remove('hidden');

  document.getElementById('btn-quiz-next')?.addEventListener('click', handleNext);
  document.getElementById('btn-quiz-restart')?.addEventListener('click', restartQuiz);
  document.getElementById('quiz-shuffle')?.addEventListener('change', restartQuiz);
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

  const q = currentQuestion();
  const total = quiz.questions.length;

  quiz.answered = false;
  feedbackEl.classList.add('hidden');
  feedbackEl.classList.remove('correct', 'incorrect');
  feedbackEl.replaceChildren();
  nextBtn.disabled = true;
  nextBtn.textContent = T(quiz.index === total - 1 ? 'quiz.finish' : 'quiz.next');

  progressEl.textContent = T('quiz.progress', { n: quiz.index + 1, total, score: quiz.score, cat: T(`quiz.cat.${q.category}`) });

  const title = el('h3', 'quiz-prompt', q.prompt);
  title.id = 'quiz-prompt';
  const choices = el('div', 'choices');
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-labelledby', 'quiz-prompt');
  quiz.choiceOrders[quiz.order[quiz.index]].forEach(i => {
    const btn = el('button', 'choice-btn');
    btn.type = 'button';
    btn.dataset.index = String(i); // 元の選択肢の添字（並びを混ぜても正誤はこの番号で決める）
    btn.appendChild(el('span', 'choice-mark'));
    btn.appendChild(el('span', 'choice-text', q.choices[i]));
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

  const q = currentQuestion();
  if(selected === q.answer) quiz.score++;
  quiz.log.push({ q: quiz.order[quiz.index], chosen: selected });
  renderAnswer(selected);
  document.getElementById('btn-quiz-next')?.focus({ preventScroll: true });
}

/** 答えた状態を描く（採点はしない。言語を切り替えたときにも使う） */
function renderAnswer(selected){
  const q = currentQuestion();
  const isCorrect = selected === q.answer;
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

  if(progressEl){
    progressEl.textContent = T('quiz.progress', { n: quiz.index + 1, total: quiz.questions.length, score: quiz.score,
      cat: T(`quiz.cat.${q.category}`) });
  }
  nextBtn.disabled = false;
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

  // 見直し: 間違えた問題を、選んだ答え・正解・解説と並べる
  const review = el('section', 'quiz-review');
  const reviewTitle = el('h4', null, T('quiz.review.title'));
  reviewTitle.id = 'quiz-review-title';
  review.setAttribute('aria-labelledby', reviewTitle.id);
  review.appendChild(reviewTitle);
  const wrong = quiz.log.filter(a => a.chosen !== quiz.questions[a.q].answer);
  if(wrong.length === 0){
    review.appendChild(el('p', null, T('quiz.review.none')));
  }else{
    const list = el('ol', 'review-list');
    for(const a of wrong){
      const q = quiz.questions[a.q];
      const li = el('li');
      li.appendChild(el('p', 'review-prompt', q.prompt));
      li.appendChild(el('p', 'review-chosen', T('quiz.review.yours', { answer: q.choices[a.chosen] })));
      li.appendChild(el('p', 'review-answer', T('quiz.review.correct', { answer: q.choices[q.answer] })));
      li.appendChild(el('p', 'review-explanation', q.explanation));
      list.appendChild(li);
    }
    review.appendChild(list);
  }

  result.replaceChildren(scoreDiv, msgDiv, restartBtn, review);
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
  quiz.log = [];
  arrangeQuiz();

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
 * 正解率に応じた文言のキー（40%以下／80%以下／それより上）
 */
function gradeKey(score, total){
  const rate = score / total;
  if(rate <= 0.4) return 'quiz.grade.low';
  if(rate <= 0.8) return 'quiz.grade.mid';
  return 'quiz.grade.high';
}
