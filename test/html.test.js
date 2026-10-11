const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

test('CSP は meta で self に限り、frame-ancestors と unsafe-inline を書かない', () => {
  const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(m, 'CSP meta');
  const csp = m[1];
  for (const part of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self'", "connect-src 'none'",
    "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    assert.ok(csp.includes(part), part);
  }
  assert.ok(!csp.includes('frame-ancestors'), 'meta では無視される');
  assert.ok(!csp.includes('unsafe-inline'));
  assert.ok(!csp.includes('unsafe-eval'));
  assert.ok(!/https?:/.test(csp), '外部のオリジンを許可しない');
  assert.ok(!/X-Frame-Options|X-Content-Type-Options/i.test(html), 'meta では効かないヘッダー');
});

test('referrer は no-referrer、言語・viewport・noscript・favicon', () => {
  assert.match(html, /<meta name="referrer" content="no-referrer" \/>/);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1" \/>/);
  assert.match(html, /<noscript>/);
  const icon = html.match(/<link rel="icon" href="([^"]+)"/)[1];
  assert.ok(fs.existsSync(path.join(root, icon)), `favicon ${icon}`);
});

test('インラインのスクリプト・イベント属性・style 属性がない', () => {
  assert.ok(!/\son[a-z]+\s*=/i.test(html), 'on* 属性');
  assert.ok(!/\sstyle\s*=/i.test(html), 'style 属性');
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const [, attrs, body] of scripts) {
    assert.match(attrs, /src="/, 'src のない script');
    assert.equal(body.trim(), '');
    assert.ok(!/type="module"/.test(attrs), 'file:// で動かすため module にしない');
  }
  assert.deepEqual(scripts.map(m => m[1].match(/src="([^"]+)"/)[1]),
    ['js/theme.js', 'js/structure-core.js', 'js/messages.js', 'js/quiz-data.js', 'script.js']);
  for (const src of scripts.map(m => m[1].match(/src="([^"]+)"/)[1])) assert.ok(fs.existsSync(path.join(root, src)), src);
});

test('存在しないタグ・fetch を使わない', () => {
  assert.ok(!/<string>/.test(html), '<string> は <strong> の誤記');
  assert.ok(!/\bfetch\(/.test(script), 'file:// で動かないので fetch しない');
  assert.ok(!/innerHTML\s*=/.test(script), 'innerHTML に代入しない');
  assert.ok(!/Math\.random/.test(script), '乱数は crypto.getRandomValues');
});

test('target="_blank" のリンクは rel="noopener noreferrer"', () => {
  const links = [...html.matchAll(/<a\s[^>]*target="_blank"[^>]*>/g)].map(m => m[0]);
  assert.ok(links.length >= 1);
  for (const a of links) assert.match(a, /rel="noopener noreferrer"/, a);
});

test('タブとパネルの ARIA が対応し、選択中のタブだけが tabindex 0', () => {
  const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map(m => m[0]);
  const names = ['intro', 'examples', 'quiz'];
  assert.equal(tabs.length, names.length);
  names.forEach((name, i) => {
    const tab = tabs.find(t => t.includes(`id="btn-${name}"`));
    assert.ok(tab, name);
    assert.match(tab, new RegExp(`aria-controls="tab-${name}"`));
    assert.match(tab, i === 0 ? /aria-selected="true"/ : /aria-selected="false" [^>]*tabindex="-1"/);
    assert.match(html, new RegExp(`id="tab-${name}" role="tabpanel" aria-labelledby="btn-${name}"`));
  });
  const refs = [...html.matchAll(/aria-(?:labelledby|controls|describedby)="([^"]+)"/g)].flatMap(m => m[1].split(' '));
  for (const id of refs) assert.ok(ids.has(id), id);
});

test('script.js が探す id が index.html にある', () => {
  const used = new Set([...script.matchAll(/getElementById\('([\w-]+)'\)/g)].map(m => m[1]));
  assert.ok(used.size >= 20, `${used.size}`);
  for (const id of used) assert.ok(ids.has(id), id);
});

test('ボタンは type="button"、動的な表示に aria-live', () => {
  const buttons = [...html.matchAll(/<button\s[^>]*>/g)].map(m => m[0]);
  assert.ok(buttons.length >= 13);
  for (const b of buttons) assert.match(b, /type="button"/, b);
  for (const id of ['shuffle-status', 'quiz-feedback', 'quiz-result', 'map-charset']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-live="polite"`), id);
  }
});
