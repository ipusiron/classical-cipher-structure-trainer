/* ============================================================================
 * Classical Cipher Structure Trainer - 計算部（DOMに依存しない）
 * ============================================================================
 *
 * 換字（マッピング）と転置（シャッフル）を、どちらも「順列」として扱う。
 *   換字の鍵 map  : 上段の i 番目の文字を、下段の map[i] 番目の文字へ対応させる。
 *                   文字の「種類」を並べ替える順列（Shannon 1949 p.665）
 *   転置の鍵 order: 並べ替えたあとの i 番目に、元の order[i] 番目の文字を置く。
 *                   文字の「位置」を並べ替える順列（取り出す向き。Day095 と同じ）
 *
 * 添字は 0 始まり。表示で 1 始まりにするのは画面側の仕事。
 * 文言は持たない。検査の結果は { key, params } で返し、表示の直前に messages.js で文にする。
 * 乱数は呼び出し側が渡す fill（Uint32Array を埋める関数。ブラウザーでは crypto.getRandomValues）。
 * ブラウザーでは window.StructureCore、Node では require() で読む。
 * ============================================================================ */
(function (root) {
  'use strict';

  const TOP_LETTERS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  const BOTTOM_SETS = Object.freeze({
    letters: TOP_LETTERS,
    numbers: Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8']),
  });
  const DEFAULT_OFFSET = 5; // A→F
  const SHUFFLE_WORD = 'EDUCATION';
  const QUIZ_CATEGORIES = Object.freeze(['definition', 'basic', 'classification', 'mixed']);

  const mod = (a, n) => ((a % n) + n) % n;

  // ------------------------------------------------------------
  // 順列の基本
  // ------------------------------------------------------------

  /** p が 0..n-1 をちょうど1回ずつ含む配列か */
  function isPermutation(p, n = Array.isArray(p) ? p.length : -1) {
    if (!Array.isArray(p) || p.length !== n) return false;
    const seen = new Array(n).fill(false);
    for (const v of p) {
      if (!Number.isInteger(v) || v < 0 || v >= n || seen[v]) return false;
      seen[v] = true;
    }
    return true;
  }

  function identity(n) {
    return Array.from({ length: n }, (_, i) => i);
  }

  /** 逆の順列。p[i] = j なら q[j] = i */
  function invert(p) {
    const q = new Array(p.length);
    p.forEach((v, i) => { q[v] = i; });
    return q;
  }

  /** シフトの対応表。上段の i 番目 → 下段の (i + offset) mod n 番目 */
  function shiftMap(n, offset) {
    return Array.from({ length: n }, (_, i) => mod(i + offset, n));
  }

  /** 対応表がシフトなら、そのずらし量（0..n-1）。シフトでなければ null */
  function shiftOf(map) {
    if (!isPermutation(map) || map.length === 0) return null;
    const offset = map[0];
    return map.every((v, i) => v === mod(i + offset, map.length)) ? offset : null;
  }

  // ------------------------------------------------------------
  // 乱数（偏りのない整数と、一様な順列）
  // ------------------------------------------------------------

  /** 0..bound-1 の一様な整数。2^32 を bound で割り切れない端は捨てて引き直す */
  function randomInt(bound, fill) {
    if (!Number.isInteger(bound) || bound < 1 || bound > 0x100000000) throw new RangeError('bound');
    const limit = Math.floor(0x100000000 / bound) * bound;
    const buf = new Uint32Array(1);
    for (;;) {
      fill(buf);
      if (buf[0] < limit) return buf[0] % bound;
    }
  }

  /** Fisher–Yates で一様な順列 */
  function randomPermutation(n, fill) {
    const p = identity(n);
    for (let i = n - 1; i > 0; i--) {
      const j = randomInt(i + 1, fill);
      [p[i], p[j]] = [p[j], p[i]];
    }
    return p;
  }

  // ------------------------------------------------------------
  // 換字と転置
  // ------------------------------------------------------------

  /** 文字の配列 from の i 番目を to[map[i]] に置き換える。from にない文字はそのまま */
  function substitute(text, from, to, map) {
    const index = new Map(from.map((ch, i) => [ch, i]));
    return Array.from(String(text), ch => (index.has(ch) ? to[map[index.get(ch)]] : ch)).join('');
  }

  /** 転置。並べ替えたあとの i 番目 = items[order[i]] */
  function applyOrder(items, order) {
    return order.map(i => items[i]);
  }

  /** いまの並びを逆順にする（2回で元に戻る） */
  function reverseOrder(order) {
    return [...order].reverse();
  }

  /** いまの並びの 1・2 番目、3・4 番目…を入れ替える（2回で元に戻る。奇数個なら最後は動かない） */
  function swapPairs(order) {
    const out = [...order];
    for (let i = 0; i + 1 < out.length; i += 2) [out[i], out[i + 1]] = [out[i + 1], out[i]];
    return out;
  }

  /** from 番目の要素を取り出し、取り出したあとの並びの to 番目に差し込む */
  function moveIndex(order, from, to) {
    const out = [...order];
    const [item] = out.splice(from, 1);
    out.splice(Math.max(0, Math.min(to, out.length)), 0, item);
    return out;
  }

  /** 対応表を [上段の文字, 下段の文字] の組の配列に */
  function mappingPairs(map, top, bottom) {
    return map.map((j, i) => [top[i], bottom[j]]);
  }

  // ------------------------------------------------------------
  // 鍵の数
  // ------------------------------------------------------------

  function factorial(n) {
    let f = 1n;
    for (let i = 2n; i <= BigInt(n); i++) f *= i;
    return f;
  }

  /** 3桁ごとにカンマを入れる（BigInt・整数） */
  function groupDigits(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ------------------------------------------------------------
  // 画面の幾何（計算だけ。描くのは script.js）
  // ------------------------------------------------------------

  /**
   * 対応図の配置。上段と下段を常に1行に置き、SVG の viewBox の座標で返す。
   * 画面の寸法を測らないので、非表示のタブでも幅が変わっても同じ図になる。
   */
  function figureLayout(n, { cell = 36, gap = 8, pad = 6, middle = 88 } = {}) {
    const width = n * cell + (n - 1) * gap + pad * 2;
    const topY = pad;
    const bottomY = pad + cell + middle;
    const xs = Array.from({ length: n }, (_, i) => pad + i * (cell + gap) + cell / 2);
    return { width, height: bottomY + cell + pad, cell, topY, bottomY, xs };
  }

  /** 上段のセルの下端から、下段のセルの上端へ向かう S 字の曲線 */
  function curvePath(x1, y1, x2, y2) {
    const mid = (y1 + y2) / 2;
    return `M ${x1},${y1} C ${x1},${mid} ${x2},${mid} ${x2},${y2}`;
  }

  /**
   * 並べ替えの差し込み位置。boxes は動かしている要素を除いた残りの要素の矩形（並び順）。
   * 行（折り返し）を先に決めてから、その行の中で x を比べる。戻り値は 0..boxes.length。
   */
  function insertionIndex(boxes, x, y) {
    if (boxes.length === 0) return 0;
    const rows = [];
    boxes.forEach((b, i) => {
      const last = rows[rows.length - 1];
      if (last && Math.abs(b.top - last.top) < Math.min(b.height, last.height) / 2) {
        last.items.push(i);
        last.bottom = Math.max(last.bottom, b.top + b.height);
      } else {
        rows.push({ top: b.top, height: b.height, bottom: b.top + b.height, items: [i] });
      }
    });
    let row = rows[0];
    let best = Infinity;
    for (const r of rows) {
      const d = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
      if (d < best) { best = d; row = r; }
    }
    for (const i of row.items) {
      const b = boxes[i];
      if (x < b.left + b.width / 2) return i;
    }
    return row.items[row.items.length - 1] + 1;
  }

  // ------------------------------------------------------------
  // クイズのデータ検査
  // ------------------------------------------------------------

  /** 問題の配列を検査する。errors は { key, params } の配列 */
  function validateQuiz(questions) {
    const errors = [];
    if (!Array.isArray(questions) || questions.length === 0) {
      return { ok: false, errors: [{ key: 'quiz.error.empty', params: {} }] };
    }
    const ids = new Set();
    questions.forEach((q, n) => {
      const bad = field => errors.push({ key: 'quiz.error.field', params: { n: n + 1, field } });
      if (!q || typeof q !== 'object') { bad('question'); return; }
      if (typeof q.id !== 'string' || !/^q\d{3}$/.test(q.id) || ids.has(q.id)) bad('id');
      ids.add(q.id);
      if (!QUIZ_CATEGORIES.includes(q.category)) bad('category');
      if (typeof q.prompt !== 'string' || q.prompt.trim() === '') bad('prompt');
      const choicesOk = Array.isArray(q.choices) && q.choices.length >= 2 && q.choices.length <= 6
        && q.choices.every(c => typeof c === 'string' && c.trim() !== '')
        && new Set(q.choices).size === q.choices.length;
      if (!choicesOk) bad('choices');
      if (!Number.isInteger(q.answer) || !choicesOk || q.answer < 0 || q.answer >= q.choices.length) bad('answer');
      if (typeof q.explanation !== 'string' || q.explanation.trim() === '') bad('explanation');
    });
    return { ok: errors.length === 0, errors };
  }

  const api = {
    TOP_LETTERS,
    BOTTOM_SETS,
    DEFAULT_OFFSET,
    SHUFFLE_WORD,
    QUIZ_CATEGORIES,
    isPermutation,
    identity,
    invert,
    shiftMap,
    shiftOf,
    randomInt,
    randomPermutation,
    substitute,
    applyOrder,
    reverseOrder,
    swapPairs,
    moveIndex,
    mappingPairs,
    factorial,
    groupDigits,
    figureLayout,
    curvePath,
    insertionIndex,
    validateQuiz,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StructureCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
