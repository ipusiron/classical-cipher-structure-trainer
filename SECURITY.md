# セキュリティ対策

このドキュメントは、Classical Cipher Structure Trainer に実装されているセキュリティ対策について説明します。

## 実装済みのセキュリティ対策

### 1. Content Security Policy (CSP)

厳格なCSPを設定し、以下を制限しています：

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" />
```

- **script-src 'self'**: 外部スクリプトの実行を禁止
- **style-src 'self'**: インラインスタイルを禁止（クラスベースのスタイリングのみ許可）
- **object-src 'none'**: プラグインの実行を禁止
- **frame-ancestors 'none'**: クリックジャッキング攻撃を防止

### 2. 外部リンクのセキュリティ

すべての外部リンクに `rel="noopener"` 属性を設定：

```html
<a href="..." target="_blank" rel="noopener">...</a>
```

これにより、Reverse Tabnabbing 攻撃を防止します。

### 3. XSS対策

#### innerHTML の安全な使用

- `innerHTML` の使用を最小限に抑え、主にクリア操作（空文字列設定）のみに使用
- 動的コンテンツの生成には `createElement` と `textContent` を使用

#### JSONデータの検証

外部JSONファイル（`data/quiz.json`）から読み込んだデータを使用前に厳格に検証：

```javascript
function validateQuizData(data){
  if(!data || typeof data !== 'object') return false;
  if(!Array.isArray(data.questions)) return false;

  return data.questions.every(q => {
    return q && typeof q === 'object' &&
           typeof q.prompt === 'string' &&
           Array.isArray(q.choices) &&
           q.choices.length > 0 &&
           q.choices.every(c => typeof c === 'string') &&
           typeof q.answer_index === 'number' &&
           q.answer_index >= 0 &&
           q.answer_index < q.choices.length;
  });
}
```

### 4. エラーハンドリング

- すべての非同期操作に適切なエラーハンドリングを実装
- ユーザーにわかりやすいエラーメッセージを表示
- 開発者向けにコンソールログを出力

```javascript
try{
  const res = await fetch('data/quiz.json', { cache: 'no-store' });
  if(!res.ok){
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  // ...
}catch(err){
  console.error('Quiz loading error:', err);
  loader.textContent = 'クイズの読み込みに失敗しました。ページをリロードしてください。';
}
```

### 5. Referrer Policy

リファラー情報の漏洩を最小限に抑えるため、strict-origin-when-cross-originポリシーを設定：

```html
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

### 6. クライアントサイド完結

- バックエンドサーバーを使用しない完全なクライアントサイドアプリケーション
- 機密情報の送信や保存を行わない
- ユーザー入力は最小限（クイズの選択のみ）

## セキュリティベストプラクティス

### 開発時の注意点

1. **外部ライブラリの使用を避ける**: 依存関係を持たないことで、サプライチェーン攻撃のリスクを排除
2. **インラインスクリプト/スタイルを使用しない**: CSPを厳格に保つため
3. **ユーザー入力の検証**: すべての外部データ（JSONファイルを含む）を検証
4. **DOM操作の安全性**: `textContent` を優先的に使用し、`innerHTML` は慎重に使用

### GitHub Pages でのデプロイ

GitHub Pages は自動的に HTTPS を提供します。追加の設定は不要です。

## 報告されたセキュリティ問題

現在、報告されているセキュリティ問題はありません。

セキュリティ上の問題を発見した場合は、GitHub Issues で報告してください。

## 更新履歴

- 2025-01-XX: 初版作成
  - CSP実装
  - XSS対策
  - JSONデータ検証
  - エラーハンドリング改善
