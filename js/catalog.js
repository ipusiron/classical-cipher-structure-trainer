/* ============================================================================
 * Classical Cipher Structure Trainer - 古典暗号の例（シリーズのツールの一覧）
 * ============================================================================
 *
 * 「古典暗号の例」タブのカードは、この一覧だけから描く。
 *   day   : 生成AIで作るセキュリティツール100 の Day 番号
 *   slug  : リポジトリー名（公開先は https://ipusiron.github.io/<slug>/）
 *   title : 各ツールの README の YAML の title（そのまま写す）
 *   kind  : substitution（換字式）｜transposition（転置式）｜other（その他）
 *   sub   : 換字式の中の分け方 mono（単一換字）｜poly（多表式）｜polygraphic（多字換字）、
 *           転置式は transposition、その他は concealment（分置式）
 *   name・desc : カードに出す暗号の名前と説明（日本語）
 * 分類は各ツールの README の説明に合わせる（例: ジグザグ暗号は換字の一種、ヒル暗号は多字換字）。
 * ブラウザーでは window.Catalog、Node では require() で読む。
 * ============================================================================ */
(function (root) {
  'use strict';

  const KINDS = ['substitution', 'transposition', 'other'];
  const SUBS = {
    substitution: ['mono', 'poly', 'polygraphic'],
    transposition: ['transposition'],
    other: ['concealment'],
  };

  const tools = [
    // 換字式（単一換字: 対応表を1つだけ使う）
    { day: 3, slug: 'caesar-cipher-wheel', title: 'Caesar Cipher Wheel Tool', kind: 'substitution', sub: 'mono',
      name: 'シーザー暗号', desc: '全部の文字を同じ量だけずらす。対応表はずらし量で決まる' },
    { day: 4, slug: 'japanese-caesar-cipher', title: 'Japanese Caesar Cipher', kind: 'substitution', sub: 'mono',
      name: '日本語版シーザー暗号', desc: 'ひらがなを、あいうえお順やいろは順で同じ量だけずらす' },
    { day: 49, slug: 'affine-cipherlab', title: 'Affine CipherLab', kind: 'substitution', sub: 'mono',
      name: 'アフィン暗号', desc: '文字の番号を一次関数 ax + b で別の番号へ写す' },
    { day: 32, slug: 'pigpen-cipherlab', title: 'Pigpen CipherLab', kind: 'substitution', sub: 'mono',
      name: 'ピッグペン暗号', desc: '文字を、格子の枠と点でできた記号に置き換える' },
    { day: 22, slug: 'dancingmen-cipherlab', title: 'DancingMen CipherLab', kind: 'substitution', sub: 'mono',
      name: '踊る人形', desc: 'シャーロック・ホームズの短編に登場。文字を人形の絵に置き換える' },
    { day: 67, slug: 'polybius-cipherlab', title: 'Polybius CipherLab', kind: 'substitution', sub: 'mono',
      name: 'ポリュビオス暗号', desc: '文字を、方陣の行と列の数字の組に置き換える' },
    { day: 12, slug: 'uesugi-cipher', title: 'Uesugi Cipher Tool', kind: 'substitution', sub: 'mono',
      name: '上杉暗号', desc: 'いろは48文字を、表の行と列の数字の組に置き換える' },
    { day: 14, slug: 'shinobi_iroha_cipher', title: 'Shinobi Iroha Cipher', kind: 'substitution', sub: 'mono',
      name: '忍びいろは', desc: 'ひらがなを、漢字の偏と旁を組み合わせた字に置き換える' },
    { day: 55, slug: 'bacon-cipherlab', title: 'Bacon CipherLab', kind: 'substitution', sub: 'mono',
      name: 'ベーコン暗号', desc: '1文字を a と b の5文字に置き換え、書体の違いとして文章に隠す' },
    { day: 72, slug: 'zigzag-cipherlab', title: 'Zigzag CipherLab', kind: 'substitution', sub: 'mono',
      name: 'ジグザグ暗号', desc: '文字を鍵の列の位置に置き換え、折れ線で描く。英語の zigzag cipher（レールフェンス）とは別物' },
    // 換字式（多表式: 位置によって別の対応表を使う）
    { day: 17, slug: 'vigenere-cipher-tool', title: 'Vigenere Cipher Tool', kind: 'substitution', sub: 'poly',
      name: 'ヴィジュネル暗号', desc: '鍵の文字ごとに、別のずらし量の対応表を順に使う' },
    { day: 78, slug: 'beaufort-cipherlab', title: 'Beaufort CipherLab', kind: 'substitution', sub: 'poly',
      name: 'ビューフォート暗号', desc: '鍵の文字から平文の文字を引く多表式。暗号化と復号が同じ操作' },
    { day: 71, slug: 'strip-cipherlab', title: 'Strip CipherLab', kind: 'substitution', sub: 'poly',
      name: 'ストリップ暗号', desc: 'アルファベットを並べた帯を何本も並べ、平文の行とは別の行を読む' },
    // 換字式（多字換字: 複数の文字をまとめて置き換える）
    { day: 27, slug: 'playfair-cipherlab', title: 'Playfair CipherLab', kind: 'substitution', sub: 'polygraphic',
      name: 'プレイフェア暗号', desc: '5×5の表で、2文字を別の2文字に置き換える' },
    { day: 80, slug: 'porta-cipherlab', title: 'Porta CipherLab', kind: 'substitution', sub: 'polygraphic',
      name: 'ポルタの二文字式暗号', desc: '1563年の表で、2文字を表の1マス（記号）に置き換える' },
    { day: 93, slug: 'hill-cipherlab', title: 'Hill CipherLab', kind: 'substitution', sub: 'polygraphic',
      name: 'ヒル暗号', desc: '行列の掛け算で、n文字をまとめて別のn文字に置き換える' },
    // 転置式
    { day: 10, slug: 'scytale-cipher-visualizer', title: 'Scytale Cipher Visualizer', kind: 'transposition', sub: 'transposition',
      name: 'スキュタレー暗号', desc: '帯を棒に巻いて書き、ほどいて読む' },
    { day: 95, slug: 'permutation-cipherlab', title: 'Permutation CipherLab', kind: 'transposition', sub: 'transposition',
      name: '転置式暗号（順列）', desc: '一定の文字数ごとに、同じ順列で並べ替える' },
    { day: 34, slug: 'railfence-cipherlab', title: 'RailFence CipherLab', kind: 'transposition', sub: 'transposition',
      name: 'レールフェンス暗号', desc: '文字をジグザグに書き、行ごとに読む' },
    { day: 43, slug: 'columnar-cipherlab', title: 'Columnar CipherLab', kind: 'transposition', sub: 'transposition',
      name: '縦列転置式暗号', desc: '表に横に書き、鍵の順に列を縦に読む' },
    { day: 24, slug: 'grille-cipherlab', title: 'Grille CipherLab', kind: 'transposition', sub: 'transposition',
      name: '回転グリル暗号', desc: '穴のあいた型紙を回しながら書き込み、表を埋める' },
    // その他
    { day: 36, slug: 'hidden-message-challenge', title: 'Hidden Message Challenge', kind: 'other', sub: 'concealment',
      name: '分置式暗号', desc: 'ふつうの文章の中に、本文の文字を決まった位置に散らして隠す' },
  ];

  const url = slug => `https://ipusiron.github.io/${slug}/`;

  const api = { KINDS, SUBS, tools, url };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Catalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
