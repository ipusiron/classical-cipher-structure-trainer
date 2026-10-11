const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/structure-core.js');
const Q = require('../js/quiz-data.js');

const qs = Q.ja;

test('クイズのデータは計算部の検査を通る（10問）', () => {
  assert.deepEqual(C.validateQuiz(qs), { ok: true, errors: [] });
  assert.equal(qs.length, 10);
});

test('区分は 定義2・基礎2・分類4・混合2（画面の案内と同じ）', () => {
  const count = c => qs.filter(q => q.category === c).length;
  assert.deepEqual([count('definition'), count('basic'), count('classification'), count('mixed')], [2, 2, 4, 2]);
});

test('分類の4問は選択肢が同じで、4つの答えがそれぞれ1回ずつ正解になる', () => {
  const cls = qs.filter(q => q.category === 'classification');
  for (const q of cls) assert.deepEqual(q.choices, cls[0].choices);
  assert.deepEqual(cls.map(q => q.answer).sort(), [0, 1, 2, 3]);
});

test('毎回同じ位置を選んでも半分以上は取れない（正解の位置が偏らない）', () => {
  for (let pos = 0; pos < 4; pos++) {
    const hits = qs.filter(q => q.answer === pos).length;
    assert.ok(hits <= 4, `位置${pos + 1}: ${hits}問`);
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
  const want = { q005: '単一換字', q006: '多表式', q007: '転置', q008: '混合' };
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
