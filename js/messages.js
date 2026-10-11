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
    'map.key': '対応表（{kind}）：{pairs}',
    'map.pair': '{from}→{to}',
    'map.figure': '上段の平文の文字 A〜H と、下段の暗号文の文字をつなぐ線の図。{pairs}',
    'map.inverse': '逆の表（復号に使う）：{pairs}',
    'map.count': '{n}文字の一対一の対応表は全部で{n}! = {total}通り。シフトはそのうちの{n}通り。',
    'map.charset.letters': '暗号文の文字：A〜H',
    'map.charset.numbers': '暗号文の文字：1〜8',

    // 転置（シャッフル）
    'shuffle.now': 'いまの並び：{word}',
    'shuffle.block': '{ch}（元の{from}番目、いま{to}番目）',
    'shuffle.key': '並べ替えの鍵（いまのi番目に、元の何番目を置くか）：{order}',
    'shuffle.inverse': '元に戻す鍵（元のi番目に、いまの何番目を置くか）：{order}',
    'shuffle.count': '{word}（{n}文字が全部違う）の並べ方は全部で{n}! = {total}通り。',
    'shuffle.grabbed': '{ch}を持ち上げました。いま{pos}番目です。←→で動かし、Spaceで置きます。Escで取り消します。',
    'shuffle.moved': '{ch}：{pos}番目',
    'shuffle.dropped': '{ch}を{pos}番目に置きました。いまの並び：{word}',
    'shuffle.cancelled': '取り消しました。いまの並び：{word}',
    'shuffle.changed': '並べ替えました。いまの並び：{word}',

    // 実験室
    'lab.count': '英字 {letters}文字（入力 {chars}文字、上限 {max}文字）',
    'lab.empty': '英字（A〜Z）を含む英文を入れてください。',
    'lab.more': '…（ほか{n}文字）',
    'lab.none': 'なし',
    'lab.error.shift': 'ずらす量は1〜25の整数で入れてください。',
    'lab.error.rails': 'レールの数は2〜10の整数で入れてください。',
    'lab.error.keyEmpty': 'キーワード（鍵）を入れてください。',
    'lab.error.keyChars': 'キーワード（鍵）は英字だけで入れてください。',
    'lab.error.keyShort': 'キーワードは英字{min}文字以上で入れてください。',
    'lab.error.keyLong': 'キーワード（鍵）は英字{max}文字までです。',
    'lab.key.sub': '換字表：平文 {plain} → 暗号文 {cipher}',
    'lab.key.vig': '鍵：{key}（鍵の文字ごとに別のずらし量の対応表を順に使う）',
    'lab.key.trans': '並べ替え（暗号文のi文字目＝平文の何文字目か）：{order}',
    'lab.row.counts': '文字ごとの回数（多い3文字）',
    'lab.row.profile': '回数を多い順に並べた形（上位5）',
    'lab.row.pattern': '同じ文字が現れる位置の型',
    'lab.row.ic': '一致指数（IC）',
    'lab.row.chi': '英語の頻度とのカイ二乗',
    'lab.kept.yes': '✓ 同じ',
    'lab.kept.no': '✗ 変わった',
    'lab.explain.substitution': '単一換字は、同じ文字を必ず同じ文字にするので、同じ文字が現れる位置の型と、回数を多い順に並べた形が保たれます。文字そのものが変わるので、文字ごとの回数（どの文字が多いか）は変わります。',
    'lab.explain.transposition': '転置は文字そのものを変えないので、文字ごとの回数がそのまま保たれ、英語の頻度とのカイ二乗も平文と同じです。位置が変わるので、同じ文字が現れる位置の型は崩れます。',
    'lab.explain.polyalphabetic': '多表式は、位置によって別の対応表を使うので、同じ文字でも別の文字になります。回数の偏りがならされ、一致指数（IC）が下がります。どの性質も保たれません。',
    'lab.bars.plain': '平文',
    'lab.bars.cipher': '暗号文',
    'lab.bars.tip': '{ch}：{c}回',
    'lab.bars.aria': '{label}の文字ごとの出現回数の棒グラフ。多い文字は {top}',
    'lab.count.letter': '文字',
    'lab.count.plain': '平文',
    'lab.count.cipher': '暗号文',
    'lab.result': '結果',
    'mix.same': '✓ 2つの順番で結果が同じになりました。',
    'mix.diff': '✗ 2つの順番で結果が違います（{pos}文字目から食い違う）。',
    'mix.note.profileKept': '回数を多い順に並べた形は、平文と同じまま残っています。単一換字と転置を重ねても、頻度の形は崩れません。この弱さを避ける方式に、文字を2つに分けてから並べ替えるADFGVX暗号や、置き換えと並べ替えに鍵を挟んで繰り返すSPN（Day094）があります。',
    'mix.note.profileBroken': '回数を多い順に並べた形も、平文から変わりました。位置ごとに対応表が変わる多表式が入ると、順番によって結果が変わり、頻度の形も崩れます。',

    // 見分ける
    'detect.count': '英字 {letters}文字（見分けには{min}文字以上が必要）',
    'detect.empty': '暗号文を入れるか、例のボタンを押してください。',
    'detect.kind.short': '英字が少なすぎて見分けられません。',
    'detect.kind.transposition': '転置の可能性が高い（文字の頻度が普通の英語と同じ。平文のままの英文もこの結果になります）',
    'detect.kind.mono': '単一換字の可能性が高い（頻度の偏りは英語並みだが、どの文字が多いかが英語と違う）',
    'detect.kind.poly': '多表式など、位置ごとに対応表が変わる方式の可能性が高い（頻度がならされている）',
    'detect.step.n': '英字の数：{n}文字（{min}文字以上で見分ける）',
    'detect.step.chiLow': '英語の頻度とのカイ二乗：{chi}（{max}未満＝普通の英語に近い）→ 転置',
    'detect.step.chiHigh': '英語の頻度とのカイ二乗：{chi}（{max}以上＝普通の英語と違う）→ 換字がかかっている',
    'detect.step.icHigh': '一致指数（IC）：{ic}（{min}以上＝頻度の偏りが大きい）→ 単一換字',
    'detect.step.icLow': '一致指数（IC）：{ic}（{min}未満＝頻度がならされている）→ 多表式など',
    'detect.top': '多い文字：{letters}',
    'detect.caution': '短い暗号文、英語でない平文、換字と転置を重ねた暗号（単一換字と同じ結果になる）では外れることがあります。結果は「可能性」です。',
    'detect.link.name': '{title}（Day{day}）',
    'detect.link.withText': '暗号文を渡して開く',
    'detect.link.page': 'ページを開く（暗号文は貼り付け）',
    'detect.method': 'しきい値（カイ二乗{chi}未満なら転置、IC {ic}以上なら単一換字）は、{train}の英文で決めました。下の表は、別の本（{test}）から抜き出した英文に暗号を掛け、長さごとに3種類×{per}件で測った正答率です。'
      + '転置は5〜9文字のキーワードの縦列転置、単一換字はランダムな換字表、多表式は3〜8文字の鍵のヴィジュネル暗号です。',
    'detect.book': 'Project Gutenberg #{ebook}『{title}』',
    'detect.acc.length': '英字の長さ',
    'detect.acc.transposition': '転置',
    'detect.acc.mono': '単一換字',
    'detect.acc.poly': '多表式',
    'detect.acc.letters': '{n}文字',
    'detect.limits': '鍵の短いヴィジュネル暗号は頻度の偏りが残るので、単一換字と出ることがあります。英語以外の言語、数字や記号の暗号、プレイフェアなどの多字換字は、この表の対象外です。詳しい推定はCipher Clairvoyance（Day044）を使います。',

    // 配色と言語
    'theme.label': 'ダーク表示',
    'lang.switch': 'English',
    'list.sep': '・',

    // 古典暗号の例
    'catalog.kind.substitution': '🔤 換字式暗号（Substitution）',
    'catalog.kind.substitution.desc': '文字を別の文字・記号に対応づける（マッピング）方式。{count}件',
    'catalog.kind.transposition': '🔀 転置式暗号（Transposition）',
    'catalog.kind.transposition.desc': '文字はそのままで、位置を並べ替える（シャッフル）方式。{count}件',
    'catalog.kind.product': '🧩 混合（換字＋転置）',
    'catalog.kind.product.desc': '換字と転置を組み合わせ、繰り返す方式。{count}件',
    'catalog.kind.other': '🔍 その他',
    'catalog.kind.other.desc': '換字でも転置でもなく、文章の中に本文を隠す方式や、語を符号に置き換えるコード。{count}件',
    'catalog.kind.tools': '🛠️ 解く・調べる・学ぶ',
    'catalog.kind.tools.desc': '暗号文を解析して解く道具と、暗号の性質を学ぶ道具。{count}件',
    'catalog.sub.product': '混合',
    'catalog.sub.code': 'コード',
    'catalog.sub.analysis': '解析・解読',
    'catalog.sub.study': '学習',
    'catalog.filter.legend': '分類で絞り込む',
    'catalog.filter.option': '{label}（{count}）',
    'catalog.filter.status': '{label}の{count}件を表示しています。',
    'catalog.filter.all': 'すべて',
    'catalog.filter.substitution': '換字',
    'catalog.filter.transposition': '転置',
    'catalog.filter.product': '混合',
    'catalog.filter.other': 'その他',
    'catalog.filter.tools': '解く・学ぶ',
    'catalog.sub.mono': '単一換字',
    'catalog.sub.poly': '多表式',
    'catalog.sub.polygraphic': '多字換字',
    'catalog.sub.transposition': '転置',
    'catalog.sub.concealment': '分置式',
    'catalog.tool': 'Day{day} {title}',
    'catalog.newTab': '（新しいタブで開きます）',

    // クイズ
    'quiz.progress': '問題 {n} / {total}（正解 {score}）・{cat}',
    'quiz.cat.definition': '定義',
    'quiz.cat.basic': '基礎',
    'quiz.cat.classification': '分類',
    'quiz.cat.invariant': '性質',
    'quiz.cat.mixed': '混合',
    'quiz.review.title': '見直し（間違えた問題）',
    'quiz.review.none': '全問正解でした。',
    'quiz.review.yours': '選んだ答え：{answer}',
    'quiz.review.correct': '正解：{answer}',
    'quiz.next': '次へ',
    'quiz.finish': '結果を見る',
    'quiz.correct': '正解',
    'quiz.incorrect': '不正解',
    'quiz.answerIs': '正解は「{answer}」',
    'quiz.mark.correct': '（正解）',
    'quiz.mark.chosen': '（選んだ答え）',
    'quiz.result': '最終結果：{total}問中{score}問正解（{percent}%）',
    'quiz.retry': 'もう一度挑戦',
    'quiz.grade.low': 'もう一歩。「概念」タブの図に戻り、「線＝対応」「ブロック＝並べ替え」を確かめよう。',
    'quiz.grade.mid': '理解は順調。「古典暗号の例」タブのリンク先で、鍵の正体（対応表か並べ替えか）を体験しよう。',
    'quiz.grade.high': '合格。古典暗号は「換字と転置、その組み合わせ」で整理できる。',
    'quiz.error.load': 'クイズの問題を読み込めませんでした（{detail}）',
    'quiz.error.empty': '問題がありません',
    'quiz.error.field': '{n}問目の {field}',
  };

  const en = {
    // 換字（マッピング）
    'map.kind.shift': 'shift {offset}',
    'map.kind.random': 'random table',
    'map.key': 'Table ({kind}): {pairs}',
    'map.pair': '{from}→{to}',
    'map.figure': 'Diagram of lines connecting the plaintext letters A to H (top) with the ciphertext letters (bottom). {pairs}',
    'map.inverse': 'Inverse table (used to decrypt): {pairs}',
    'map.count': 'There are {n}! = {total} one-to-one tables for {n} letters. Shifts are only {n} of them.',
    'map.charset.letters': 'Ciphertext letters: A to H',
    'map.charset.numbers': 'Ciphertext letters: 1 to 8',

    // 転置（シャッフル）
    'shuffle.now': 'Current order: {word}',
    'shuffle.block': '{ch} (originally {from}, now {to})',
    'shuffle.key': 'Reordering key (position i takes original letter number): {order}',
    'shuffle.inverse': 'Key to restore (original position i takes current letter number): {order}',
    'shuffle.count': '{word} ({n} different letters) can be arranged in {n}! = {total} ways.',
    'shuffle.grabbed': 'Picked up {ch}, now at position {pos}. Move it with the arrow keys and press Space to drop it. Press Escape to cancel.',
    'shuffle.moved': '{ch}: position {pos}',
    'shuffle.dropped': 'Dropped {ch} at position {pos}. Current order: {word}',
    'shuffle.cancelled': 'Cancelled. Current order: {word}',
    'shuffle.changed': 'Reordered. Current order: {word}',

    // 実験室
    'lab.count': '{letters} letters (input {chars} characters, limit {max})',
    'lab.empty': 'Enter English text that contains letters (A to Z).',
    'lab.more': '… ({n} more letters)',
    'lab.none': 'none',
    'lab.error.shift': 'Enter a shift between 1 and 25.',
    'lab.error.rails': 'Enter a number of rails between 2 and 10.',
    'lab.error.keyEmpty': 'Enter a keyword (key).',
    'lab.error.keyChars': 'Use only letters (A to Z) for the keyword (key).',
    'lab.error.keyShort': 'The keyword needs at least {min} letters.',
    'lab.error.keyLong': 'The keyword (key) can have up to {max} letters.',
    'lab.key.sub': 'Substitution table: plaintext {plain} → ciphertext {cipher}',
    'lab.key.vig': 'Key: {key} (each key letter selects a different shift, used in turn)',
    'lab.key.trans': 'Reordering (ciphertext letter i comes from plaintext letter number): {order}',
    'lab.row.counts': 'Count of each letter (top 3)',
    'lab.row.profile': 'Counts sorted in descending order (top 5)',
    'lab.row.pattern': 'Pattern of repeated letters',
    'lab.row.ic': 'Index of coincidence (IC)',
    'lab.row.chi': 'Chi-squared against English',
    'lab.kept.yes': '✓ Same',
    'lab.kept.no': '✗ Changed',
    'lab.explain.substitution': 'A simple substitution always turns the same letter into the same letter, so the pattern of repeated letters '
      + 'and the counts sorted in descending order are preserved. The letters themselves change, so the count of each letter '
      + '(which letter is frequent) changes.',
    'lab.explain.transposition': 'A transposition does not change the letters, so the count of each letter is preserved and the chi-squared '
      + 'against English stays the same as the plaintext. The positions change, so the pattern of repeated letters is broken.',
    'lab.explain.polyalphabetic': 'A polyalphabetic cipher uses a different table at each position, so the same letter can become different letters. '
      + 'The counts are flattened and the index of coincidence (IC) drops. None of the properties is preserved.',
    'lab.bars.plain': 'Plaintext',
    'lab.bars.cipher': 'Ciphertext',
    'lab.bars.tip': '{ch}: {c}',
    'lab.bars.aria': 'Bar chart of letter counts in the {label}. Most frequent: {top}',
    'lab.count.letter': 'Letter',
    'lab.count.plain': 'Plaintext',
    'lab.count.cipher': 'Ciphertext',
    'lab.result': 'Result',
    'mix.same': '✓ Both orders give the same result.',
    'mix.diff': '✗ The two orders give different results (from letter {pos}).',
    'mix.note.profileKept': 'The counts sorted in descending order are still the same as the plaintext. Combining a simple substitution '
      + 'with a transposition does not break the shape of the frequencies. Ciphers that avoid this weakness include ADFGVX, '
      + 'which splits each letter into two before transposing, and SPN (Day094), which repeats substitution and permutation with key mixing.',
    'mix.note.profileBroken': 'The counts sorted in descending order also changed. With a polyalphabetic cipher, whose table changes '
      + 'with the position, the result depends on the order and the shape of the frequencies is broken.',

    // 見分ける
    'detect.count': '{letters} letters (at least {min} are needed)',
    'detect.empty': 'Enter a ciphertext or press one of the example buttons.',
    'detect.kind.short': 'Too few letters to tell.',
    'detect.kind.transposition': 'Likely a transposition (the letter frequencies match ordinary English; plain English text gives the same result)',
    'detect.kind.mono': 'Likely a simple substitution (as skewed as English, but different letters are frequent)',
    'detect.kind.poly': 'Likely a polyalphabetic cipher or similar, whose table changes with the position (the frequencies are flattened)',
    'detect.step.n': 'Letters: {n} (at least {min} are used)',
    'detect.step.chiLow': 'Chi-squared against English: {chi} (below {max} = close to ordinary English) → transposition',
    'detect.step.chiHigh': 'Chi-squared against English: {chi} ({max} or more = unlike ordinary English) → letters are substituted',
    'detect.step.icHigh': 'Index of coincidence (IC): {ic} ({min} or more = strongly skewed) → simple substitution',
    'detect.step.icLow': 'Index of coincidence (IC): {ic} (below {min} = flattened) → polyalphabetic or similar',
    'detect.top': 'Most frequent letters: {letters}',
    'detect.caution': 'The result can be wrong for short texts, non-English plaintexts, and ciphers that combine substitution '
      + 'and transposition (they look like a simple substitution). Treat the result as a likelihood.',
    'detect.link.name': '{title} (Day{day})',
    'detect.link.withText': 'opens with the ciphertext',
    'detect.link.page': 'opens the page (paste the ciphertext)',
    'detect.method': 'The thresholds (transposition below chi-squared {chi}; simple substitution at IC {ic} or more) were chosen '
      + 'on English text from {train}. The table shows accuracy measured on text from another book ({test}), '
      + '3 cipher types × {per} samples per length. Transposition is a columnar transposition with a 5 to 9 letter keyword, '
      + 'simple substitution uses a random table, and polyalphabetic is a Vigenère cipher with a 3 to 8 letter key.',
    'detect.book': 'Project Gutenberg #{ebook} “{title}”',
    'detect.acc.length': 'Length',
    'detect.acc.transposition': 'Transposition',
    'detect.acc.mono': 'Simple substitution',
    'detect.acc.poly': 'Polyalphabetic',
    'detect.acc.letters': '{n} letters',
    'detect.limits': 'A Vigenère cipher with a short key keeps some skew and may be reported as a simple substitution. '
      + 'Other languages, ciphers made of digits or symbols, and polygraphic ciphers such as Playfair are outside this table. '
      + 'For a detailed estimate, use Cipher Clairvoyance (Day044).',

    // 配色と言語
    'theme.label': 'Dark mode',
    'lang.switch': '日本語',
    'list.sep': ', ',

    // 古典暗号の例
    'catalog.kind.substitution': '🔤 Substitution ciphers',
    'catalog.kind.substitution.desc': 'Methods that map each letter to another letter or symbol (mapping). {count} tools',
    'catalog.kind.transposition': '🔀 Transposition ciphers',
    'catalog.kind.transposition.desc': 'Methods that keep the letters and reorder their positions (shuffle). {count} tools',
    'catalog.kind.product': '🧩 Product (substitution + transposition)',
    'catalog.kind.product.desc': 'Methods that combine and repeat substitution and transposition. {count} tool(s)',
    'catalog.kind.other': '🔍 Others',
    'catalog.kind.other.desc': 'Neither substitution nor transposition: hiding a message inside a text, '
      + 'or codes that replace words with symbols. {count} tools',
    'catalog.kind.tools': '🛠️ Solve, analyze, learn',
    'catalog.kind.tools.desc': 'Tools that analyze and solve ciphertexts, and tools for learning cipher properties. {count} tools',
    'catalog.sub.product': 'Product',
    'catalog.sub.code': 'Code',
    'catalog.sub.analysis': 'Analysis',
    'catalog.sub.study': 'Learning',
    'catalog.filter.legend': 'Filter by category',
    'catalog.filter.option': '{label} ({count})',
    'catalog.filter.status': 'Showing {count} tools in {label}.',
    'catalog.filter.all': 'All',
    'catalog.filter.substitution': 'Substitution',
    'catalog.filter.transposition': 'Transposition',
    'catalog.filter.product': 'Product',
    'catalog.filter.other': 'Others',
    'catalog.filter.tools': 'Solve & learn',
    'catalog.sub.mono': 'Simple substitution',
    'catalog.sub.poly': 'Polyalphabetic',
    'catalog.sub.polygraphic': 'Polygraphic',
    'catalog.sub.transposition': 'Transposition',
    'catalog.sub.concealment': 'Concealment',
    'catalog.tool': 'Day{day} {title}',
    'catalog.newTab': ' (opens in a new tab)',

    // クイズ
    'quiz.progress': 'Question {n} / {total} ({score} correct) · {cat}',
    'quiz.cat.definition': 'Definition',
    'quiz.cat.basic': 'Basics',
    'quiz.cat.classification': 'Classification',
    'quiz.cat.invariant': 'Properties',
    'quiz.cat.mixed': 'Mixed',
    'quiz.review.title': 'Review (questions you missed)',
    'quiz.review.none': 'All answers were correct.',
    'quiz.review.yours': 'Your answer: {answer}',
    'quiz.review.correct': 'Correct answer: {answer}',
    'quiz.next': 'Next',
    'quiz.finish': 'See results',
    'quiz.correct': 'Correct',
    'quiz.incorrect': 'Incorrect',
    'quiz.answerIs': 'The answer is “{answer}”',
    'quiz.mark.correct': '(correct)',
    'quiz.mark.chosen': '(your answer)',
    'quiz.result': 'Result: {score} of {total} correct ({percent}%)',
    'quiz.retry': 'Try again',
    'quiz.grade.low': 'Almost there. Go back to the diagrams in the Concepts tab and check “lines = mapping” and “blocks = reordering”.',
    'quiz.grade.mid': 'Good progress. Try the tools in the Classical Ciphers tab and see what the key is (a table or a reordering).',
    'quiz.grade.high': 'Well done. Classical ciphers can be organized as substitution, transposition, and their combinations.',
    'quiz.error.load': 'Could not load the quiz questions ({detail})',
    'quiz.error.empty': 'No questions',
    'quiz.error.field': 'question {n}: {field}',
  };

  const dict = { ja, en };
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
