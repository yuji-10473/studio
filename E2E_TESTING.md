# E2E (End-to-End) テストのセットアップガイド

このドキュメントでは、この Next.js アプリケーションのエンドツーエンドテストをセットアップ、作成、実行する方法について説明します。

アプリケーションのバックエンドはNext.jsのサーバーアクションとして実装されています。テストは、これらのアクションを直接呼び出すか、UIを操作するテストフレームワーク（Playwrightなど）を使用して行います。

各アクション（API）の詳しい仕様については、`E2E_API_SPEC.md` を参照してください。

## なぜE2Eテストか？

E2Eテストは、アプリケーション全体を実際のユーザーのように操作して、本番環境で期待どおりに動作することを確認するためのものです。ログインからキャラクターとの会話まで、一連のユーザーフローを自動でテストできます。

---

## テスト戦略

### 1. UIベースのテスト (Playwrightなど)

実際のユーザー操作を最も正確にシミュレートする方法です。

- **フレームワーク**: Playwright, Cypressなど
- **長所**:
    - ユーザーが実際に目にするUIの崩れや、操作できないボタンなどを検出できる。
    - フロントエンドとバックエンドの結合を含めた完全なテストが可能。
- **短所**:
    - テストの実行が遅い。
    - UIの変更に弱く、メンテナンスコストがかかる。

#### セットアップ例 (Playwright)

1.  **Playwright のインストール**:
    ```bash
    npm init playwright@latest
    ```
    質問には `TypeScript` を選択し、デフォルト設定に従います。

2.  **設定ファイルの更新 (`playwright.config.ts`)**:
    開発サーバーが自動で起動するように `webServer` を設定します。

    ```typescript
    // playwright.config.ts
    import { defineConfig } from '@playwright/test';

    export default defineConfig({
      // ...
      webServer: {
        command: 'npm run dev',
        url: 'http://127.0.0.1:9002', // package.jsonのポートと合わせる
        reuseExistingServer: !process.env.CI,
      },
      use: {
        baseURL: 'http://127.0.0.1:9002',
      },
      // ...
    });
    ```

3.  **テストの作成 (`tests/example.spec.ts`)**:
    ログイン画面が表示されることを確認するテスト。

    ```typescript
    import { test, expect } from '@playwright/test';

    test('login page is displayed', async ({ page }) => {
      await page.goto('/');
      const welcomeMessage = page.getByText('Townfolk Talesへようこそ');
      await expect(welcomeMessage).toBeVisible();
    });
    ```

### 2. APIベースのテスト (サーバーアクションの直接呼び出し)

UIを介さずにバックエンドのロジックを直接テストする方法です。

- **フレームワーク**: Jest, Vitestなど
- **長所**:
    - 非常に高速に実行できる。
    - UIの変更に影響されない。
    - バックエンドのロジックを個別に検証できる。
- **短所**:
    - フロントエンドの表示や動作はテストできない。
    - サーバーアクションを呼び出すためのセットアップ（認証情報のモックなど）が必要。

#### セットアップ例

テストクライアントは、`E2E_API_SPEC.md` に記載されている各サーバーアクションをインポートし、必要な引数を渡して直接実行します。

```typescript
// 例: Jestを使ったテスト
import { createCharacter } from '@/actions/character';

describe('Character Actions', () => {
  it('should create a new character', async () => {
    const newCharacter = {
      name: 'Test Character',
      introduction: 'Intro',
      description: 'Desc',
      imagePath: '/images/icons/icon1.png',
      isLocked: false,
    };

    // Firebaseの認証やFirestoreの初期化をモックする必要がある
    const result = await createCharacter(newCharacter);

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });
});
```

---

## 推奨されるアプローチ

1.  **主要なユーザーフロー**（ログイン、会話、キャラクター解放など）は、**UIベースのE2Eテスト**でカバーする。
2.  **細かいロジックや境界値**（例: 不正な入力値でのキャラクター作成など）は、高速な**APIベースのテスト**でカバーする。

この2つを組み合わせることで、テスト全体の信頼性と実行速度のバランスを取ることができます。

