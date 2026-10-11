/* ============================================================================
 * Classical Cipher Structure Trainer - クイズの問題（20問）
 * ============================================================================
 *
 * fetch で JSON を読むと file:// で開いたときに動かないので、スクリプトとして読む。
 * 形式: id（q001〜）、category（definition｜basic｜classification｜invariant｜mixed）、prompt、
 *       choices（2〜6個、重複なし）、answer（正解の添字、0始まり）、explanation（解説）
 * 中身の検査は計算部の validateQuiz と test/quiz.test.js が行う。
 * ブラウザーでは window.QuizData、Node では require() で読む。
 * ============================================================================ */
(function (root) {
  'use strict';

  // 分類の4問は選択肢をそろえ、4つとも一度は正解になるようにする
  const KINDS = ['換字式（単一換字）', '換字式（多表式）', '転置式', '混合（換字＋転置）'];

  const ja = [
    {
      id: 'q001',
      category: 'definition',
      prompt: '文字を別の文字に対応づけて置き換える方式はどれ？',
      choices: ['Transposition（転置）', 'Substitution（換字）', 'Compression（圧縮）', 'Steganography（ステガノグラフィー）'],
      answer: 1,
      explanation: '換字＝マッピング。鍵は対応表（置換表）。対応表は「文字の種類」の並べ替え（順列）でもあり、'
        + '「位置」を並べ替える転置の鍵と同じ形をしている。',
    },
    {
      id: 'q002',
      category: 'definition',
      prompt: '文字そのものは変えずに、並び順だけを入れ替える方式はどれ？',
      choices: ['Substitution（換字）', 'Encoding（符号化）', 'Hashing（ハッシュ）', 'Transposition（転置）'],
      answer: 3,
      explanation: '転置＝シャッフル。鍵は並べ替え方（順列）。使われる文字とその個数は平文と同じまま。',
    },
    {
      id: 'q003',
      category: 'basic',
      prompt: '換字式暗号の「鍵」の本質に最も近い説明はどれ？',
      choices: ['乱数の列', '巨大な素数の積', '対応表（どの文字を何に置き換えるか）', '時間とともに増えるカウンター'],
      answer: 2,
      explanation: '換字は対応表そのものが鍵。シーザー暗号のずらし量も、対応表を1つ決めるための数である。',
    },
    {
      id: 'q004',
      category: 'basic',
      prompt: '転置式暗号の「鍵」の本質に最も近い説明はどれ？',
      choices: ['並べ替え方（順列）', '画像の解像度', '鍵長（ビット長）', 'CRCの多項式'],
      answer: 0,
      explanation: '転置は文字の位置だけを変える。何番目の文字をどこへ置くかという順列が鍵。',
    },
    {
      id: 'q005',
      category: 'classification',
      prompt: 'シーザー暗号はどれに分類される？',
      choices: KINDS,
      answer: 0,
      explanation: '全部の文字を同じ量だけずらす対応表を1つ使う＝単一換字。ずらし量は26通り（A〜Hなら8通り）しかない。',
    },
    {
      id: 'q006',
      category: 'classification',
      prompt: 'ヴィジュネル暗号はどれに分類される？',
      choices: KINDS,
      answer: 1,
      explanation: '鍵の文字ごとに別のシフトの対応表を順に使う＝多表式の換字。同じ平文の文字でも位置によって別の文字になる。',
    },
    {
      id: 'q007',
      category: 'classification',
      prompt: 'レールフェンス暗号はどれに分類される？',
      choices: KINDS,
      answer: 2,
      explanation: '文字をジグザグに書いて行ごとに読むだけで、文字そのものは変えない＝転置。',
    },
    {
      id: 'q008',
      category: 'classification',
      prompt: '第一次世界大戦のADFGVX暗号は、表で文字を2文字の組に置き換えたあと、縦列転置で並べ替える。どれに分類される？',
      choices: KINDS,
      answer: 3,
      explanation: '換字のあとに転置を重ねる＝混合（換字式と転置式の併用）。1文字を2つに分けてから並べ替えるので、'
        + '単一換字と転置を単に重ねたときに残る「文字の頻度の形」も崩れる。',
    },
    {
      id: 'q009',
      category: 'mixed',
      prompt: '平文と暗号文を見比べると、使われている文字と各文字の個数がまったく同じで、並びだけが違った。考えられるのは？',
      choices: ['換字', '混合（換字＋転置）', 'どちらでもない', '転置'],
      answer: 3,
      explanation: '文字の種類と個数が変わらない＝アナグラムの関係＝転置。換字なら文字そのものが変わる。',
    },
    {
      id: 'q010',
      category: 'mixed',
      prompt: '英文の暗号文を数えると、E・T・A が多いなど、文字の出現回数が普通の英語とほぼ同じだった。平文は手元にない。考えられるのは？',
      choices: ['単一換字', '多表式の換字', '転置', 'どれとも言えない'],
      answer: 2,
      explanation: '転置は文字の頻度をそのまま保つ（Shannon 1949）。単一換字なら多い順の形は残るが、多い文字が E・T・A ではなくなる。'
        + '多表式なら頻度がならされる。',
    },
    {
      id: 'q011',
      category: 'classification',
      prompt: 'ジグザグ暗号（Day072）は、文字を鍵の列の位置に置き換えて、その位置を折れ線で結ぶ。どれに分類される？',
      choices: KINDS,
      answer: 0,
      explanation: '文字ごとに位置（記号）を1つ決めて置き換えるので単一換字の一種。英語のzigzag cipherはレールフェンス暗号（転置）の別名なので、名前で分類しない。',
    },
    {
      id: 'q012',
      category: 'classification',
      prompt: 'プレイフェア暗号は、5×5の表で2文字をまとめて別の2文字に置き換える。どれに分類される？',
      choices: ['換字式（単一換字）', '換字式（多字換字）', '転置式', '混合（換字＋転置）'],
      answer: 1,
      explanation: '複数の文字をまとめて置き換えるので多字換字。位置ごとに対応表を変える多表式（ヴィジュネル暗号など）とは別の分け方である。',
    },
    {
      id: 'q013',
      category: 'invariant',
      prompt: '転置した暗号文で、平文と変わらないものはどれ？',
      choices: ['文字ごとの出現回数', '同じ文字が現れる位置の型', '文字の並び', 'どれも変わる'],
      answer: 0,
      explanation: '転置は文字そのものを変えないので、どの文字が何回出るかは平文と同じ。位置が変わるので、並びと位置の型は崩れる。',
    },
    {
      id: 'q014',
      category: 'invariant',
      prompt: '単一換字の暗号文で、平文と変わらないものはどれ？',
      choices: ['どの文字が多いか（Eが多いなど）', '同じ文字が現れる位置の型（HELLOのLLなど）', '文字そのもの', 'どれも変わる'],
      answer: 1,
      explanation: '同じ文字は必ず同じ文字になるので、繰り返しの型（HELLOとKHOORはどちらも3・4文字目が同じ）が残る。どの文字が多いかは入れ替わる。',
    },
    {
      id: 'q015',
      category: 'invariant',
      prompt: 'ヴィジュネル暗号の暗号文の一致指数（IC）は、ふつう平文の英語と比べてどうなる？',
      choices: ['高くなる', 'ほぼ同じ', '低くなる', '0になる'],
      answer: 2,
      explanation: '位置ごとに別の対応表を使うので、文字の頻度がならされ、ICが下がる。単一換字と転置では、ICは平文と同じまま。',
    },
    {
      id: 'q016',
      category: 'mixed',
      prompt: '同じ単一換字と同じ転置を、「換字→転置」と「転置→換字」の2つの順番で掛けた。結果はどうなる？',
      choices: ['同じになる', '必ず違う', '文字数が変わる', '平文に戻る'],
      answer: 0,
      explanation: '単一換字は文字だけ、転置は位置だけを変えるので、順番を入れ替えても結果は同じ（Shannon 1949）。重ねても頻度の形は残る。',
    },
    {
      id: 'q017',
      category: 'mixed',
      prompt: 'ヴィジュネル暗号と転置で、掛ける順番を入れ替えるとどうなる？',
      choices: ['必ず同じになる', '文字数が変わる', '平文に戻る', '一般には違う結果になる'],
      answer: 3,
      explanation: 'ヴィジュネル暗号はどの位置の文字に鍵のどの文字を使うかで結果が決まるので、先に位置を動かすと別の結果になる。実験室の「重ねる」で確かめられる。',
    },
    {
      id: 'q018',
      category: 'basic',
      prompt: 'A〜Hの8文字の一対一の対応表（換字の鍵）は、全部で何通り？',
      choices: ['8通り', '64通り', '40,320通り', '16,777,216通り'],
      answer: 2,
      explanation: '8! = 40,320通り。シフトだけならそのうち8通り。16,777,216は8の8乗で、同じ文字に重ねて写す（一対一でない）対応も数えた数。',
    },
    {
      id: 'q019',
      category: 'basic',
      prompt: '英字26文字の単一換字は鍵が26!（約4×10の26乗）通りもある。それでも古くから解かれてきた理由は？',
      choices: ['鍵がいつも短いから', '文字の頻度の偏りがそのまま残るから', '暗号文が平文より長いから', '数字を使わないから'],
      answer: 1,
      explanation: '鍵の数が多くても、頻度の形と位置の型が残るので、総当たりせずに頻度分析で解ける。鍵の数と安全性は別の話である。',
    },
    {
      id: 'q020',
      category: 'definition',
      prompt: '「置換」という語について正しいのはどれ？',
      choices: ['換字の意味でしか使わない', '転置の意味でしか使わない', '換字（文字の置き換え）にも、数学の置換（並べ替え）にも使われる', '暗号では使わない'],
      answer: 2,
      explanation: 'どちらの意味にも使われる。換字の対応表も文字の種類の並べ替え（順列）なので、換字は「文字の種類」、転置は「文字の位置」の置換と考えると区別できる。',
    },
  ];

  const api = { ja };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QuizData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
