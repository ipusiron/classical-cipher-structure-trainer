const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');

/** ブロックの中の --name: #rrggbb を集める */
function tokens(block) {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map(m => [m[1], m[2].toLowerCase()]));
}
const light = tokens(css.match(/:root\{([\s\S]*?)\n\}/)[1]);
const darkMedia = tokens(css.match(/:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\n {2}\}/)[1]);
const darkSet = tokens(css.match(/:root\[data-theme="dark"\]\{([\s\S]*?)\n\}/)[1]);

function luminance(hex) {
  return hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [文字, 背景, 場所]（4.5:1 以上）
const TEXT = [
  ['fg', 'bg', 'ページの地'],
  ['fg', 'card', 'カード'],
  ['fg', 'surface', '図・ボタン・選択肢'],
  ['fg', 'surface-2', '並べ替えの枠'],
  ['fg', 'hint-bg', 'ヒント'],
  ['fg', 'brand-weak', '選択中のタブ・持ち上げたブロック・ダーク表示のボタン'],
  ['fg', 'hover-bg', 'ホバー'],
  ['muted', 'bg', 'サブタイトル・フッター'],
  ['muted', 'card', '進み具合・暗号文の文字'],
  ['muted', 'surface', 'カードの説明・元の並び'],
  ['hint-fg', 'hint-bg', 'ヒントの文字'],
  ['tip-fg', 'tip-bg', '用語のヒント'],
  ['tip-strong', 'tip-bg', '用語のヒントの強調'],
  ['ok-fg', 'ok-bg', '正解'],
  ['ng-fg', 'ng-bg', '不正解・エラー'],
  ['link', 'bg', 'フッターのリンク'],
  ['link', 'surface', 'カードのリンク'],
  ['on-primary', 'brand-strong', '主ボタン・矢印のリンク'],
];

// [前景, 背景, 場所]（操作要素の枠・フォーカス・図の線は 3:1 以上）
const UI = [
  ['focus', 'bg', 'フォーカスの枠（地）'],
  ['focus', 'card', 'フォーカスの枠（カード）'],
  ['focus', 'surface', 'フォーカスの枠（面）'],
  ['border-strong', 'surface', 'ボタン・ブロックの枠'],
  ['border-strong', 'bg', 'カードの枠（地の上）'],
  ['border-strong', 'surface-2', '並べ替えの枠の中のブロック'],
  ['brand-strong', 'surface', '対応図の線・選択中の枠'],
  ['ok-border', 'surface', '正解の枠'],
  ['ng-border', 'surface', '不正解の枠'],
];

for (const [name, t] of [['ライト', light], ['ダーク', darkSet]]) {
  test(`${name}: 文字は 4.5:1 以上`, () => {
    for (const [fg, bg, where] of TEXT) {
      assert.ok(t[fg] && t[bg], `${fg}/${bg} の定義`);
      const r = ratio(t[fg], t[bg]);
      assert.ok(r >= 4.5, `${where}: ${fg} on ${bg} = ${r.toFixed(2)}`);
    }
  });
  test(`${name}: 枠・フォーカス・線は 3:1 以上`, () => {
    for (const [fg, bg, where] of UI) {
      const r = ratio(t[fg], t[bg]);
      assert.ok(r >= 3, `${where}: ${fg} on ${bg} = ${r.toFixed(2)}`);
    }
  });
}

test('ダークの値は、OS の設定とボタンの2か所で同じ', () => {
  assert.deepEqual(darkMedia, darkSet);
  assert.deepEqual(Object.keys(darkSet).sort(), Object.keys(light).sort());
});

test('規則の中に固定の色を書かない（変数を使う）', () => {
  const body = css.replace(/:root[^{]*\{[\s\S]*?\n\s*\}/g, '');
  const fixed = [...body.matchAll(/:\s*[^;{}]*#[\da-f]{3,6}\b/gi)].map(m => m[0]);
  assert.deepEqual(fixed, []);
});
