/* ============================================================================
 * Classical Cipher Structure Trainer - 古典暗号の例（シリーズのツールの一覧）
 * ============================================================================
 *
 * 「古典暗号の例」タブのカードは、この一覧だけから描く。
 *   day   : 生成AIで作るセキュリティツール100 の Day 番号
 *   slug  : リポジトリ名（公開先は https://ipusiron.github.io/<slug>/）
 *   title : 各ツールの README の YAML の title（そのまま写す）
 *   kind  : substitution（換字式）｜transposition（転置式）｜product（混合）｜other（その他）｜
 *           tools（解く・調べる・学ぶ）
 *   sub   : 換字式の中の分け方 mono（単一換字）｜poly（多表式）｜polygraphic（多字換字）、
 *           転置式は transposition、混合は product、その他は concealment（分置式）｜code（コード）、
 *           解く・学ぶは analysis（解析・解読）｜study（性質を学ぶ）
 *   name・desc : カードに出す暗号の名前と説明（日本語）
 * 分類は各ツールの README の説明に合わせる（例: ジグザグ暗号は換字の一種、ヒル暗号は多字換字）。
 * ブラウザーでは window.Catalog、Node では require() で読む。
 * ============================================================================ */
(function (root) {
  'use strict';

  const KINDS = ['substitution', 'transposition', 'product', 'other', 'tools'];
  const SUBS = {
    substitution: ['mono', 'poly', 'polygraphic'],
    transposition: ['transposition'],
    product: ['product'],
    other: ['concealment', 'code'],
    tools: ['analysis', 'study'],
  };

  const tools = [
    // 換字式（単一換字: 対応表を1つだけ使う）
    { day: 3, slug: 'caesar-cipher-wheel', title: 'Caesar Cipher Wheel Tool', kind: 'substitution', sub: 'mono',
      name: 'シーザー暗号', desc: '全部の文字を同じ量だけずらす。対応表はずらし量で決まる' },
    { day: 4, slug: 'japanese-caesar-cipher', title: 'Japanese Caesar Cipher', kind: 'substitution', sub: 'mono',
      name: '日本語版シーザー暗号', desc: 'ひらがなを、あいうえお順やいろは順で同じ量だけずらす' },
    { day: 49, slug: 'affine-cipherlab', title: 'Affine CipherLab', kind: 'substitution', sub: 'mono',
      name: 'アフィン暗号', desc: '文字の番号を一次関数ax + bで別の番号へ写す' },
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
      name: 'ベーコン暗号', desc: '1文字をaとbの5文字に置き換え、書体の違いとして文章に隠す' },
    { day: 72, slug: 'zigzag-cipherlab', title: 'Zigzag CipherLab', kind: 'substitution', sub: 'mono',
      name: 'ジグザグ暗号', desc: '文字を鍵の列の位置に置き換え、折れ線で描く。英語のzigzag cipher（レールフェンス）とは別物' },
    { day: 5, slug: 'rot13-encoder', title: 'ROT13 Encoder', kind: 'substitution', sub: 'mono',
      name: 'ROT13', desc: '英字を13文字ずらす。同じ操作を2回掛けると元に戻る' },
    { day: 37, slug: 'quick-rot47', title: 'QuickROT47', kind: 'substitution', sub: 'mono',
      name: 'ROT47', desc: 'ASCIIの記号・数字を含む94文字を、47文字ずらす' },
    { day: 76, slug: 'crypto-emoji-translator', title: 'Crypto Emoji Translator', kind: 'substitution', sub: 'mono',
      name: '絵文字の暗号', desc: '暗号文の文字を絵文字に置き換える。見た目が変わっても頻度の偏りは残る' },
    { day: 42, slug: 'classic-js-obfuscator', title: 'Classic JS Obfuscator', kind: 'substitution', sub: 'mono',
      name: 'シーザー暗号による難読化', desc: 'JavaScriptのコードをシーザー暗号で置き換え、実行するときに戻して動かす' },
    // 換字式（多表式: 位置によって別の対応表を使う）
    { day: 17, slug: 'vigenere-cipher-tool', title: 'Vigenere Cipher Tool', kind: 'substitution', sub: 'poly',
      name: 'ヴィジュネル暗号', desc: '鍵の文字ごとに、別のずらし量の対応表を順に使う' },
    { day: 78, slug: 'beaufort-cipherlab', title: 'Beaufort CipherLab', kind: 'substitution', sub: 'poly',
      name: 'ビューフォート暗号', desc: '鍵の文字から平文の文字を引く多表式。暗号化と復号が同じ操作' },
    { day: 71, slug: 'strip-cipherlab', title: 'Strip CipherLab', kind: 'substitution', sub: 'poly',
      name: 'ストリップ暗号', desc: 'アルファベットを並べた帯を何本も並べ、平文の行とは別の行を読む' },
    { day: 29, slug: 'otp-animation', title: 'OTP Animation', kind: 'substitution', sub: 'poly',
      name: 'ワンタイムパッド', desc: '平文と同じ長さの使い捨ての鍵とXORする。鍵を繰り返さない' },
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
    { day: 84, slug: 'mirror-cipherlab', title: 'Mirror CipherLab', kind: 'transposition', sub: 'transposition',
      name: 'ミラー暗号（逆転置）', desc: '文字の並びを逆にする（全文・語・行など）。字形の鏡像と組み合わせる' },
    // 混合（換字と転置を組み合わせる）
    { day: 94, slug: 'toyspn-builder', title: 'ToySPN Builder', kind: 'product', sub: 'product',
      name: 'SPN（換字と転置の繰り返し）', desc: 'S-Box（換字）とP層（転置）に鍵の加算を挟んで繰り返す。現代のブロック暗号の骨組み' },
    // その他
    { day: 36, slug: 'hidden-message-challenge', title: 'Hidden Message Challenge', kind: 'other', sub: 'concealment',
      name: '分置式暗号', desc: 'ふつうの文章の中に、本文の文字を決まった位置に散らして隠す' },
    { day: 69, slug: 'trevanion-cipherlab', title: 'Trevanion CipherLab', kind: 'other', sub: 'concealment',
      name: 'トレヴァニオン暗号', desc: '手紙の句読点の直後から数えて3文字目を拾い集めて読む（Null暗号）' },
    { day: 86, slug: 'epigraph-chronogrammer', title: 'Epigraph Chronogrammer', kind: 'other', sub: 'concealment',
      name: 'クロノグラム', desc: '文の中のローマ数字に当たる文字を足して、年号を表す' },
    { day: 99, slug: 'book-code-builder', title: 'Book Code Builder', kind: 'other', sub: 'code',
      name: '書籍暗号（ブックコード）', desc: '語を、本の中の位置（ページ・行・語の番号）で表すコード' },
    // 解く・調べる・学ぶ
    { day: 44, slug: 'cipher-clairvoyance', title: 'Cipher Clairvoyance', kind: 'tools', sub: 'analysis',
      name: '暗号方式の推定', desc: '暗号文の特徴から、どの古典暗号が使われたかを推定する' },
    { day: 9, slug: 'frequency-analyzer', title: 'Frequency Analyzer', kind: 'tools', sub: 'analysis',
      name: '頻度分析', desc: '英語の頻度・一致指数・n-gramで、単一換字を手で解く' },
    { day: 8, slug: 'caesar-cipher-breaker', title: 'Caesar Cipher Breaker', kind: 'tools', sub: 'analysis',
      name: 'シーザー暗号の総当たり', desc: '25通りのずらし量をすべて試し、英単語と頻度で候補を選ぶ' },
    { day: 18, slug: 'cipherclimb', title: 'Cipher Climb', kind: 'tools', sub: 'analysis',
      name: '山登り法による解読', desc: '換字表を少しずつ変え、英語らしさが上がる方へ進めて解く' },
    { day: 47, slug: 'ic-learning-visualizer', title: 'IC Learning Visualizer', kind: 'tools', sub: 'analysis',
      name: '一致指数（IC）', desc: 'ICで単一換字と多表式を見分け、周期ごとのICで鍵の長さを推定する' },
    { day: 28, slug: 'repeatseq-analyzer', title: 'RepeatSeq Analyzer', kind: 'tools', sub: 'analysis',
      name: '繰り返しの解析（カシスキー）', desc: '暗号文の繰り返しの間隔と列のICから、多表式の鍵の長さを推定する' },
    { day: 30, slug: 'modular-text-divider', title: 'Modular Text Divider', kind: 'tools', sub: 'analysis',
      name: '列への分割', desc: '暗号文を周期ごとの列に分け、多表式を単一換字の集まりにして解く' },
    { day: 46, slug: 'alphaloom', title: 'AlphaLoom', kind: 'tools', sub: 'analysis',
      name: '鍵の候補の探索', desc: '鍵の位置ごとに来そうな文字を並べ、辞書の語で多表式の鍵の候補を採点する' },
    { day: 45, slug: 'anagram-hunter', title: 'Anagram Hunter', kind: 'tools', sub: 'analysis',
      name: 'アナグラムの探索', desc: '文字を並べ替えて作れる語やフレーズを探す。転置を手で解くときに使える' },
    { day: 51, slug: 'involution-studio', title: 'Involution Studio', kind: 'tools', sub: 'study',
      name: '2回で元に戻る操作', desc: '換字・転置・ビット反転で、同じ操作を2回掛けると元に戻る性質を学ぶ' },
  ];

  const url = slug => `https://ipusiron.github.io/${slug}/`;

  const api = { KINDS, SUBS, tools, url };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Catalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
