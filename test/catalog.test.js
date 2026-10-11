const test = require('node:test');
const assert = require('node:assert/strict');
const Cat = require('../js/catalog.js');

const { tools, KINDS, SUBS, url } = Cat;
const find = slug => tools.find(t => t.slug === slug);

test('一覧の形: Day 番号・リポジトリー名・title・分類', () => {
  assert.ok(tools.length >= 22);
  const slugs = new Set();
  const days = new Set();
  for (const t of tools) {
    assert.ok(Number.isInteger(t.day) && t.day >= 1 && t.day <= 100, `${t.slug}: day`);
    assert.match(t.slug, /^[A-Za-z0-9_-]+$/, t.slug);
    assert.ok(!slugs.has(t.slug), `重複 ${t.slug}`);
    assert.ok(!days.has(t.day), `Day の重複 ${t.day}`);
    slugs.add(t.slug);
    days.add(t.day);
    assert.ok(KINDS.includes(t.kind), `${t.slug}: kind`);
    assert.ok(SUBS[t.kind].includes(t.sub), `${t.slug}: sub`);
    for (const f of ['title', 'name', 'desc']) assert.ok(typeof t[f] === 'string' && t[f].trim() !== '', `${t.slug}: ${f}`);
    assert.equal(url(t.slug), `https://ipusiron.github.io/${t.slug}/`);
  }
});

test('分類の訂正: ジグザグは換字、ヒル・ポルタ・プレイフェアは多字換字、ストリップは多表式', () => {
  assert.equal(find('zigzag-cipherlab').kind, 'substitution');
  for (const s of ['hill-cipherlab', 'porta-cipherlab', 'playfair-cipherlab']) assert.equal(find(s).sub, 'polygraphic', s);
  assert.equal(find('strip-cipherlab').sub, 'poly');
  assert.equal(find('vigenere-cipher-tool').sub, 'poly');
  assert.ok(!/多表/.test(find('hill-cipherlab').desc));
  assert.ok(!/鍵依存の置換表/.test(find('porta-cipherlab').desc));
});

test('転置式は文字の位置を並べ替えるものだけ', () => {
  const tr = tools.filter(t => t.kind === 'transposition').map(t => t.slug).sort();
  assert.deepEqual(tr, ['columnar-cipherlab', 'grille-cipherlab', 'permutation-cipherlab', 'railfence-cipherlab',
    'scytale-cipher-visualizer']);
});

test('title は各ツールの README の YAML の title と同じ（Day 番号・表記を写した値）', () => {
  // 渚の作業側の照合（ref/day097/check_catalog_titles.py）で D:/try100 の README と突き合わせた値
  const want = {
    3: 'Caesar Cipher Wheel Tool', 4: 'Japanese Caesar Cipher', 10: 'Scytale Cipher Visualizer', 12: 'Uesugi Cipher Tool',
    14: 'Shinobi Iroha Cipher', 17: 'Vigenere Cipher Tool', 22: 'DancingMen CipherLab', 24: 'Grille CipherLab',
    27: 'Playfair CipherLab', 32: 'Pigpen CipherLab', 34: 'RailFence CipherLab', 36: 'Hidden Message Challenge',
    43: 'Columnar CipherLab', 49: 'Affine CipherLab', 55: 'Bacon CipherLab', 67: 'Polybius CipherLab',
    71: 'Strip CipherLab', 72: 'Zigzag CipherLab', 78: 'Beaufort CipherLab', 80: 'Porta CipherLab',
    93: 'Hill CipherLab', 95: 'Permutation CipherLab',
  };
  for (const [day, title] of Object.entries(want)) {
    const t = tools.find(x => x.day === Number(day));
    assert.ok(t, `Day${day}`);
    assert.equal(t.title, title, `Day${day}`);
  }
});

test('表記: 「もっとも」「全て」「分かる」を使わない', () => {
  const text = JSON.stringify(tools);
  for (const w of ['もっとも', '全て', '分かる']) assert.ok(!text.includes(w), w);
});
