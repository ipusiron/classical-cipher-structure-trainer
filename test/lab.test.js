const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const L = require('../js/lab-core.js');
const EF = require('../js/english-freq.js');
const result = require('../js/classify-accuracy.js');

const fill = buf => crypto.getRandomValues(buf);
const P = 'WEAREDISCOVEREDFLEEATONCE';

test('入力: 全角を半角に寄せ、大文字の A〜Z だけを残す', () => {
  assert.equal(L.letters('Hello, World! ２０２６ ｈｉ'), 'HELLOWORLDHI');
  assert.equal(L.letters(''), '');
  assert.equal(L.letters(null), '');
  assert.equal(L.letters('日本語だけ'), '');
});

test('キーワードの検査', () => {
  assert.deepEqual(L.parseKeyword(' zebra '), { value: 'ZEBRA' });
  assert.equal(L.parseKeyword('').error.key, 'lab.error.keyEmpty');
  assert.equal(L.parseKeyword('ZE BRA').error.key, 'lab.error.keyChars');
  assert.equal(L.parseKeyword('A', { min: 2 }).error.key, 'lab.error.keyShort');
  assert.equal(L.parseKeyword('A'.repeat(21)).error.key, 'lab.error.keyLong');
});

test('既知解答: シフト・キーワード換字・ヴィジュネル', () => {
  assert.equal(L.apply('HELLO', { type: 'shift', shift: 3 }), 'KHOOR');
  assert.equal(L.cipherAlphabet(L.keywordKey('ZEBRA')), 'ZEBRACDFGHIJKLMNOPQSTUVWXY');
  assert.equal(L.apply('HELLO', { type: 'keyword', key: 'ZEBRA' }), 'FAJJM');
  // Wikipedia の Vigenère cipher の例
  assert.equal(L.apply('ATTACKATDAWN', { type: 'vigenere', key: 'LEMON' }), 'LXFOPVEFRNHR');
});

test('既知解答: 転置（Day043・Day034 の実装と同じ結果。Wikipedia の例）', () => {
  // 縦列転置 ZEBRAS（最後の行が欠けたまま読む）
  assert.equal(L.apply(P, { type: 'columnar', key: 'ZEBRAS' }), 'EVLNACDTESEAROFODEECWIREE');
  // レールフェンス 3 段
  assert.equal(L.apply(P, { type: 'railfence', rails: 3 }), 'WECRLTEERDSOEEFEAOCAIVDEN');
  assert.equal(L.apply(P, { type: 'reverse' }), 'ECNOTAEELFDEREVOCSIDERAEW');
  // 同じ文字の列は左が先
  assert.deepEqual(L.columnOrder('TOMATO'), [3, 2, 1, 5, 0, 4]);
});

test('転置の順列はどの長さでも順列（1文字・2段・長さより多い列）', () => {
  for (let n = 0; n <= 40; n++) {
    for (const r of [2, 3, 5, 10]) assert.ok(L.railFenceOrder(n, r).length === n && new Set(L.railFenceOrder(n, r)).size === n);
    for (const k of ['AB', 'ZEBRAS', 'ABCDEFGHIJKLMNOPQRST']) {
      const o = L.columnarOrder(n, k);
      assert.equal(o.length, n);
      assert.equal(new Set(o).size, n);
    }
  }
});

test('保たれるもの: 単一換字は位置の型と多い順の形、転置は文字ごとの回数と多い順の形', () => {
  const sub = L.apply(P, { type: 'keyword', key: 'ZEBRA' });
  const tr = L.apply(P, { type: 'columnar', key: 'ZEBRAS' });
  const vig = L.apply(P, { type: 'vigenere', key: 'LEMON' });
  assert.deepEqual(L.invariants(P, sub), { counts: false, profile: true, pattern: true });
  assert.deepEqual(L.invariants(P, tr), { counts: true, profile: true, pattern: false });
  assert.deepEqual(L.invariants(P, vig), { counts: false, profile: false, pattern: false });
  assert.deepEqual(L.pattern('HELLO'), [0, 1, 2, 2, 3]);
  assert.deepEqual(L.pattern('KHOOR'), L.pattern('HELLO'));
});

test('単一換字と転置は順番を入れ替えても同じ、ヴィジュネルと転置は違う（Shannon 1949 p.672）', () => {
  for (let k = 0; k < 30; k++) {
    const map = L.randomKey(fill);
    for (const t of [{ type: 'columnar', key: 'KEY' }, { type: 'railfence', rails: 3 }, { type: 'reverse' }]) {
      assert.equal(L.commute(P, { type: 'map', map }, t).same, true);
    }
  }
  const c = L.commute(P, { type: 'vigenere', key: 'LEMON' }, { type: 'columnar', key: 'KEY' });
  assert.equal(c.same, false);
  assert.equal(c.ab, 'IREGSPNZHFMBDQSSRMOQIQQEQ');
  assert.equal(c.ba, 'PIEJRWEZKETSDTRZIMRPPHQHP');
});

test('操作の種類', () => {
  assert.equal(L.family({ type: 'shift' }), 'substitution');
  assert.equal(L.family({ type: 'keyword' }), 'substitution');
  assert.equal(L.family({ type: 'vigenere' }), 'polyalphabetic');
  for (const t of ['reverse', 'railfence', 'columnar']) assert.equal(L.family({ type: t }), 'transposition');
  assert.throws(() => L.apply('A', { type: 'nope' }));
});

test('統計: IC・カイ二乗・多い文字', () => {
  assert.equal(L.ic(''), 0);
  assert.equal(L.ic('AA'), 1);
  assert.equal(L.ic('AB'), 0);
  assert.equal(L.chiSquare('', EF.FREQ), 0);
  assert.deepEqual(L.topLetters('BANANA', 2), [{ ch: 'A', c: 3 }, { ch: 'N', c: 2 }]);
  // 転置しても IC とカイ二乗は変わらない
  const tr = L.apply(P, { type: 'railfence', rails: 3 });
  assert.equal(L.ic(tr), L.ic(P));
  assert.equal(L.chiSquare(tr, EF.FREQ), L.chiSquare(P, EF.FREQ));
});

test('英語の頻度表: Gutenberg #1342 の A〜Z、合計 563,924 文字', () => {
  assert.equal(EF.COUNTS.length, 26);
  assert.equal(EF.TOTAL, 563924);
  assert.ok(Math.abs(EF.FREQ.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  // 最も多いのは E、次が T
  const order = [...EF.COUNTS.keys()].sort((a, b) => EF.COUNTS[b] - EF.COUNTS[a]).map(i => L.ALPHABET[i]);
  assert.deepEqual(order.slice(0, 2), ['E', 'T']);
});

test('見分け: しきい値は評価結果と同じ、短い文は判定しない', () => {
  assert.deepEqual(L.THRESHOLDS, result.thresholds);
  assert.equal(L.classify('ABC', EF.FREQ).kind, 'short');
  const plain = L.letters('It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.');
  assert.ok(plain.length >= L.MIN_LETTERS);
  assert.equal(L.classify(L.apply(plain, { type: 'columnar', key: 'ZEBRAS' }), EF.FREQ).kind, 'transposition');
  assert.equal(L.classify(L.apply(plain, { type: 'keyword', key: 'ZEBRA' }), EF.FREQ).kind, 'mono');
  assert.equal(L.classify(L.apply(plain, { type: 'vigenere', key: 'LEMONADE' }), EF.FREQ).kind, 'poly');
});

test('評価結果の形（3種類×300件、学習と評価は別の本）', () => {
  assert.equal(result.perClass, 300);
  assert.deepEqual([result.train.ebook, result.test.ebook], [1342, 98]);
  assert.equal(result.train.letters, EF.TOTAL);
  assert.deepEqual(Object.keys(result.evaluation), ['50', '100', '200', '400']);
  for (const v of Object.values(result.evaluation)) {
    for (const k of ['transposition', 'mono', 'poly', 'mean']) assert.ok(v[k] >= 0 && v[k] <= 100, k);
  }
});
