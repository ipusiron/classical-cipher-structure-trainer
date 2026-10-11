// ============================================================================
// 見分け（LabCore.classify）のしきい値を決め、当たり具合を測る
// ============================================================================
//
// 使い方: node tools/eval-classify.js <学習用の英文> <評価用の英文> [出力JSON]
//   例: node tools/eval-classify.js pg1342.txt pg98.txt tools/eval-classify-result.json
// 英文は Project Gutenberg のテキスト（*** START と *** END の間を使う）。英文そのものは同梱しない。
// 1. 学習用の英文で文字を数え、js/english-freq.js の回数と同じかを確かめる
// 2. 学習用の英文から 100 字の抜き出しを 3 種類×300 件作り、正答率の平均が最大になるしきい値を探す
// 3. 評価用の英文（別の本）で、長さ 50・100・200・400 字ごとに 3 種類×300 件の正答率を測る
// 乱数は種つき（mulberry32）。同じ英文なら毎回同じ結果になる。
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Core = require('../js/structure-core.js');
const L = require('../js/lab-core.js');
const EF = require('../js/english-freq.js');

const SEED = 97;
const PER_CLASS = 300;
const TRAIN_LENGTH = 100;
const EVAL_LENGTHS = [50, 100, 200, 400];
const CHI_GRID = Array.from({ length: 33 }, (_, i) => 40 + i * 5);           // 40〜200
const IC_GRID = Array.from({ length: 21 }, (_, i) => +(0.045 + i * 0.001).toFixed(3)); // 0.045〜0.065
const KINDS = ['transposition', 'mono', 'poly'];

function body(file) {
  const t = fs.readFileSync(file, 'utf8');
  const a = t.indexOf('*** START');
  const b = t.indexOf('*** END');
  if (a < 0 || b < 0) throw new Error(`${file}: Gutenberg の START/END が見つからない`);
  return L.letters(t.slice(t.indexOf('\n', a), b));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  };
}

/** 抜き出しと暗号化の組を作る（種つき） */
function samples(text, length, seed) {
  const next = mulberry32(seed);
  const fill = buf => { for (let i = 0; i < buf.length; i++) buf[i] = next(); };
  const int = n => Core.randomInt(n, fill);
  const word = len => Array.from({ length: len }, () => L.ALPHABET[int(26)]).join('');
  const out = [];
  for (let s = 0; s < PER_CLASS; s++) {
    for (const kind of KINDS) {
      const off = int(text.length - length);
      const plain = text.slice(off, off + length);
      let cipher;
      if (kind === 'transposition') cipher = L.apply(plain, { type: 'columnar', key: word(5 + int(5)) });
      else if (kind === 'mono') cipher = L.apply(plain, { type: 'map', map: L.randomKey(fill) });
      else cipher = L.apply(plain, { type: 'vigenere', key: word(3 + int(6)) });
      out.push({ kind, cipher });
    }
  }
  return out;
}

function accuracy(set, th) {
  const hit = Object.fromEntries(KINDS.map(k => [k, 0]));
  for (const { kind, cipher } of set) if (L.classify(cipher, EF.FREQ, th).kind === kind) hit[kind]++;
  const acc = Object.fromEntries(KINDS.map(k => [k, +(hit[k] / PER_CLASS * 100).toFixed(1)]));
  acc.mean = +((KINDS.reduce((a, k) => a + hit[k], 0) / (PER_CLASS * 3)) * 100).toFixed(1);
  return acc;
}

function main() {
  const [trainFile, testFile, outFile] = process.argv.slice(2);
  if (!trainFile || !testFile) {
    console.error('使い方: node tools/eval-classify.js <学習用の英文> <評価用の英文> [出力JSON]');
    process.exit(2);
  }
  const train = body(trainFile);
  const test = body(testFile);
  const counts = L.counts(train);
  if (counts.join() !== EF.COUNTS.join()) throw new Error('学習用の英文の文字数が js/english-freq.js と違う');

  const trainSet = samples(train, TRAIN_LENGTH, SEED);
  let best = null;
  for (const chiMax of CHI_GRID) {
    for (const icMin of IC_GRID) {
      const acc = accuracy(trainSet, { chiMax, icMin });
      if (!best || acc.mean > best.acc.mean) best = { th: { chiMax, icMin }, acc };
    }
  }
  const evaluation = {};
  for (const len of EVAL_LENGTHS) evaluation[len] = accuracy(samples(test, len, SEED + len), best.th);

  const result = {
    seed: SEED,
    perClass: PER_CLASS,
    train: { file: path.basename(trainFile), letters: train.length, length: TRAIN_LENGTH, accuracy: best.acc },
    test: { file: path.basename(testFile), letters: test.length },
    classes: {
      transposition: 'columnar transposition, random keyword of 5-9 letters',
      mono: 'simple substitution, uniformly random key',
      poly: 'Vigenere, random keyword of 3-8 letters',
    },
    thresholds: best.th,
    evaluation,
  };
  const json = `${JSON.stringify(result, null, 2)}\n`;
  if (outFile) fs.writeFileSync(outFile, json);
  process.stdout.write(json);
}

main();
