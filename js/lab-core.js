/* ============================================================================
 * Classical Cipher Structure Trainer - 実験室の計算部（DOMに依存しない）
 * ============================================================================
 *
 * 英文（A〜Z）に換字・転置・多表式を掛け、何が保たれて何が崩れるかを数える。
 *   換字の鍵 map  : 平文の文字 i（A=0）を暗号文の文字 map[i] にする（26文字の順列）
 *   転置の順 order: 暗号文の i 文字目 = 平文の order[i] 文字目（取り出す向き）
 * 縦列転置の読み方は Columnar CipherLab（Day043）と同じ（キーワードの文字の順に列を読み、
 * 同じ文字は左の列を先に、最後の行が欠けていても埋字を足さない）。
 * 見分けのしきい値は tools/eval-classify.js で学習用の英文から決めた値（THRESHOLDS）。
 * 文言は持たない。エラーは { key, params } で返す。
 * ブラウザーでは window.LabCore、Node では require() で読む（js/structure-core.js が先に要る）。
 * ============================================================================ */
(function (root) {
  'use strict';

  const Core = typeof module !== 'undefined' && module.exports ? require('./structure-core.js') : root.StructureCore;

  const ALPHABET = Object.freeze([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']);
  const MAX_INPUT = 5000;     // 入力の上限（文字数。Day009 に渡せる上限と同じ）
  const MIN_LETTERS = 30;     // 見分けに使う英字の最小数
  const MAX_KEY = 20;         // キーワードの上限（英字）
  const MAX_RAILS = 10;       // レールの上限
  // 見分けのしきい値（tools/eval-classify-result.json の thresholds と同じ値。テストで確かめる）
  const THRESHOLDS = Object.freeze({ chiMax: 115, icMin: 0.052 });

  const err = (key, params = {}) => ({ error: { key, params } });

  // ------------------------------------------------------------
  // 入力
  // ------------------------------------------------------------

  /** 全角を半角に寄せ（NFKC）、大文字にし、A〜Z だけを残す */
  function letters(text) {
    return String(text ?? '').normalize('NFKC').toUpperCase().replace(/[^A-Z]/g, '');
  }

  /** キーワード（英字1〜20文字）。英字以外は無視しない（誤りとして返す） */
  function parseKeyword(input, { min = 1 } = {}) {
    const s = String(input ?? '').normalize('NFKC').trim().toUpperCase();
    if (!s) return err('lab.error.keyEmpty');
    if (!/^[A-Z]+$/.test(s)) return err('lab.error.keyChars');
    if (s.length < min) return err('lab.error.keyShort', { min });
    if (s.length > MAX_KEY) return err('lab.error.keyLong', { max: MAX_KEY });
    return { value: s };
  }

  // ------------------------------------------------------------
  // 換字（単一換字）と多表式
  // ------------------------------------------------------------

  /** シフト（シーザー暗号） */
  function shiftKey(shift) {
    return Core.shiftMap(26, shift);
  }

  /** キーワード換字表: キーワードの文字（重複を除く）のあとに残りの文字を A から並べる */
  function keywordKey(keyword) {
    const seen = new Set();
    const order = [];
    for (const ch of [...keyword, ...ALPHABET]) {
      if (!seen.has(ch)) { seen.add(ch); order.push(ch); }
    }
    return order.map(ch => ALPHABET.indexOf(ch));
  }

  /** 一様に選んだ換字表（乱数は呼び出し側の fill） */
  function randomKey(fill) {
    return Core.randomPermutation(26, fill);
  }

  /** 換字表を掛ける（A〜Z 以外の文字は来ない前提。来ても変えない） */
  function substitute(text, map) {
    return Core.substitute(text, ALPHABET, ALPHABET, map);
  }

  /** 換字表を「平文 → 暗号文」の26文字の並びとして書く（例 ZEBRACDF…） */
  function cipherAlphabet(map) {
    return map.map(j => ALPHABET[j]).join('');
  }

  /** ヴィジュネル暗号（鍵の文字のずらし量を順に使う） */
  function vigenere(text, keyword) {
    const k = [...keyword].map(ch => ALPHABET.indexOf(ch));
    return [...text].map((ch, i) => ALPHABET[(ALPHABET.indexOf(ch) + k[i % k.length]) % 26]).join('');
  }

  // ------------------------------------------------------------
  // 転置（長さ n の順列を作り、applyOrder で並べる）
  // ------------------------------------------------------------

  function reverseOrder(n) {
    return Core.reverseOrder(Core.identity(n));
  }

  /** レールフェンス: ジグザグに書き、上のレールから順に読む */
  function railFenceOrder(n, rails) {
    if (rails < 2 || n <= 1) return Core.identity(n);
    const cycle = 2 * (rails - 1);
    const railOf = i => { const m = i % cycle; return m < rails ? m : cycle - m; };
    const out = [];
    for (let r = 0; r < rails; r++) for (let i = 0; i < n; i++) if (railOf(i) === r) out.push(i);
    return out;
  }

  /** キーワードの文字の順に列を読む順（同じ文字は左の列が先） */
  function columnOrder(keyword) {
    return [...keyword].map((ch, i) => ({ ch, i })).sort((a, b) => (a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.i - b.i)).map(e => e.i);
  }

  /** 縦列転置: 行に書き、columnOrder の順に列を上から読む（埋字なし） */
  function columnarOrder(n, keyword) {
    const k = keyword.length;
    const out = [];
    for (const c of columnOrder(keyword)) for (let i = c; i < n; i += k) out.push(i);
    return out;
  }

  function transpose(text, order) {
    return Core.applyOrder([...text], order).join('');
  }

  // ------------------------------------------------------------
  // 操作をまとめて掛ける
  // ------------------------------------------------------------

  /**
   * 1つの操作を掛ける。op は次のどれか
   *   { type: 'shift', shift } / { type: 'keyword', key } / { type: 'map', map }   … 単一換字
   *   { type: 'vigenere', key }                                                    … 多表式
   *   { type: 'reverse' } / { type: 'railfence', rails } / { type: 'columnar', key } … 転置
   */
  function apply(text, op) {
    switch (op.type) {
      case 'shift': return substitute(text, shiftKey(op.shift));
      case 'keyword': return substitute(text, keywordKey(op.key));
      case 'map': return substitute(text, op.map);
      case 'vigenere': return vigenere(text, op.key);
      case 'reverse': return transpose(text, reverseOrder(text.length));
      case 'railfence': return transpose(text, railFenceOrder(text.length, op.rails));
      case 'columnar': return transpose(text, columnarOrder(text.length, op.key));
      default: throw new Error(`unknown op ${op.type}`);
    }
  }

  /** 操作の種類（substitution｜polyalphabetic｜transposition） */
  function family(op) {
    if (op.type === 'vigenere') return 'polyalphabetic';
    if (['reverse', 'railfence', 'columnar'].includes(op.type)) return 'transposition';
    return 'substitution';
  }

  /** A → B と B → A の結果を比べる（Shannon 1949 p.672: 単一換字と転置は順番を入れ替えても同じ） */
  function commute(text, a, b) {
    const ab = apply(apply(text, a), b);
    const ba = apply(apply(text, b), a);
    return { ab, ba, same: ab === ba };
  }

  // ------------------------------------------------------------
  // 統計
  // ------------------------------------------------------------

  function counts(text) {
    const c = new Array(26).fill(0);
    for (const ch of text) c[ch.charCodeAt(0) - 65]++;
    return c;
  }

  /** 回数を多い順に並べた形 */
  function profile(text) {
    return counts(text).filter(x => x > 0).sort((a, b) => b - a);
  }

  /** 同じ文字が現れる位置の型（HELLO → 0,1,2,2,3） */
  function pattern(text) {
    const seen = new Map();
    return [...text].map(ch => {
      if (!seen.has(ch)) seen.set(ch, seen.size);
      return seen.get(ch);
    });
  }

  /** 一致指数（IC） */
  function ic(text) {
    const n = text.length;
    if (n < 2) return 0;
    return counts(text).reduce((a, x) => a + x * (x - 1), 0) / (n * (n - 1));
  }

  /** 英語の頻度とのカイ二乗（小さいほど普通の英語に近い） */
  function chiSquare(text, freq) {
    const n = text.length;
    if (n === 0) return 0;
    return counts(text).reduce((a, o, i) => a + (o - n * freq[i]) ** 2 / (n * freq[i]), 0);
  }

  /** 最も多い文字（同数はアルファベット順で先の文字）から k 個 */
  function topLetters(text, k = 6) {
    return counts(text).map((c, i) => ({ ch: ALPHABET[i], c })).filter(e => e.c > 0)
      .sort((a, b) => b.c - a.c || (a.ch < b.ch ? -1 : 1)).slice(0, k);
  }

  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  /** 平文と暗号文で、何が保たれたか */
  function invariants(plain, cipher) {
    return {
      counts: same(counts(plain), counts(cipher)),
      profile: same(profile(plain), profile(cipher)),
      pattern: same(pattern(plain), pattern(cipher)),
    };
  }

  // ------------------------------------------------------------
  // 見分ける（暗号文だけから）
  // ------------------------------------------------------------

  /**
   * 頻度が英語に近ければ転置、そうでなく頻度の偏りが大きければ単一換字、偏りが小さければ多表式など。
   * kind: 'short'（英字が MIN_LETTERS 未満）｜'transposition'｜'mono'｜'poly'
   */
  function classify(text, freq, th = THRESHOLDS) {
    const n = text.length;
    const result = { n, chi: chiSquare(text, freq), ic: ic(text) };
    if (n < MIN_LETTERS) return { ...result, kind: 'short' };
    if (result.chi < th.chiMax) return { ...result, kind: 'transposition' };
    return { ...result, kind: result.ic >= th.icMin ? 'mono' : 'poly' };
  }

  const api = {
    ALPHABET,
    MAX_INPUT,
    MIN_LETTERS,
    MAX_KEY,
    MAX_RAILS,
    THRESHOLDS,
    letters,
    parseKeyword,
    shiftKey,
    keywordKey,
    randomKey,
    substitute,
    cipherAlphabet,
    vigenere,
    reverseOrder,
    railFenceOrder,
    columnOrder,
    columnarOrder,
    transpose,
    apply,
    family,
    commute,
    counts,
    profile,
    pattern,
    ic,
    chiSquare,
    topLetters,
    invariants,
    classify,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LabCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
