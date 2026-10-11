const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/structure-core.js');
const Q = require('../js/quiz-data.js');

const qs = Q.ja;

test('クイズのデータは計算部の検査を通る（20問）', () => {
  assert.deepEqual(C.validateQuiz(qs), { ok: true, errors: [] });
  assert.equal(qs.length, 20);
});

test('区分は 定義3・基礎4・分類6・性質3・混合4（画面の案内と同じ）', () => {
  const count = c => qs.filter(q => q.category === c).length;
  assert.deepEqual(C.QUIZ_CATEGORIES.map(count), [3, 4, 6, 3, 4]);
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('20問・一問一答形式</strong>（定義3問・基礎4問・分類6問・性質3問・混合4問）'));
});

test('選択肢がそろった分類の問題では、4つの答えがどれも1回以上正解になる', () => {
  const kinds = qs.find(q => q.id === 'q005').choices;
  const same = qs.filter(q => q.category === 'classification' && q.choices.join() === kinds.join());
  assert.ok(same.length >= 4);
  assert.deepEqual([...new Set(same.map(q => q.answer))].sort(), [0, 1, 2, 3]);
});

test('毎回同じ位置を選んでも3割を超えない（正解の位置が偏らない）', () => {
  for (let pos = 0; pos < 4; pos++) {
    const hits = qs.filter(q => q.answer === pos).length;
    assert.ok(hits <= qs.length * 0.3, `位置${pos + 1}: ${hits}問`);
  }
});

test('誤答に「順列」を置かない（換字の鍵も文字の順列なので誤りと言えない）', () => {
  for (const q of qs) {
    q.choices.forEach((c, i) => {
      if (i !== q.answer) assert.ok(!/Permutation|順列/.test(c), `${q.id}: ${c}`);
    });
  }
});

test('解説は正解の内容と食い違わない（分類の問題）', () => {
  const want = { q005: '単一換字', q006: '多表式', q007: '転置', q008: '混合', q011: '単一換字', q012: '多字換字' };
  for (const [id, word] of Object.entries(want)) {
    const q = qs.find(x => x.id === id);
    assert.ok(q.choices[q.answer].includes(word), id);
    assert.ok(q.explanation.includes(word), id);
  }
});

test('表記: 「もっとも」「全て」「分かる」を使わない', () => {
  const text = JSON.stringify(qs);
  for (const w of ['もっとも', '全て', '分かる']) assert.ok(!text.includes(w), w);
});

test('問題の数値は計算部と同じ（8! と 8の8乗）', () => {
  const q = qs.find(x => x.id === 'q018');
  assert.equal(q.choices[q.answer], `${C.groupDigits(C.factorial(8))}通り`);
  assert.ok(q.choices.includes(`${C.groupDigits(8 ** 8)}通り`));
});
