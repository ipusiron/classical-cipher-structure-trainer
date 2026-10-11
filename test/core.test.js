const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const C = require('../js/structure-core.js');

const fill = buf => crypto.getRandomValues(buf);
const TOP = C.TOP_LETTERS;
const LETTERS = C.BOTTOM_SETS.letters;
const NUMBERS = C.BOTTOM_SETS.numbers;
const WORD = [...C.SHUFFLE_WORD];
const ID9 = C.identity(9);
const word = order => C.applyOrder(WORD, order).join('');

test('既定のシフト5は A→F … H→E（画面の初期状態）', () => {
  const map = C.shiftMap(8, C.DEFAULT_OFFSET);
  assert.deepEqual(map, [5, 6, 7, 0, 1, 2, 3, 4]);
  assert.equal(C.mappingPairs(map, TOP, LETTERS).map(p => p.join('')).join(' '), 'AF BG CH DA EB FC GD HE');
  assert.equal(C.shiftOf(map), 5);
});

test('換字の既知解答: HEAD はシフト5で EBFA、数字の下段で 5261', () => {
  const map = C.shiftMap(8, 5);
  assert.equal(C.substitute('HEAD', TOP, LETTERS, map), 'EBFA');
  assert.equal(C.substitute('HEAD', TOP, NUMBERS, map), '5261');
  assert.equal(C.substitute('BAGGAGE', TOP, LETTERS, C.shiftMap(8, 3)), 'EDBBDBH');
});

test('換字は逆の対応表で元に戻り、上段にない文字は変えない', () => {
  for (let k = 0; k < 50; k++) {
    const map = C.randomPermutation(8, fill);
    const enc = C.substitute('HEAD-BADGE 2026', TOP, LETTERS, map);
    assert.equal(C.substitute(enc, LETTERS, TOP, C.invert(map)), 'HEAD-BADGE 2026');
  }
  assert.equal(C.substitute('', TOP, LETTERS, C.shiftMap(8, 1)), '');
  assert.equal(C.substitute('xyz日本', TOP, LETTERS, C.shiftMap(8, 1)), 'xyz日本');
});

test('シフトは8回で一巡し、シフトでない対応表は null', () => {
  const seen = new Set();
  for (let k = 0; k < 8; k++) seen.add(C.shiftMap(8, k).join());
  assert.equal(seen.size, 8);
  assert.deepEqual(C.shiftMap(8, 8), C.shiftMap(8, 0));
  assert.deepEqual(C.shiftMap(8, -1), C.shiftMap(8, 7));
  assert.equal(C.shiftOf([1, 0, 2, 3, 4, 5, 6, 7]), null);
  assert.equal(C.shiftOf([0, 0, 1, 2, 3, 4, 5, 6]), null);
});

test('転置の既知解答: EDUCATION の逆順・偶奇入れ替え・移動', () => {
  assert.equal(word(C.reverseOrder(ID9)), 'NOITACUDE');
  assert.equal(word(C.swapPairs(ID9)), 'DECUTAOIN');
  assert.equal(word(C.moveIndex(ID9, 0, 8)), 'DUCATIONE');
  assert.equal(word(C.moveIndex(ID9, 2, 1)), 'EUDCATION');
});

test('逆順と偶奇入れ替えは2回で元に戻る（いまの並びに掛けても）', () => {
  for (let k = 0; k < 50; k++) {
    const order = C.randomPermutation(9, fill);
    assert.deepEqual(C.reverseOrder(C.reverseOrder(order)), order);
    assert.deepEqual(C.swapPairs(C.swapPairs(order)), order);
  }
  assert.deepEqual(C.swapPairs([0, 1, 2]), [1, 0, 2]);
  assert.deepEqual(C.swapPairs([]), []);
});

test('転置は逆の順列で元に戻り、文字ごとの数は変わらない', () => {
  for (let k = 0; k < 50; k++) {
    const order = C.randomPermutation(9, fill);
    const enc = C.applyOrder(WORD, order);
    assert.deepEqual(C.applyOrder(enc, C.invert(order)), WORD);
    assert.deepEqual([...enc].sort(), [...WORD].sort());
  }
});

test('順列の判定', () => {
  assert.ok(C.isPermutation([2, 0, 1]));
  assert.ok(C.isPermutation([], 0));
  assert.ok(!C.isPermutation([0, 0, 1]));
  assert.ok(!C.isPermutation([0, 1, 3]));
  assert.ok(!C.isPermutation([0, 1.5, 2]));
  assert.ok(!C.isPermutation('012'));
  assert.ok(!C.isPermutation([0, 1], 3));
  assert.deepEqual(C.invert([2, 0, 1]), [1, 2, 0]);
});

test('乱数: 2^32 を割り切れない端は引き直す', () => {
  const seq = [0xffffffff, 7];
  const fake = buf => { buf[0] = seq.shift(); };
  assert.equal(C.randomInt(3, fake), 1);
  assert.equal(seq.length, 0);
  assert.throws(() => C.randomInt(0, fill), RangeError);
});

test('乱数: 3文字の順列6通りがほぼ同じ回数で出る（カイ二乗）', () => {
  const N = 60000;
  const counts = new Map();
  for (let k = 0; k < N; k++) {
    const p = C.randomPermutation(3, fill).join('');
    counts.set(p, (counts.get(p) || 0) + 1);
  }
  assert.equal(counts.size, 6);
  const e = N / 6;
  const chi = [...counts.values()].reduce((a, o) => a + (o - e) ** 2 / e, 0);
  // 自由度5で p=0.001 の値は 20.52
  assert.ok(chi < 20.52, `chi=${chi}`);
});

test('鍵の数: 8! = 40,320、9! = 362,880、26! は 27 桁', () => {
  assert.equal(C.factorial(8), 40320n);
  assert.equal(C.factorial(9), 362880n);
  assert.equal(C.groupDigits(C.factorial(26)), '403,291,461,126,605,635,584,000,000');
  assert.equal(C.groupDigits(C.factorial(0)), '1');
  assert.equal(C.groupDigits(1234567), '1,234,567');
});

test('対応図の配置は1行8文字で、セルどうしが重ならない', () => {
  const g = C.figureLayout(8);
  assert.equal(g.width, 356);
  assert.equal(g.height, 172);
  assert.deepEqual(g.xs, [24, 68, 112, 156, 200, 244, 288, 332]);
  for (let i = 1; i < 8; i++) assert.ok(g.xs[i] - g.xs[i - 1] >= g.cell);
  assert.ok(g.xs[0] - g.cell / 2 >= 0 && g.xs[7] + g.cell / 2 <= g.width);
  assert.equal(C.curvePath(0, 10, 20, 50), 'M 0,10 C 0,30 20,30 20,50');
});

test('差し込み位置: 2段に折り返しても、行を決めてから列を比べる', () => {
  // 幅390pxの実測と同じ形。E を持ち上げた残り（1段目 D U C A、2段目 T I O N）
  const box = (left, top) => ({ left, top, width: 40, height: 40 });
  const boxes = [box(130, 0), box(180, 0), box(230, 0), box(280, 0), box(100, 50), box(150, 50), box(200, 50), box(250, 50)];
  assert.equal(C.insertionIndex(boxes, 300, 70), 8, '2段目の末尾（N の右）');
  assert.equal(C.insertionIndex(boxes, 104, 70), 4, 'T の左');
  assert.equal(C.insertionIndex(boxes, 175, 200), 6, '下にはみ出しても最寄りの2段目');
  assert.equal(C.insertionIndex(boxes, 10, 20), 0, '1段目の先頭');
  assert.equal(C.insertionIndex(boxes, 215, 0), 2, 'C の左');
  assert.equal(C.insertionIndex(boxes, 400, -30), 4, '1段目の末尾');
  assert.equal(C.insertionIndex([], 0, 0), 0);
  const removed = C.moveIndex(ID9, 0, 8);
  assert.equal(word(removed), 'DUCATIONE');
});

const GOOD = [
  { id: 'q001', category: 'definition', prompt: 'p', choices: ['a', 'b'], answer: 1, explanation: 'e' },
  { id: 'q002', category: 'mixed', prompt: 'p', choices: ['a', 'b', 'c'], answer: 0, explanation: 'e' },
];

test('クイズのデータ検査: 正しいデータは通る', () => {
  assert.deepEqual(C.validateQuiz(GOOD), { ok: true, errors: [] });
});

test('クイズのデータ検査: 欠けた解説・範囲外の答え・重複を拒む', () => {
  // n = 何問目で見つかるか（id の重複はあとに出た問題で見つかる）
  const bad = (patch, field, n = 1) => {
    const q = [{ ...GOOD[0], ...patch }, GOOD[1]];
    const r = C.validateQuiz(q);
    assert.equal(r.ok, false, field);
    assert.ok(r.errors.some(e => e.key === 'quiz.error.field' && e.params.field === field && e.params.n === n), field);
  };
  bad({ explanation: '' }, 'explanation');
  bad({ explanation: undefined }, 'explanation');
  bad({ answer: 2 }, 'answer');
  bad({ answer: 0.5 }, 'answer');
  bad({ answer: '1' }, 'answer');
  bad({ choices: ['a', 'a'] }, 'choices');
  bad({ choices: ['a'] }, 'choices');
  bad({ category: 'other' }, 'category');
  bad({ prompt: ' ' }, 'prompt');
  bad({ id: 'q002' }, 'id', 2);
  bad({ id: 'Q1' }, 'id');
  assert.equal(C.validateQuiz([]).ok, false);
  assert.equal(C.validateQuiz(null).errors[0].key, 'quiz.error.empty');
  assert.equal(C.validateQuiz([null]).errors[0].params.field, 'question');
});
