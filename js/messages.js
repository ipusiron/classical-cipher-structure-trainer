/* ============================================================================
 * Classical Cipher Structure Trainer - 画面の文言（script.js が組み立てる分）
 * ============================================================================
 *
 * 文言はキーで引き、{name} の形の置き場所を params で埋める。
 * index.html に直接書いた文言はここに置かない。
 * ブラウザーでは window.Messages、Node では require() で読む。
 * ============================================================================ */
(function (root) {
  'use strict';

  const ja = {
    // 換字（マッピング）
    'map.kind.shift': 'シフト{offset}',
    'map.kind.random': 'ランダムな対応表',
    'map.key': '対応表（{kind}）: {pairs}',
    'map.pair': '{from}→{to}',
    'map.figure': '上段の平文の文字 A〜H と、下段の暗号文の文字をつなぐ線の図。{pairs}',
    'map.charset.letters': '暗号文の文字: A〜H',
    'map.charset.numbers': '暗号文の文字: 1〜8',

    // 転置（シャッフル）
    'shuffle.now': 'いまの並び: {word}',
    'shuffle.block': '{ch}（元の{from}番目、いま{to}番目）',
    'shuffle.grabbed': '{ch} を持ち上げました。いま{pos}番目です。←→で動かし、Space で置きます。Esc で取り消します。',
    'shuffle.moved': '{ch}: {pos}番目',
    'shuffle.dropped': '{ch} を{pos}番目に置きました。いまの並び: {word}',
    'shuffle.cancelled': '取り消しました。いまの並び: {word}',
    'shuffle.changed': '並べ替えました。いまの並び: {word}',
  };

  const dict = { ja };
  let lang = 'ja';

  function t(key, params = {}) {
    const s = (dict[lang] && dict[lang][key]) || dict.ja[key];
    if (s === undefined) return key;
    return s.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
  }

  const api = { dict, t, get lang() { return lang; }, setLang(l) { if (dict[l]) lang = l; } };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Messages = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
