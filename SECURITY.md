# セキュリティ対策

このドキュメントは、Classical Cipher Structure Trainerに実装しているセキュリティ対策と、その限界を説明します。

## 実装済みのセキュリティ対策

### 1. Content Security Policy（CSP）

`index.html`のmeta要素で、次のCSPを設定しています。

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" />
```

- `script-src 'self'`：同じオリジンのスクリプトファイルだけを実行する。インラインのスクリプトとイベント属性は使わない。
- `style-src 'self'`：同じオリジンのスタイルシートだけを使う。style属性は使わない。
- `img-src 'self'`：画像（ファビコン）は同じオリジンだけである。
- `connect-src 'none'`：通信（fetch・XMLHttpRequest・WebSocket）をしない。
- `object-src 'none'`・`base-uri 'none'`・`form-action 'none'`：プラグイン、base要素、フォームの送信先を禁止する。

`test/html.test.js`が、このCSPと、インラインのスクリプト・イベント属性・style属性がないことを毎回検査します。

### 2. 文字の描画

- 画面に入れる文字は、すべて`textContent`で入れる。`innerHTML`への代入はない（テストで検査）。
- SVGの図は`createElementNS`と`setAttribute`で組み立てる。
- クイズの問題と古典暗号の例の一覧は、リポジトリの中のスクリプト（`js/quiz-data.js`・`js/catalog.js`）で、利用者の入力ではない。クイズの問題は、表示の前に形を検査する（`validateQuiz`）。

### 3. 外部リンクとreferrer

- 外部へのリンクは`target="_blank" rel="noopener noreferrer"`で開く。開いた先のページから、このページを操作されない。
- `<meta name="referrer" content="no-referrer">`で、リンク先にreferrerを送らない。

### 4. 通信と保存

- 外部への通信はない。ライブラリー・CDN・解析用のスクリプトも使わない。
- 保存するのは配色の選択（`localStorage`の`ccst-theme`、`light`か`dark`）だけである。読み出した値は`light`と`dark`以外を無視する。保存できない環境（プライベートモードなど）でも、例外で止まらずに動く。

### 5. 乱数

- 「ランダムに対応させる」「ランダムに並べ替え」の乱数は`crypto.getRandomValues`である。偏りのない整数（2^32を割り切れない端を引き直す）とFisher–Yatesで、すべての順列を同じ確率で作る。
- 本ツールは学習用で、作った対応表や並べ方を秘密の鍵として使うことは想定していない。

## 対策していないこと（限界）

- クリックジャッキング：`frame-ancestors`はmeta要素のCSPでは仕様上無視され、GitHub Pagesでは`X-Frame-Options`などの応答ヘッダーを設定できない。他サイトのiframeに埋め込まれることは防げない。本ツールは入力や送信を扱わないので、埋め込まれたときの影響は表示に限られる。
- 応答ヘッダーで設定する対策（HSTSの設定値、`X-Content-Type-Options`など）は、GitHub Pagesの設定に従う。

## 報告

セキュリティ上の問題を見つけた場合は、GitHub Issuesで報告してください。
