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

    // 配色
    'theme.label': 'ダーク表示',

    // クイズ
    'quiz.progress': '問題 {n} / {total}（正解 {score}）',
    'quiz.next': '次へ',
    'quiz.finish': '結果を見る',
    'quiz.correct': '正解',
    'quiz.incorrect': '不正解',
    'quiz.answerIs': '正解は「{answer}」',
    'quiz.mark.correct': '（正解）',
    'quiz.mark.chosen': '（選んだ答え）',
    'quiz.result': '最終結果: {total}問中{score}問正解（{percent}%）',
    'quiz.retry': 'もう一度挑戦',
    'quiz.grade.low': 'もう一歩。「概念」タブの図に戻り、「線＝対応」「ブロック＝並べ替え」を確かめよう。',
    'quiz.grade.mid': '理解は順調。「古典暗号の例」タブのリンク先で、鍵の正体（対応表か並べ替えか）を体験しよう。',
    'quiz.grade.high': '合格。古典暗号は「換字と転置、その組み合わせ」で整理できる。',
    'quiz.error.load': 'クイズの問題を読み込めませんでした（{detail}）',
    'quiz.error.empty': '問題がありません',
    'quiz.error.field': '{n}問目の {field}',
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
