const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const list = dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.js')).map(f => `${dir}/${f}`);

const codeFiles = ['script.js', 'style.css', ...list('js'), ...list('test')];
const textFiles = [...codeFiles, 'index.html', 'package.json', '.github/workflows/test.yml', 'data/favicon.svg',
  'README.md', 'TECHNICAL.md', 'SECURITY.md', 'CLAUDE.md'];

// 見えない文字（ゼロ幅・向きの制御・BOM など）。範囲は数で持つ
const INVISIBLE = [[0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2069], [0xfeff, 0xfeff], [0x00ad, 0x00ad]];
const isInvisible = cp => INVISIBLE.some(([a, b]) => cp >= a && cp <= b);

test('コードの最長行は160文字以下、index.html は250文字以下（1行に詰め込まない）', () => {
  for (const f of codeFiles) {
    const longest = Math.max(...read(f).split('\n').map(l => [...l].length));
    assert.ok(longest <= 160, `${f}: ${longest}`);
  }
  const html = Math.max(...read('index.html').split('\n').map(l => [...l].length));
  assert.ok(html <= 250, `index.html: ${html}`);
});

test('主要ファイルの行数の下限（圧縮していない）', () => {
  const min = { 'script.js': 450, 'style.css': 600, 'index.html': 120, 'js/structure-core.js': 200 };
  for (const [f, n] of Object.entries(min)) assert.ok(read(f).split('\n').length >= n, f);
});

test('改行は LF、見えない文字なし、タブなし、制御文字なし', () => {
  for (const f of textFiles) {
    const s = read(f);
    assert.ok(!s.includes('\r'), `${f}: CR`);
    for (const ch of s) {
      const cp = ch.codePointAt(0);
      assert.ok(!isInvisible(cp), `${f}: U+${cp.toString(16)}`);
      assert.ok(cp >= 0x20 || cp === 0x0a, `${f}: 制御文字 U+${cp.toString(16)}`);
    }
  }
});

test('package.json は依存を持たない', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.test, 'node --test');
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
});
