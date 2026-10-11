# Technical Documentation

本ドキュメントでは、Classical Cipher Structure Trainerの実装の詳細と設計の理由を、開発者向けに説明します。

---

## 📋 目次

1. [ファイルの役割](#1-ファイルの役割)
2. [換字と転置を順列として持つ](#2-換字と転置を順列として持つ)
3. [対応図をSVGで描く](#3-対応図をsvgで描く)
4. [乱数と一様な順列](#4-乱数と一様な順列)
5. [並べ替え（ポインターとキーボード）](#5-並べ替えポインターとキーボード)
6. [逆順と偶奇入れ替え](#6-逆順と偶奇入れ替え)
7. [クイズ](#7-クイズ)
8. [古典暗号の例](#8-古典暗号の例)
8a. [実験室](#8a-実験室)
8b. [見分ける](#8b-見分ける)
9. [セキュリティ対策](#9-セキュリティ対策)
10. [レスポンシブ・アクセシビリティ・配色](#10-レスポンシブアクセシビリティ配色)
11. [テスト](#11-テスト)

---

## 1. ファイルの役割

| ファイル | 役割 |
|------|------|
| `js/structure-core.js` | 計算部。DOMに依存しない純粋関数（対応表・順列・乱数・図の配置・差し込み位置・クイズの検査） |
| `js/messages.js` | `script.js`が組み立てる文言の辞書（日本語と英語）。キーで引き、`{name}`の置き場所を埋める |
| `js/lab-core.js` | 実験室の計算部（単一換字・ヴィジュネル・転置3種・統計・保たれるもの・順番の入れ替え・見分け） |
| `js/english-freq.js` | 英語の文字の出現回数（Project Gutenberg #1342のA〜Z） |
| `js/classify-accuracy.js` | 見分けの当たり具合（`tools/eval-classify.js`が書き出す。手で直さない） |
| `js/quiz-data.js` | クイズの20問 |
| `js/catalog.js` | 古典暗号の例のツール42本の一覧 |
| `js/theme.js` | 配色。`<head>`で読み、描画の前に`<html data-theme>`を決める |
| `js/i18n.js` | 日英の切り替え。index.htmlの日本語を控えて入れ替える |
| `js/i18n-en.js` | index.htmlの日本語の原文をキーにした英語の対応表 |
| `script.js` | 画面の処理（タブ・対応図・並べ替え・実験室・見分ける・カード・クイズ） |
| `tools/eval-classify.js` | 見分けのしきい値を決め、当たり具合を測る（英文は同梱しない） |

`js/`のファイルは、ブラウザーでは`window.StructureCore`などのグローバルに、Node.jsでは`require()`で読める形にしています（`module.exports`の有無で切り替える）。ES Moduleにしないのは、`index.html`をファイルから直接開いたとき（`file://`）にも動かすためです。同じ理由で、クイズの問題は`fetch`でJSONを読まず、スクリプトとして読みます。

---

## 2. 換字と転置を順列として持つ

換字の鍵も転置の鍵も、0から始まる番号の順列で持ちます。

| 鍵 | 意味 | 例 |
|------|------|------|
| 換字の対応表`map` | 上段のi番目の文字を、下段の`map[i]`番目の文字へ対応させる | シフト5は`[5, 6, 7, 0, 1, 2, 3, 4]`（A→F … H→E） |
| 転置の並び`order` | 並べ替えたあとのi番目に、元の`order[i]`番目の文字を置く（取り出す向き） | EDUCATIONを逆順にすると`[8, 7, …, 0]`で`NOITACUDE` |

Shannonの1949年の論文も、単一換字の鍵を「アルファベットの置換」、転置の鍵を「最初のd個の整数の置換」と書いています（Bell System Technical Journal 28, p.665〜666）。換字は文字の種類を、転置は文字の位置を並べ替える順列だと見ると、2つを同じ関数で扱えます。

```javascript
// js/structure-core.js（抜粋）
function shiftMap(n, offset) {
  return Array.from({ length: n }, (_, i) => mod(i + offset, n));
}
function substitute(text, from, to, map) {   // 換字
  const index = new Map(from.map((ch, i) => [ch, i]));
  return Array.from(String(text), ch => (index.has(ch) ? to[map[index.get(ch)]] : ch)).join('');
}
function applyOrder(items, order) {          // 転置（取り出す向き）
  return order.map(i => items[i]);
}
```

逆の順列`invert(p)`を掛けると、どちらも元に戻ります（テストで往復を確かめています）。転置の向きは、Permutation CipherLab（Day095）の既定と同じ「取り出す向き」です。

---

## 3. 対応図をSVGで描く

対応図は、セルの四角・文字・線をすべて1つのSVGに描きます。配置は計算部の`figureLayout(8)`が決め、`viewBox="0 0 356 172"`の座標で返します。

- 上段と下段は常に1行8文字である。画面の幅に合わせて拡大・縮小されるだけで、折り返さない（幅320pxで文字の高さ約12px）。
- 画面の寸法（`getBoundingClientRect`）を測らないので、非表示のタブの中で幅が変わっても図は変わらない。リサイズのたびに描き直す処理も要らない。
- 線は上段のセルの下端から下段のセルの上端へ向かう3次ベジェ曲線（`curvePath`）で、制御点を上下の中間の高さに置いてS字にする。
- 図の中身は、図の下に「対応表（シフト5）：A→F B→G …」と文字でも示す。SVGは`role="img"`で、同じ内容を説明として読み上げる。

---

## 4. 乱数と一様な順列

「ランダムに対応させる」「ランダムに並べ替え」は、`crypto.getRandomValues`の32ビットの乱数から一様な順列を作ります。

```javascript
// js/structure-core.js（抜粋）
function randomInt(bound, fill) {
  const limit = Math.floor(0x100000000 / bound) * bound;   // 2^32 を割り切れない端は捨てる
  const buf = new Uint32Array(1);
  for (;;) {
    fill(buf);
    if (buf[0] < limit) return buf[0] % bound;
  }
}
function randomPermutation(n, fill) {                        // Fisher–Yates
  const p = identity(n);
  for (let i = n - 1; i > 0; i--) {
    const j = randomInt(i + 1, fill);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}
```

- `sort(() => Math.random() - 0.5)`のような並べ替えは、すべての順列が同じ確率にならない。Fisher–Yatesは、各段で残りから一様に1つ選ぶので、n!通りが同じ確率になる。
- `乱数 % bound`だけだと、2^32をboundで割り切れない分だけ小さい値が出やすくなる。端を捨てて引き直す（棄却法）。
- テストでは、3文字の順列を60,000回作り、6通りの回数をカイ二乗で検定している（自由度5、p=0.001の値20.52未満）。

---

## 5. 並べ替え（ポインターとキーボード）

### 状態と描画

並べ替えの状態は`shuffle.order`（転置の並び）だけで持ちます。ドラッグ・キー操作・ボタンはどれも`order`を変え、`renderShuffle()`が`order`のとおりに`<li>`を並べ直します。並べ直しで外れたフォーカスは、元の要素へ戻します。

### ポインター（マウス・タッチ・ペン）

Pointer Eventsで3つを共通に扱います。

- `pointerdown`で、ブロックではなく並べ替えの枠（`<ol>`）に`setPointerCapture`する。ブロックの`<li>`は並べ直しで移動するので、ブロックに捕捉を置くと外れるためである。
- 6px以上動いたらドラッグとみなし、残りのブロックの矩形と指の位置から差し込み位置を計算する。
- ブロックには`touch-action: none`を付け、ブロックの上ではスクロールより並べ替えを優先する。枠の余白ではページをスクロールできる。

差し込み位置は計算部の`insertionIndex(boxes, x, y)`が決めます。

```javascript
// js/structure-core.js（要約）
// 1. 矩形の top が近いものを同じ行にまとめる（折り返し）
// 2. 指の y に最も近い行を選ぶ
// 3. その行の中で、中心が指の x より右にある最初の要素の前に入れる。なければ行の末尾
```

x座標だけで比べると、2段に折り返したとき、2段目の末尾に落としても1段目に入ってしまいます。行を先に決めることで、狭い画面でも指を離した位置に入ります（幅390pxの配置をテストに入れています）。

### キーボード

- ブロックはrovingの`tabindex`（1つだけ0）で、Tabで並べ替えの枠に入り、←→・Home・Endでフォーカスを動かす。
- Space（またはEnter）で持ち上げ、←→・Home・Endでそのブロックを動かし、もう一度Spaceで置く。Escで持ち上げる前の並びに戻す。持ち上げたままTabで出ると、その場に置く。
- 動かした結果は`aria-live`の領域で知らせる（例「Dを4番目に置きました。いまの並び：EUCDATION」）。
- 非推奨の`aria-grabbed`は使わず、持ち上げている状態は`aria-pressed`で示す。

---

## 6. 逆順と偶奇入れ替え

「逆順にする」「偶奇を入れ替え」は、いまの並び（`order`）に掛けます。

| 操作 | 1回目 | 2回目 |
|------|------|------|
| 偶奇を入れ替え（1・2番目、3・4番目…を交換） | EDUCATION → DECUTAOIN | DECUTAOIN → EDUCATION |
| 逆順にする | EDUCATION → NOITACUDE | NOITACUDE → EDUCATION |

どちらも同じ操作を2回掛けると元に戻る対合（involution）です。奇数個のとき、偶奇入れ替えの最後の1文字は動きません。テストでは、ランダムな並びに2回掛けて元に戻ることを確かめています。

---

## 7. クイズ

- 問題は`js/quiz-data.js`に置き、表示の前に`validateQuiz`で形を確かめる（idの形と重複、区分、問題文、2〜6個の重複のない選択肢、正解の添字、解説）。誤りがあれば、何問目のどの項目かを画面に出す。
- 20問を定義・基礎・分類・性質・混合の5区分に分け、正解の位置を4つに5・5・6・4問ずつ分ける（毎回同じ位置を選んでも3割まで）。
- 「問題の順番と選択肢を混ぜる」をオンにすると、出題順と問題ごとの選択肢の並びを一様な順列（`randomPermutation`）で作る。選択肢のボタンは元の添字（`data-index`）を持ち、正誤はこの番号で決めるので、並びを混ぜても採点は変わらない。
- 答えを記録し、結果のあとに間違えた問題を、選んだ答え・正解・解説と並べて見直す。
- 答えると、正解の選択肢に「✓」と「（正解）」、選んだ不正解に「✗」と「（選んだ答え）」を付ける。色だけに頼らない。
- フィードバック（正解・不正解、不正解なら正解の選択肢、解説）は`aria-live`の領域に入れ、フォーカスを「次へ」へ移す。最後の問題のあとは結果の見出しへフォーカスを移す。
- 答えたあとの選択肢は`aria-disabled`にする（`disabled`にするとフォーカスが外れるため）。

---

## 8. 古典暗号の例

`js/catalog.js`の一覧（Day番号・リポジトリ名・READMEのtitle・分類・名前・説明）からカードを描きます。

- 換字式・転置式・混合・その他（分置式・コード）・解く道具と学ぶ道具の5区分に分け、換字式は単一換字・多表式・多字換字のタグで分ける。分類は各ツールのREADMEの説明に合わせる（ジグザグ暗号〈Day072〉は換字の一種、ヒル暗号〈Day093〉は多字換字）。
- 区分をラジオボタンで絞り込む。選んだ区分の節だけを見せ、件数を読み上げる（`aria-live`）。
- カード全体を押せるように、見出しのリンクの`::after`をカード全体に広げる。リンクの名前は暗号の名前だけにし、「新しいタブで開きます」を読み上げ用に添える。フォーカスの枠はカード（`:focus-within`）に出す。
- titleは、各ツールのREADMEのYAMLのtitleを写している。テストに期待値を持たせ、作業側のスクリプトで各READMEと照らし合わせている。

---

## 8a. 実験室

英文（A〜Zだけ。NFKCで全角を半角に寄せ、大文字にしてほかの文字を除く）に暗号を掛け、平文と比べます。

| 方式 | 計算部 | 鍵 |
|------|------|------|
| シフト | `shiftKey` | 1〜25 |
| キーワード換字表 | `keywordKey` | キーワードの文字（重複を除く）のあとに残りをAから並べる。ZEBRA→`ZEBRACDFGHIJKLMNOPQSTUVWXY` |
| ランダムな換字表 | `randomKey` | 一様な順列（作り直すまで同じ） |
| ヴィジュネル暗号 | `vigenere` | 鍵の文字のずらし量を順に使う |
| 逆順・レールフェンス・縦列転置 | `reverseOrder`・`railFenceOrder`・`columnarOrder` | 取り出す向きの順列を作って`applyOrder`で並べる |

- 縦列転置はColumnar CipherLab（Day043）の`readOrder`と、レールフェンスはRailFence CipherLab（Day034）の`encrypt`と、同じ結果になる（作業側で長さ0〜40、5つのキーワード・5つのレール数を全組で比べた）。既知解答はWikipediaの例（ZEBRASの縦列転置、3段のレールフェンス、LEMONのヴィジュネル暗号）
- `invariants(plain, cipher)`は、文字ごとの回数（`counts`）、多い順に並べた形（`profile`）、同じ文字が現れる位置の型（`pattern`。HELLO→0,1,2,2,3）が同じかを返す
- `commute(text, a, b)`は「a→b」と「b→a」の結果を比べる。単一換字（文字だけを変える）と転置（位置だけを変える）は入れ替えても同じ（Shannon 1949 p.672）。ヴィジュネル暗号は位置によって対応表が変わるので、転置と入れ替えると結果が変わる
- 棒グラフは26列のCSSグリッドで、棒の高さを`element.style.height`（CSSOMでの代入。style属性ではないのでCSPに触れない）で決める。平文と暗号文で縦の目盛り（最大値）をそろえる。同じ数値を表でも出す

---

## 8b. 見分ける

`classify(text, freq)`は、英字の数・英語の頻度とのカイ二乗・ICで判定します。

1. 英字が30文字未満なら`short`
2. カイ二乗が`chiMax`（115）未満なら`transposition`（転置は頻度を変えないので、普通の英語に近い）
3. それ以外は、ICが`icMin`（0.052）以上なら`mono`、未満なら`poly`

しきい値は`tools/eval-classify.js`で決めます。

- 学習：Project Gutenberg #1342の本文から、100文字の抜き出しを3種類（5〜9文字のキーワードの縦列転置・ランダムな換字表・3〜8文字の鍵のヴィジュネル暗号）×300件作り、カイ二乗40〜200（5刻み）とIC 0.045〜0.065（0.001刻み）の全組で正答率の平均が最も高い組を選ぶ
- 評価：別の本（#98）から50・100・200・400文字の抜き出しを3種類×300件作り、正答率を測る。乱数は種つき（mulberry32、種97）で、同じ英文なら同じ結果になる
- 結果は`js/classify-accuracy.js`に書き出し、画面とREADMEの表はここから作る。英文そのものは同梱しない（Project Gutenbergから取得して引数に渡す）

判定のあとに案内するツールは`HANDOFF`に持ちます。受け取り口のあるツールには`#text=`（IC Learning Visualizerは`#text=…&tab=advanced`）で暗号文を渡し、各ツールの上限を超えるとページだけを開きます。

---

## 9. セキュリティ対策

| 対策 | 内容 |
|------|------|
| CSP（meta要素） | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'` |
| インラインの禁止 | インラインのスクリプト・イベント属性・style属性を使わない（テストで検査） |
| DOMの組み立て | 文字は`textContent`、SVGは`createElementNS`と`setAttribute`で作る。`innerHTML`への代入はない |
| 外部リンク | `target="_blank" rel="noopener noreferrer"`。referrerは`no-referrer` |
| 通信 | 外部への通信はない（クイズもスクリプトとして読む）。ほかのツールへ暗号文を渡すときはURLの`#text=`（サーバーへ送られない） |
| 保存 | 配色の選択だけをlocalStorageに保存する。使えない環境では保存せずに切り替える |

meta要素のCSPでは`frame-ancestors`が無視され、GitHub Pagesでは応答ヘッダーを設定できません。そのため、クリックジャッキングへの対策はこのツールでは入れていません。

---

## 10. レスポンシブ・アクセシビリティ・配色

- タブはWAI-ARIA Authoring Practicesのタブで、`aria-selected`を更新し、←→・Home・Endで移る（選んだタブをすぐ表示する）。
- ボタン・タブ・ブロックの高さは44px以上である。
- 配色はCSS変数に集め、ライトとダークの値を持つ。ダークはOSの設定（`prefers-color-scheme`）に従い、右上のボタンで切り替えると`<html data-theme>`で上書きする。
- 文字と背景の組は4.5:1以上、枠・フォーカス・図の線は3:1以上で、`test/contrast.test.js`がライトとダークの両方を計算して確かめる。
- `prefers-reduced-motion: reduce`では、動きのある効果を止める。

### 日英の切り替え

- 初めの言語は、`?lang=ja`・`?lang=en`、保存した選択（localStorageの`ccst-lang`）、ブラウザーの言語（`ja`で始まれば日本語、それ以外は英語）の順で決める。
- index.htmlは日本語で書く。`script.js`が画面を描く前に、`I18n.collect`が本文の日本語のテキストノードと属性（aria-label・title・label）を控える。英語では`js/i18n-en.js`の対応表で入れ替え、日本語に戻すときは控えた原文に戻す。控えた時と同じ文字列の所だけを入れ替えるので、JavaScriptが書き換えた所は触らない（Permutation CipherLab〈Day095〉と同じ方式）。
- JavaScriptが描く部分は`messages.js`の`ja`・`en`の文言で描き直す。区切り記号（「・」と「, 」）も辞書に持つ。切り替えても計算はし直さない（実験室の設定、見分けるの入力、カタログの絞り込み、クイズの進み具合・点数・答えた状態をそのまま描き直す）。
- クイズの問題（`QuizData.ja`・`QuizData.en`）とカタログの名前・説明（`Catalog.textOf`）も言語ごとに持つ。クイズの20問は日英でid・区分・正解の添字・選択肢の数が同じ（テストで確かめる）。
- `test/i18n.test.js`は、辞書のキーと置き場所の一致、英語の文言・クイズ・カタログに日本語が残らないこと、index.htmlの日本語がすべて対応表にあることを確かめる。

---

## 11. テスト

`npm test`（`node --test`、依存なし、Node.js 22以上）で、次を検査します。

| ファイル | 内容 |
|------|------|
| `test/core.test.js` | 換字・転置の既知解答と往復、対合、乱数の一様さ、鍵の数、図の配置、差し込み位置、クイズの検査 |
| `test/lab.test.js` | 実験室の既知解答、転置の順列、保たれるもの、順番の入れ替え、統計、英語の頻度表、見分けのしきい値と評価結果 |
| `test/quiz.test.js` | クイズの20問の形、区分の数、正解の位置の偏り、解説と正解の一致、問題の数値 |
| `test/catalog.test.js` | 一覧の形、分類、区分の件数、各READMEのtitle、見分けるタブの案内先 |
| `test/html.test.js` | CSP、referrer、インラインの禁止、読み込むスクリプト、タブのARIA、id |
| `test/contrast.test.js` | ライトとダークのコントラスト比 |
| `test/messages.test.js` | 文言のキー、`script.js`に日本語の文字列リテラル（全角の記号を含む）がないこと |
| `test/i18n.test.js` | 初めの言語、辞書の日英の対応、index.htmlの日本語の訳、英語のクイズとカタログ |
| `test/format.test.js` | 行の長さ、行数の下限、改行（LF）、見えない文字 |
| `test/readme.test.js` | README（日本語・英語）のYAML、古典暗号の例・実験室・見分けの例・正答率の表、鍵の数、実例、ユースケースの数値、ディレクトリー構造、画像、表記、見出しの対応 |

---

## 📚 参考資料

- C. E. Shannon, "Communication Theory of Secrecy Systems", Bell System Technical Journal 28 (1949), pp.656–715
- [Pointer events - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [Fisher–Yates shuffle - Wikipedia](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
- [Content Security Policy - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Tabs Pattern - WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
