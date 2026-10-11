/* ============================================================================
 * Classical Cipher Structure Trainer - 配色（ライト／ダーク）
 * ============================================================================
 *
 * <head> で読み、描画の前に <html data-theme> を決める（ちらつきを防ぐ）。
 * 保存した選択があればそれ、なければ OS の設定に従う（data-theme を付けない）。
 * localStorage が使えない環境（プライベートモードなど）でも例外で止めない。
 * ============================================================================ */
(function () {
  'use strict';

  const KEY = 'ccst-theme';

  function saved() {
    try {
      const v = window.localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function current() {
    const set = document.documentElement.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme, store) {
    document.documentElement.setAttribute('data-theme', theme);
    if (!store) return;
    try {
      window.localStorage.setItem(KEY, theme);
    } catch (e) {
      // 保存できなくても、このページの表示は切り替わる
    }
  }

  const s = saved();
  if (s) apply(s, false);

  window.Theme = { current, apply, toggle: () => apply(current() === 'dark' ? 'light' : 'dark', true) };
})();
