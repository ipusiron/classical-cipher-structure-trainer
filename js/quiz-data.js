/* ============================================================================
 * Classical Cipher Structure Trainer - クイズの問題（10問）
 * ============================================================================
 *
 * fetch で JSON を読むと file:// で開いたときに動かないので、スクリプトとして読む。
 * 形式: id（q001〜）、category（definition｜basic｜classification｜mixed）、prompt、
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
      choices: ['Substitution（換字）', 'Transposition（転置）', 'Encoding（符号化）', 'Hashing（ハッシュ）'],
      answer: 1,
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
      choices: ['換字', '転置', '混合（換字＋転置）', 'どちらでもない'],
      answer: 1,
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
  ];

  const api = { ja };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QuizData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
