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
  const label = { mono: '換字（単一換字）', poly: '換字（多表式）', polygraphic: '換字（多字換字）', transposition: '転置',
    product: '混合', concealment: 'その他（分置式）', code: 'その他（コード）', analysis: '解く（解析・解読）', study: '学ぶ' };
  const labels = new Set(Object.values(label));
  const rows = section(readme, '🧠 タブ構成').split('\n')
    .filter(l => l.startsWith('| ') && labels.has(l.slice(2).split(' | ')[0]) && l.split(' | ').length === 4);
  assert.equal(rows.length, Cat.tools.length);
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

const L = require('../js/lab-core.js');
const EF = require('../js/english-freq.js');
const ACC = require('../js/classify-accuracy.js');

/** 表の行を「| a | b | … |」から配列に */
const cells = line => line.replace(/^\|\s*|\s*\|$/g, '').split(' | ');

test('実験室の表は計算部の値と同じ（例文に3つの暗号を掛けた結果）', () => {
  const lab = L.letters(L.SAMPLES.LAB);
  const part = section(readme, '🧠 タブ構成');
  assert.ok(part.includes(`英字${lab.length}文字。平文のICは${L.ic(lab).toFixed(4)}`));
  const ops = {
    '単一換字（キーワードZEBRA）': { type: 'keyword', key: 'ZEBRA' },
    '多表式（ヴィジュネルLEMON）': { type: 'vigenere', key: 'LEMON' },
    '転置（縦列転置ZEBRAS）': { type: 'columnar', key: 'ZEBRAS' },
  };
  const rows = part.split('\n').filter(l => /^\| (単一換字|多表式|転置)（/.test(l) && cells(l).length === 5);
  assert.equal(rows.length, 3);
  const word = b => (b ? '保たれる' : '変わる');
  for (const r of rows) {
    const [name, counts, profile, pattern, ic] = cells(r);
    const c = L.apply(lab, ops[name]);
    const inv = L.invariants(lab, c);
    assert.deepEqual([counts, profile, pattern, ic], [word(inv.counts), word(inv.profile), word(inv.pattern), L.ic(c).toFixed(4)], name);
  }
});

test('見分けるの例と正答率の表は計算部・評価結果と同じ', () => {
  const part = section(readme, '🧠 タブ構成');
  const detect = L.letters(L.SAMPLES.DETECT);
  assert.ok(part.includes(`英字${detect.length}文字`));
  const th = L.THRESHOLDS;
  assert.ok(part.includes(`カイ二乗が${th.chiMax}未満`) && part.includes(`一致指数（IC）が${th.icMin}以上`));
  const ops = {
    '転置（縦列転置ZEBRAS）': { type: 'columnar', key: 'ZEBRAS' },
    '単一換字（キーワードZEBRA）': { type: 'keyword', key: 'ZEBRA' },
    '多表式（ヴィジュネルLEMON）': { type: 'vigenere', key: 'LEMON' },
  };
  const kind = { transposition: '転置', mono: '単一換字', poly: '多表式など' };
  const rows = part.split('\n').filter(l => /^\| (単一換字|多表式|転置)（/.test(l) && cells(l).length === 4);
  assert.equal(rows.length, 3);
  for (const r of rows) {
    const [name, chi, ic, verdict] = cells(r);
    const res = L.classify(L.apply(detect, ops[name]), EF.FREQ);
    assert.deepEqual([chi, ic, verdict], [res.chi.toFixed(1), res.ic.toFixed(4), kind[res.kind]], name);
  }
  const acc = part.split('\n').filter(l => /^\| \d+文字 \|/.test(l));
  assert.deepEqual(acc, Object.entries(ACC.evaluation).map(([n, v]) => `| ${n}文字 | ${v.transposition}% | ${v.mono}% | ${v.poly}% |`));
  assert.ok(part.includes(`#${ACC.train.ebook}『${ACC.train.title}』`) && part.includes(`#${ACC.test.ebook}『${ACC.test.title}』`));
  assert.ok(part.includes(`3種類×${ACC.perClass}件`));
});

test('ユースケースの数値（仮名化の例・順番の入れ替え）は計算部の値と同じ', () => {
  const part = section(readme, '🎯 ユースケース');
  assert.ok(part.includes(`HELLOをキーワードZEBRAで置き換えると${L.apply('HELLO', { type: 'keyword', key: 'ZEBRA' })}になり`));
  const lab = L.letters(L.SAMPLES.LAB);
  assert.equal(L.commute(lab, { type: 'keyword', key: 'ZEBRA' }, { type: 'columnar', key: 'KEY' }).same, true);
  const mix = L.commute(lab, { type: 'vigenere', key: 'LEMON' }, { type: 'columnar', key: 'KEY' });
  let i = 0;
  while (mix.ab[i] === mix.ba[i]) i++;
  assert.ok(part.includes(`実験室の例文では${i + 1}文字目から食い違う`));
});

test('クイズの節の数（20問・区分）', () => {
  const part = section(readme, '🧠 タブ構成');
  const Q = require('../js/quiz-data.js').ja;
  assert.ok(part.includes(`問題数：${Q.length}問（定義3・基礎4・分類6・性質3・混合4）`));
});

// ------------------------------------------------------------
// 英語版 README.en.md
// ------------------------------------------------------------
const readmeEn = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');
const I18nMod = require('../js/i18n.js');

test('英語版: 1行目と相互のリンク、見出しの階層と数が日本語版と同じ', () => {
  assert.equal(readmeEn.split('\n')[0], 'English · [日本語](README.md)');
  assert.ok(readme.includes('\n[English](README.en.md) · 日本語\n'));
  const levels = md => md.replace(/```[\s\S]*?```/g, '').split('\n').filter(l => /^#{1,4} /.test(l)).map(l => l.match(/^#+/)[0].length);
  assert.deepEqual(levels(readmeEn), levels(readme));
  assert.ok(!readmeEn.includes('<!--'), 'YAML は README.md だけに置く');
  assert.ok(readmeEn.includes('**Day097 - 100 Security Tools with Generative AI**'));
  assert.ok(readmeEn.includes('https://akademeia.info/?page_id=42163'));
});

test('英語版: 1行目のほかに日本語がない', () => {
  const lines = readmeEn.split('\n').slice(1);
  const ja = lines.filter(l => I18nMod.hasJapanese(l));
  assert.deepEqual(ja, []);
});

test('英語版: 古典暗号の例の表・正答率の表・ユースケースの数値が計算部と同じ', () => {
  const rows = readmeEn.split('\n').filter(l => /^\| .* \| \[.+\]\(https:\/\/ipusiron\.github\.io\//.test(l));
  assert.equal(rows.length, Cat.tools.length);
  Cat.tools.forEach((t, i) => {
    const en = Cat.textOf(t, 'en');
    assert.ok(rows[i].includes(`| ${en.name} | ${en.desc} | [${t.title}](${Cat.url(t.slug)}) (Day${String(t.day).padStart(3, '0')}) |`), t.slug);
  });
  const acc = readmeEn.split('\n').filter(l => /^\| \d+ letters \|/.test(l));
  assert.deepEqual(acc, Object.entries(ACC.evaluation).map(([n, v]) => `| ${n} letters | ${v.transposition}% | ${v.mono}% | ${v.poly}% |`));
  assert.ok(readmeEn.includes(`HELLO with the keyword ZEBRA becomes ${L.apply('HELLO', { type: 'keyword', key: 'ZEBRA' })}`));
  const lab = L.letters(L.SAMPLES.LAB);
  const mix = L.commute(lab, { type: 'vigenere', key: 'LEMON' }, { type: 'columnar', key: 'KEY' });
  let i = 0;
  while (mix.ab[i] === mix.ba[i]) i++;
  assert.ok(readmeEn.includes(`differs from letter ${i + 1}.`));
  const g = n => C.groupDigits(C.factorial(n));
  for (const s of [`8! = ${g(8)}`, `9! = ${g(9)}`, `26! = ${g(26)}`]) assert.ok(readmeEn.includes(s), s);
  assert.ok(readmeEn.includes(`below ${L.THRESHOLDS.chiMax}`) && readmeEn.includes(`of ${L.THRESHOLDS.icMin} or more`));
});

test('英語版: 画像は assets/en/ にあり、assets/en/ の PNG はすべて参照される', () => {
  const refs = [...readmeEn.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map(m => m[1]);
  assert.equal(refs.length, 6);
  for (const r of refs) {
    assert.match(r, /^assets\/en\//);
    assert.ok(fs.existsSync(path.join(root, r)), r);
  }
  const pngs = fs.readdirSync(path.join(root, 'assets', 'en')).filter(f => f.endsWith('.png')).map(f => `assets/en/${f}`);
  assert.deepEqual(pngs.sort(), [...refs].sort());
});

test('英語版: ディレクトリー構造に全ファイルが載り、全行に説明がある', () => {
  const tree = readmeEn.slice(readmeEn.indexOf('## 📁')).match(/```\n([\s\S]*?)\n```/)[1].split('\n');
  for (const line of tree.slice(1)) assert.match(line, /\S\s+# \S/, line);
  const listed = new Set(tree.slice(1).map(l => l.replace(/^[│├└─\s]+/, '').split(/\s+#/)[0].trim()));
  const ja = section(readme, '📁 ディレクトリー構造').match(/```\n([\s\S]*?)\n```/)[1].split('\n');
  const listedJa = new Set(ja.slice(1).map(l => l.replace(/^[│├└─\s]+/, '').split(/\s+#/)[0].trim()));
  assert.deepEqual([...listed].sort(), [...listedJa].sort());
});
