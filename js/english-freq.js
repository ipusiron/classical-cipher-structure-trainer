/* ============================================================================
 * Classical Cipher Structure Trainer - 英語の文字の出現回数（見分けの基準）
 * ============================================================================
 *
 * 出典: Project Gutenberg #1342『Pride and Prejudice』（Jane Austen、パブリックドメイン）。
 * 本文（*** START と *** END の間）を大文字にし、A〜Z だけを数えた回数。合計 563,924 文字。
 * 見分けのしきい値もこの本で決め、当たり具合は別の本（#98『A Tale of Two Cities』）で測った
 * （tools/eval-classify.js、結果は tools/eval-classify-result.json）。
 * ブラウザーでは window.EnglishFreq、Node では require() で読む。
 * ============================================================================ */
(function (root) {
  'use strict';

  const SOURCE = 'Project Gutenberg #1342 Pride and Prejudice';
  const COUNTS = Object.freeze([
    43825, 9491, 14229, 23183, 72582, 12617, 10588, 35632, 40097, 919, 3357, 23004, 15378, // A〜M
    39650, 42025, 8709, 649, 33978, 34943, 49335, 15786, 6006, 12726, 1004, 13241, 970,     // N〜Z
  ]);
  const TOTAL = COUNTS.reduce((a, b) => a + b, 0);
  const FREQ = Object.freeze(COUNTS.map(c => c / TOTAL));

  const api = { SOURCE, COUNTS, TOTAL, FREQ };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EnglishFreq = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
