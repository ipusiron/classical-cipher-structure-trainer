const test = require('node:test');
const assert = require('node:assert/strict');
const Cat = require('../js/catalog.js');

const { tools, KINDS, SUBS, url } = Cat;
const find = slug => tools.find(t => t.slug === slug);

test('一覧の形: Day 番号・リポジトリ名・title・分類', () => {
  assert.equal(tools.length, 42);
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
  assert.deepEqual(tr, ['columnar-cipherlab', 'grille-cipherlab', 'mirror-cipherlab', 'permutation-cipherlab', 'railfence-cipherlab',
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
    5: 'ROT13 Encoder', 8: 'Caesar Cipher Breaker', 9: 'Frequency Analyzer', 18: 'Cipher Climb', 28: 'RepeatSeq Analyzer',
    29: 'OTP Animation', 30: 'Modular Text Divider', 37: 'QuickROT47', 42: 'Classic JS Obfuscator', 44: 'Cipher Clairvoyance',
    45: 'Anagram Hunter', 46: 'AlphaLoom', 47: 'IC Learning Visualizer', 51: 'Involution Studio', 69: 'Trevanion CipherLab',
    76: 'Crypto Emoji Translator', 84: 'Mirror CipherLab', 86: 'Epigraph Chronogrammer', 94: 'ToySPN Builder',
    99: 'Book Code Builder',
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

test('区分の件数と、混合・コード・解く道具の分類', () => {
  const count = k => tools.filter(t => t.kind === k).length;
  assert.deepEqual(KINDS.map(count), [21, 6, 1, 4, 10]);
  assert.equal(find('toyspn-builder').kind, 'product');
  assert.equal(find('book-code-builder').sub, 'code');
  assert.equal(find('involution-studio').sub, 'study');
  assert.equal(find('otp-animation').sub, 'poly');
});

test('見分けるタブの案内先は一覧と同じ名前・Day 番号', () => {
  const L = require('../js/lab-core.js');
  for (const list of Object.values(L.HANDOFF)) {
    for (const e of list) {
      const t = find(e.slug);
      assert.ok(t, e.slug);
      assert.equal(t.title, e.title, e.slug);
      assert.equal(t.day, e.day, e.slug);
    }
  }
});
