# E2E (End-to-End) テストのセットアップガイド

このドキュメントでは、Playwright を使用して、この Next.js アプリケーションのエンドツーエンドテストをセットアップ、作成、実行する方法について説明します。

## なぜE2Eテストか？

E2Eテストは、アプリケーション全体を実際のユーザーのように操作して、本番環境で期待どおりに動作することを確認するためのものです。ログインからキャラクターとの会話まで、一連のユーザーフローを自動でテストできます。

---

## ステップ1: Playwright のインストール

まず、開発環境にPlaywrightをインストールします。以下のコマンドをターミナルで実行してください。

```bash
npm init playwright@latest
```

このコマンドを実行すると、対話形式で以下の質問が表示されます。

1.  **"Do you want to use TypeScript or JavaScript?"**
    *   `TypeScript` を選択してください。
2.  **"Where to put your end-to-end tests?"**
    *   デフォルトの `tests` のままで構いません。
3.  **"Add a GitHub Actions workflow?"**
    *   CI/CDをすぐに設定する場合は `true`、後で設定する場合は `false` を選択します。
4.  **"Install Playwright browsers?"**
    *   `true` を選択して、テストに必要なブラウザ（Chromium, Firefox, WebKit）をインストールします。

これにより、必要なパッケージがインストールされ、設定ファイル (`playwright.config.ts`) とサンプルテストが作成されます。

---

## ステップ2: Playwright の設定

`playwright.config.ts` ファイルを開き、`webServer` の設定を調整して、テスト実行前にNext.jsの開発サーバーが自動的に起動するようにします。

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ... 他の設定
  webServer: {
    // Next.jsの開発サーバーを起動するコマンド
    command: 'npm run dev',
    // 開発サーバーが起動したことを示すURL
    url: 'http://127.0.0.1:9002',
    // サーバーの起動を待ってからテストを開始する
    reuseExistingServer: !process.env.CI,
  },
  use: {
    // 各テストで使用するベースURL
    baseURL: 'http://127.0.0.1:9002',
  },
  // ... 他の設定
});
```

**注意**: `package.json` の `dev` スクリプトで指定されているポート番号 (`-p 9002`) と `playwright.config.ts` のポート番号が一致していることを確認してください。

---

## ステップ3: 最初のテストを作成する

`tests` フォルダ内に新しいテストファイルを作成します。例えば、`tests/app.spec.ts` というファイルを作成し、以下の内容を記述します。

このテストは、トップページにアクセスし、タイトルが "Townfolk Tales" であることを確認します。

```typescript
// tests/app.spec.ts

import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  // 1. トップページにアクセス
  await page.goto('/');

  // 2. ページのタイトルが "Townfolk Tales" を含んでいることを確認
  await expect(page).toHaveTitle(/Townfolk Tales/);
});

test('login page is displayed for non-logged-in user', async ({ page }) => {
  // 1. トップページにアクセス
  await page.goto('/');

  // 2. "Townfolk Talesへようこそ" というテキストが表示されていることを確認
  const welcomeMessage = page.getByText('Townfolk Talesへようこそ');
  await expect(welcomeMessage).toBeVisible();

  // 3. Googleログインボタンが表示されていることを確認
  const googleLoginButton = page.getByRole('button', { name: /Googleでログイン/ });
  await expect(googleLoginButton).toBeVisible();
});
```

---

## ステップ4: テストの実行

以下のコマンドを実行して、すべてのテストを実行します。

```bash
npx playwright test
```

テストがヘッドレスモード（ブラウザUIなし）で実行されます。テスト結果のレポートをブラウザで確認したい場合は、以下のコマンドを実行します。

```bash
npx playwright show-report
```

---

## E2Eテストのヒント

*   **具体的なテストケース**: ログイン機能、キャラクター作成機能、会話の送受信など、主要なユーザーフローをテストケースとして作成しましょう。
*   **セレクター**: `page.getByRole`, `page.getByText`, `page.getByLabel` などを活用して、堅牢なテストを作成します。
*   **認証の管理**: ログイン状態をテストするには、認証情報を保存・再利用する設定が便利です。Playwrightの公式ドキュメント（[Authentication](https://playwright.dev/docs/auth)）を参照してください。
