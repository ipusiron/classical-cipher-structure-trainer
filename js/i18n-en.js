/* ============================================================================
 * Classical Cipher Structure Trainer - index.html の英語の対応表
 * ============================================================================
 *
 * キーは index.html の日本語の原文（空白を1つにまとめたもの）。太字などで区切られた文は、
 * 区切りごとに訳し、英語でも同じ区切りで自然に読めるようにする。
 * 原文を変えたら、ここも変える（test/i18n.test.js が抜けを検出する）。
 * ブラウザーでは window.I18nEn、Node では require() で読む。
 * ============================================================================ */
(function (root) {
  'use strict';

  const en = {
    // ヘッダーとタブ
    'ダーク表示': 'Dark mode',
    'マッピング': 'Mapping',
    'と': ' and ',
    'シャッフル': 'Shuffle',
    'で古典暗号の構造を理解する教育ツール': ': an educational tool for understanding the structure of classical ciphers',
    '表示する内容': 'Sections',
    '概念': 'Concepts',
    '実験室': 'Lab',
    '見分ける': 'Detect',
    '古典暗号の例': 'Classical Ciphers',
    'クイズ': 'Quiz',

    // 概念（換字）
    '換字（Substitution）＝ マッピング（Mapping）': 'Substitution = Mapping',
    '文字を別の文字へ': 'A method that ',
    '対応づけ': 'maps',
    'る方式': ' each letter to another letter',
    '鍵は': 'The key is ',
    '対応表（置換表）': 'the correspondence table (substitution table)',
    'プログラムの': 'The same idea as ',
    'と同じ発想': ' in programming',
    '「何を何に置き換えるか」': '“What replaces what”',
    'が本質': ' is the essence',
    '💡 上段＝平文文字、下段＝暗号文文字。線が「対応」を示します。重複なく対応（一対一対応）。':
      '💡 Top row = plaintext letters, bottom row = ciphertext letters. Each line shows a mapping, and no letter is used twice (one-to-one).',
    '対応表を回す': 'Rotate the table',
    'ランダムに対応させる': 'Random table',
    '暗号文の文字を切り替え（A〜H ⇄ 1〜8）': 'Switch ciphertext letters (A–H ⇄ 1–8)',
    'リセット': 'Reset',

    // 概念（転置）
    '転置（Transposition）＝ シャッフル（Shuffle）': 'Transposition = Shuffle',
    '文字の': 'A method that ',
    '順序を入れ替える': 'changes the order',
    '方式': ' of the letters',
    '並べ替え方（順列）': 'the way of reordering (a permutation)',
    '例：トランプを切り混ぜて並べ替えるイメージ': 'Example: like shuffling a deck of cards',
    '実際の暗号では、決まった規則（一定の文字数ごとの順列、表への書き方と読み方など）で並べ替える':
      'Real ciphers reorder by a fixed rule (a permutation for each block of letters, how letters are written into and read out of a table, and so on)',
    '💡 文字のブロックをドラッグして順序を変えてみてください。キーボードでは、ブロックを選んでSpaceで持ち上げ、←→で動かし、Spaceで置きます（Escで取り消し）。':
      '💡 Drag the letter blocks to change the order. With a keyboard, select a block, press Space to pick it up, '
      + 'move it with the arrow keys, and press Space to drop it (Escape cancels).',
    '並べ替える文字': 'Letters to reorder',
    '元の並び：': 'Original: ',
    'ランダムに並べ替え': 'Random order',
    '逆順にする': 'Reverse',
    '偶奇を入れ替え': 'Swap pairs',
    '用語のヒント：': 'Terminology tip: ',
    '「換字」「転置」の漢字がイメージしにくいときは、「マッピング（Mapping）」と「シャッフル（Shuffle）」に置き換えて考えるとわかりやすくなります。古典暗号の多くは、この2つと、その組み合わせ（混合）で整理できます。':
      'If the terms “substitution” and “transposition” feel abstract, think of them as “mapping” and “shuffle”. '
      + 'Most classical ciphers can be organized as these two operations and their combinations (product ciphers).',
    '「置換」という語は、換字（文字の置き換え）にも、数学の置換（並べ替え＝順列）にも使われます。実は換字の対応表も、文字の種類を並べ替えた順列です。換字は「文字の種類」を、転置は「文字の位置」を並べ替えると考えると、2つの違いがはっきりします。':
      'The word “permutation” fits both: a substitution table is itself a permutation of the alphabet. '
      + 'Think of substitution as permuting the kinds of letters, and transposition as permuting their positions, and the difference becomes clear.',

    // 実験室
    '🧪 英文に換字・転置・多表式を掛けて、何が保たれ、何が崩れるかを数えます。使うのは英字（A〜Z）だけで、ほかの文字は除きます。':
      '🧪 Apply substitution, transposition, and polyalphabetic ciphers to English text and count what is preserved and what is broken. '
      + 'Only the letters A to Z are used; other characters are removed.',
    '暗号を掛けて比べる': 'Encrypt and compare',
    '平文（英文）': 'Plaintext (English)',
    '掛ける暗号': 'Cipher',
    '換字（単一換字）': 'Substitution (simple)',
    'シフト（シーザー暗号）': 'Shift (Caesar cipher)',
    'キーワード換字表': 'Keyword alphabet',
    'ランダムな換字表': 'Random alphabet',
    '多表式': 'Polyalphabetic',
    'ヴィジュネル暗号': 'Vigenère cipher',
    '転置': 'Transposition',
    '逆順': 'Reverse',
    'レールフェンス': 'Rail fence',
    '縦列転置': 'Columnar transposition',
    'ずらす量（1〜25）': 'Shift (1–25)',
    'キーワード（英字）': 'Keyword (letters)',
    '換字表を作り直す': 'New random alphabet',
    '鍵（英字）': 'Key (letters)',
    'レールの数（2〜10）': 'Rails (2–10)',
    'キーワード（英字2文字以上）': 'Keyword (2 or more letters)',
    '平文（英字だけ）': 'Plaintext (letters only)',
    '暗号文': 'Ciphertext',
    '保たれたもの': 'What is preserved',
    '比べるもの': 'Property',
    '平文': 'Plaintext',
    '結果': 'Result',
    '文字ごとの出現回数': 'Letter counts',
    '回数を表で見る': 'Show the counts as a table',
    'この暗号文を「見分ける」で調べる': 'Check this ciphertext in Detect',
    '重ねる（混合）と順番': 'Combine (product) and order',
    '換字と転置を続けて掛けると、混合（積）の暗号になります。2つを掛ける順番を入れ替えて、結果が同じになるかを確かめます。平文は上の欄の英文です。':
      'Applying a substitution and a transposition in turn makes a product cipher. Swap the order of the two and check whether the result stays the same. '
      + 'The plaintext is the English text above.',
    '換字の側': 'Substitution side',
    '単一換字（キーワードZEBRA）': 'Simple substitution (keyword ZEBRA)',
    '単一換字（シフト3）': 'Simple substitution (shift 3)',
    '多表式（ヴィジュネルLEMON）': 'Polyalphabetic (Vigenère LEMON)',
    '転置の側': 'Transposition side',
    '縦列転置（キーワードKEY）': 'Columnar transposition (keyword KEY)',
    'レールフェンス（3段）': 'Rail fence (3 rails)',
    '換字 → 転置': 'Substitution → transposition',
    '転置 → 換字': 'Transposition → substitution',

    // 見分ける
    '🔍 英文の暗号文だけから、転置・単一換字・多表式のどれに近いかを、文字の頻度と一致指数（IC）で見分けます。':
      '🔍 From an English ciphertext alone, tell whether it looks like a transposition, a simple substitution, or a polyalphabetic cipher, '
      + 'using letter frequencies and the index of coincidence (IC).',
    '暗号文を調べる': 'Check a ciphertext',
    '暗号文（英字だけを使います。30字以上）': 'Ciphertext (letters only, at least 30)',
    '例：転置': 'Example: transposition',
    '例：単一換字': 'Example: simple substitution',
    '例：多表式': 'Example: polyalphabetic',
    '消す': 'Clear',
    '次に試すツール': 'Tools to try next',
    'この見分け方の当たり具合': 'How accurate this detection is',

    // 古典暗号の例
    '💡 生成AIで作るセキュリティツール100で作った学習ツールへのリンク集です。カードを押すと、それぞれの暗号を新しいタブで動かせます。':
      '💡 Links to the learning tools of “100 Security Tools with Generative AI”. Press a card to try each cipher in a new tab.',

    // クイズ
    '20問・一問一答形式': '20 single-answer questions',
    '（定義3問・基礎4問・分類6問・性質3問・混合4問）。答えるたびに解説が出て、最後に間違えた問題を見直せます。':
      ' (3 definition, 4 basics, 6 classification, 3 properties, 4 mixed). Each answer shows an explanation, and you can review your mistakes at the end.',
    '問題の順番と選択肢を混ぜる（切り替えると最初からやり直す）': 'Shuffle the questions and choices (restarts the quiz)',
    '次へ': 'Next',
    '最初から': 'Restart',

    // フッター
    '🔗 GitHubリポジトリ：ipusiron/classical-cipher-structure-trainer': '🔗 GitHub repository: ipusiron/classical-cipher-structure-trainer',
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = en;
  else root.I18nEn = en;
})(typeof globalThis !== 'undefined' ? globalThis : this);
