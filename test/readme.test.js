const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/structure-core.js');
const Cat = require('../js/catalog.js');

const root = path.join(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const A26 = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

/** 見出し（## …）で区切った節の本文 */
function section(md, heading) {
  const start = md.indexOf(`\n## ${heading}`);
  assert.ok(start >= 0, heading);
  const next = md.indexOf('\n## ', start + 4);
  return md.slice(start, next < 0 ? undefined : next);
}

test('YAML メタデータの構造（キーの順・ブロック形式・識別の値）は変えない', () => {
  const yaml = readme.match(/^<!--\n---\n([\s\S]*?)\n---\n-->/)[1];
  const keys = [...yaml.matchAll(/^([a-z_]+):/gm)].map(m => m[1]);
  assert.deepEqual(keys, ['id', 'slug', 'title', 'subtitle_ja', 'subtitle_en', 'description_ja', 'description_en',
    'category_ja', 'category_en', 'difficulty', 'tags', 'repo_url', 'demo_url', 'hub']);
  for (const k of ['category_ja', 'category_en', 'tags']) assert.match(yaml, new RegExp(`^${k}:\\n  - `, 'm'), k);
  assert.match(yaml, /^id: day097$/m);
  assert.match(yaml, /^slug: classical-cipher-structure-trainer$/m);
  assert.match(yaml, /^repo_url: "https:\/\/github\.com\/ipusiron\/classical-cipher-structure-trainer"$/m);
  assert.match(yaml, /^demo_url: "https:\/\/ipusiron\.github\.io\/classical-cipher-structure-trainer\/"$/m);
  assert.match(yaml, /^hub: true$/m);
});

test('シリーズの定型（H1・Day 表記・プロジェクトのリンク）', () => {
  assert.match(readme, /^# Classical Cipher Structure Trainer - 古典暗号の構造理解の教育ツール$/m);
  assert.ok(readme.includes('**Day097 - 生成AIで作るセキュリティツール100**'));
  assert.ok(readme.includes('https://akademeia.info/?page_id=42163'));
  assert.ok(!readme.includes('page_id=44607'));
});

test('古典暗号の例の表は js/catalog.js と同じ（件数・名前・分類・リンク先）', () => {
  const rows = section(readme, '🧠 タブ構成').split('\n').filter(l => /^\| 換字|^\| 転置|^\| その他/.test(l));
  assert.equal(rows.length, Cat.tools.length);
  const label = { mono: '換字（単一換字）', poly: '換字（多表式）', polygraphic: '換字（多字換字）', transposition: '転置',
    concealment: 'その他（分置式）' };
  Cat.tools.forEach((t, i) => {
    const cells = rows[i].split(' | ').map(c => c.replace(/^\| |\s\|$/g, ''));
    assert.equal(cells[0], label[t.sub], t.slug);
    assert.equal(cells[1], t.name, t.slug);
    assert.equal(cells[2], t.desc, t.slug);
    assert.equal(cells[3], `[${t.title}](${Cat.url(t.slug)})（Day${String(t.day).padStart(3, '0')}）`, t.slug);
  });
  assert.ok(readme.includes(`ツール${Cat.tools.length}本`));
});

test('鍵の数・並べ替えの例は計算部の値と同じ', () => {
  const g = n => C.groupDigits(C.factorial(n));
  for (const s of [`8! = ${g(8)}通り`, `9! = ${g(9)}通り`, `26! = ${g(26)}通り`]) assert.ok(readme.includes(s), s);
  assert.ok(readme.includes(`約${Number(C.factorial(26)).toExponential(2).replace(/e\+(\d+)/, '×10^$1')}`));
  const w = [...C.SHUFFLE_WORD];
  const once = C.applyOrder(w, C.swapPairs(C.identity(9))).join('');
  const twice = C.applyOrder(w, C.swapPairs(C.swapPairs(C.identity(9)))).join('');
  assert.ok(readme.includes(`EDUCATION → ${once} → ${twice}`));
  assert.equal(twice, 'EDUCATION');
  assert.ok(readme.includes(`シフトは${C.TOP_LETTERS.length}通り`));
});

test('「実例で確認」の表は計算部で再現できる', () => {
  const rows = [...readme.matchAll(/^\| `([^`]+)` \| `([^`]+)` \| (換字|転置) \|/gm)].map(m => m.slice(1, 4));
  assert.equal(rows.length, 4);
  const pattern = s => { const m = new Map(); return [...s].map(ch => (m.has(ch) ? m.get(ch) : (m.set(ch, m.size), m.size - 1))).join(); };
  for (const [plain, cipher, kind] of rows) {
    if (kind === '転置') {
      assert.equal(cipher, C.applyOrder([...plain], C.reverseOrder(C.identity(plain.length))).join(''), plain);
      assert.deepEqual([...cipher].sort(), [...plain].sort());
    } else {
      // 換字: 一対一（同じ文字の型が保たれる）。英字なら3文字ずらし
      assert.equal(pattern(cipher), pattern(plain), cipher);
      if (/^[A-Z]+$/.test(cipher)) assert.equal(C.substitute(plain, A26, A26, C.shiftMap(26, 3)), cipher);
    }
  }
});

test('ディレクトリー構造: すべてのファイルが載り、全行に説明がある', () => {
  const tree = section(readme, '📁 ディレクトリー構造').match(/```\n([\s\S]*?)\n```/)[1].split('\n');
  const listed = new Set(tree.slice(1).map(l => l.replace(/^[│├└─\s]+/, '').split(/\s+#/)[0].trim()));
  for (const line of tree.slice(1)) assert.match(line, /\S\s+# \S/, `説明なし: ${line}`);
  const cols = new Set(tree.slice(1).map(l => [...l].indexOf('#')));
  assert.equal(cols.size, 1, '# の桁をそろえる');
  const skip = new Set(['.git', 'node_modules', '.claude']);
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    if (skip.has(e.name)) return [];
    const rel = dir ? `${dir}/${e.name}` : e.name;
    return e.isDirectory() ? [`${e.name}/`, ...walk(rel)] : [e.name];
  });
  const files = walk('');
  assert.ok(files.length >= 30);
  for (const f of files) assert.ok(listed.has(f), `ツリーにない: ${f}`);
});

test('画像: README が参照する画像は実在し、assets の PNG はすべて README から参照される', () => {
  const refs = [...readme.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map(m => m[1]);
  assert.ok(refs.length >= 4);
  for (const r of refs) assert.ok(fs.existsSync(path.join(root, r)), r);
  const pngs = fs.readdirSync(path.join(root, 'assets')).filter(f => f.endsWith('.png')).map(f => `assets/${f}`);
  for (const p of pngs) assert.ok(refs.includes(p), `参照されていない ${p}`);
});

test('リンク: 相対リンクの先が実在し、誤記がない', () => {
  for (const [, href] of readme.matchAll(/\]\(((?!https?:|#)[^)\s]+)\)/g)) {
    assert.ok(fs.existsSync(path.join(root, href)), href);
  }
  assert.ok(!readme.includes('hhttps'));
  assert.ok(!readme.includes('github.com/ipusiron/strip-cipherlab)'), 'ストリップ暗号は Pages へ');
});

test('表記と言い過ぎ: 禁止語がない', () => {
  const body = readme.replace(/```[\s\S]*?```/g, '');
  const banned = ['もっとも', '全て', '分かる', '既に', '無い', 'リポジトリー', 'ほとんどを理解できます', '照合', '突き合わせ',
    '転置式確定', 'アンケートでも高評価'];
  for (const w of banned) assert.ok(!body.includes(w), w);
  for (const re of [/サーバ(?!ー)/, /ユーザ(?!ー)/, /ブラウザ(?!ー)/, /フォルダ(?!ー)/]) assert.ok(!re.test(body), String(re));
});

test('太字は H2 の節ごとに2つまで', () => {
  const parts = readme.split(/\n(?=## )/);
  for (const p of parts) {
    const n = (p.replace(/```[\s\S]*?```/g, '').match(/\*\*[^*\n]+\*\*/g) || []).length;
    assert.ok(n <= 2, `${p.split('\n')[0]}: ${n}`);
  }
});
