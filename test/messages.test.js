const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../js/messages.js');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

// script.js が T('…')・announceShuffle('…') で引くキー（`map.charset.${…}` のように組み立てるものは別に足す）
const used = new Set([...script.matchAll(/\b(?:T|announceShuffle)\('([\w.]+)'/g)].map(m => m[1]));
used.add('map.charset.letters');
used.add('map.charset.numbers');

test('script.js が使う文言のキーはすべて辞書にある', () => {
  assert.ok(used.size >= 12, `キーの数 ${used.size}`);
  for (const key of used) assert.ok(key in M.dict.ja, key);
});

test('置き場所を埋める', () => {
  assert.equal(M.t('map.pair', { from: 'A', to: 'F' }), 'A→F');
  assert.equal(M.t('shuffle.moved', { ch: 'D', pos: 3 }), 'D: 3番目');
  assert.equal(M.t('shuffle.moved', { ch: 'D' }), 'D: {pos}番目', '足りない置き場所は残す');
  assert.equal(M.t('no.such.key'), 'no.such.key');
});
