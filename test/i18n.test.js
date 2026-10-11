const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const I18n = require('../js/i18n.js');
const HTML_EN = require('../js/i18n-en.js');
const M = require('../js/messages.js');
const Q = require('../js/quiz-data.js');
const Cat = require('../js/catalog.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const placeholders = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

test('初めの言語: ?lang= → 保存した選択 → ブラウザーの言語（日本語以外は英語）', () => {
  assert.equal(I18n.initialLanguage('?lang=en', 'ja', 'ja-JP'), 'en');
  assert.equal(I18n.initialLanguage('?lang=ja', 'en', 'en-US'), 'ja');
  assert.equal(I18n.initialLanguage('?lang=fr', 'en', 'ja-JP'), 'en');
  assert.equal(I18n.initialLanguage('', null, 'ja-JP'), 'ja');
  assert.equal(I18n.initialLanguage('', null, 'ja'), 'ja');
  assert.equal(I18n.initialLanguage('', null, 'en-US'), 'en');
  assert.equal(I18n.initialLanguage('', null, 'fr-FR'), 'en');
  assert.equal(I18n.initialLanguage('', null, ''), 'en');
});

test('文言の辞書: 日英でキーと置き場所が同じ、英語に日本語がない', () => {
  assert.deepEqual(Object.keys(M.dict.en).sort(), Object.keys(M.dict.ja).sort());
  for (const k of Object.keys(M.dict.ja)) {
    assert.deepEqual(placeholders(M.dict.en[k]), placeholders(M.dict.ja[k]), k);
    // 言語を切り替えるボタンの「日本語」だけは英語の画面に出す日本語
    if (k !== 'lang.switch') assert.ok(!I18n.hasJapanese(M.dict.en[k]), `${k}: ${M.dict.en[k]}`);
  }
  assert.equal(M.dict.en['lang.switch'], '日本語');
});

test('index.html の日本語は、すべて英語の対応表にある（余りもない）', () => {
  // 画面に出るテキストと、aria-label・title・label の属性を素朴に取り出す
  const start = html.indexOf('<body>');
  const body = html.slice(start, html.indexOf('<script', start)).replace(/<noscript>[\s\S]*?<\/noscript>/, '');
  const texts = body.split(/<[^>]+>/).map(I18n.normalize).filter(t => I18n.hasJapanese(t));
  const attrs = [...body.matchAll(/\s(?:aria-label|title|label)="([^"]+)"/g)].map(m => I18n.normalize(m[1])).filter(I18n.hasJapanese);
  const found = new Set([...texts, ...attrs]);
  assert.ok(found.size >= 90, `${found.size}`);
  for (const t of found) assert.ok(t in HTML_EN, `訳がない: ${t}`);
  for (const k of Object.keys(HTML_EN)) assert.ok(found.has(k), `使われていない訳: ${k}`);
  for (const v of Object.values(HTML_EN)) assert.ok(!I18n.hasJapanese(v), v);
});

test('クイズ: 英語の20問は日本語と id・区分・正解・選択肢の数が同じ', () => {
  assert.equal(Q.en.length, Q.ja.length);
  Q.ja.forEach((q, i) => {
    const e = Q.en[i];
    assert.deepEqual([e.id, e.category, e.answer, e.choices.length], [q.id, q.category, q.answer, q.choices.length], q.id);
    for (const s of [e.prompt, e.explanation, ...e.choices]) assert.ok(!I18n.hasJapanese(s), `${q.id}: ${s}`);
  });
  const kinds = Q.en.find(q => q.id === 'q005').choices;
  for (const id of ['q005', 'q006', 'q007', 'q008', 'q011']) assert.deepEqual(Q.en.find(q => q.id === id).choices, kinds, id);
});

test('カタログ: 42件すべてに英語の名前と説明がある', () => {
  for (const t of Cat.tools) {
    const en = Cat.textOf(t, 'en');
    assert.ok(en.name && en.desc, t.slug);
    assert.ok(!I18n.hasJapanese(en.name) && !I18n.hasJapanese(en.desc), t.slug);
    assert.deepEqual(Cat.textOf(t, 'ja'), { name: t.name, desc: t.desc });
  }
  assert.deepEqual(Object.keys(Cat.EN).sort(), Cat.tools.map(t => t.slug).sort());
});

test('英語の対応表の入れ替え: 原文の前後の空白を保ち、戻すと原文に戻る', () => {
  // DOM の代わりに、テキストノードと属性を持つ小さな木で確かめる
  const nodes = [{ nodeValue: ' 概念 ', parentElement: { closest: () => null } }];
  const el = { getAttribute: () => '表示する内容', setAttribute(a, v) { this.v = v; }, closest: () => null };
  const doc = {
    createTreeWalker: () => {
      let i = -1;
      return { nextNode: () => (++i < nodes.length), get currentNode() { return nodes[i]; } };
    },
  };
  const fakeRoot = { ownerDocument: doc, querySelectorAll: () => [el] };
  I18n.collect(fakeRoot);
  assert.deepEqual(I18n.missing(HTML_EN), []);
  I18n.apply('en', HTML_EN);
  assert.equal(nodes[0].nodeValue, ' Concepts ');
  assert.equal(el.v, 'Sections');
  I18n.apply('ja', HTML_EN);
  assert.equal(nodes[0].nodeValue, ' 概念 ');
});
