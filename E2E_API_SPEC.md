# E2Eテスト用 API仕様書

このドキュメントは、E2E（エンドツーエンド）テストを実行する際に、このアプリケーションのバックエンド機能（Next.js Server Actions）や認証機能を直接呼び出すためのAPI仕様を定義します。

## 概要

このアプリケーションは、従来のREST APIではなく、Next.jsのサーバーアクションを介してフロントエンドとバックエンドの通信を行っています。テストクライアントは、これらのサーバーアクションが期待するデータ構造を模倣したリクエストを送信する必要があります。

---

## 認証 (Authentication)

サーバーアクションを呼び出す前に、テストクライアントはFirebase Authenticationで認証を済ませ、IDトークンを取得する必要があります。

### 1. ユーザー認証（IDトークン取得）

メールアドレスとパスワードでログインし、Firebase IDトークンを取得します。このトークンは、認証が必要なサーバーアクションを呼び出す際に必要になる場合があります。

- **エンドポイント (Firebase Auth REST API)**:
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[FIREBASE_WEB_API_KEY]`
- **メソッド**: `POST`
- **ヘッダー**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **リクエストボディ**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "returnSecureToken": true
  }
  ```
- **成功時のレスポンス (抜粋)**:
  ```json
  {
    "idToken": "eyJhbGciOiJ...", // このIDトークンを使用します
    "email": "user@example.com",
    "uid": "USER_ID",
    "expiresIn": "3600"
  }
  ```
- **注意**: `[FIREBASE_WEB_API_KEY]` は、Firebaseプロジェクトのウェブ設定から取得できるAPIキーに置き換えてください。

### 2. ユーザー新規登録

テスト用の新しいユーザーを作成します。

- **エンドポイント (Firebase Auth REST API)**:
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=[FIREBASE_WEB_API_KEY]`
- **メソッド**: `POST`
- **ヘッダー**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **リクエストボディ**:
  ```json
  {
    "email": "newuser@example.com",
    "password": "new_password_123",
    "returnSecureToken": true
  }
  ```
- **成功時のレスポンス**: ユーザー認証と同様のレスポンスが返されます。

---

## サーバーアクション API仕様

### 1. ユーザープロフィール更新

ユーザーの表示名や自己紹介を更新します。

- **アクションファイル**: `src/app/profile/page.tsx` 内の `onSubmit` 関数
- **関数名**: （コンポーネント内の`onSubmit`）
- **説明**: ログイン中のユーザーのプロフィール情報を更新します。
- **入力 (`data`)**:
  ```json
  {
    "displayName": "string",
    "bio": "string (optional)"
  }
  ```
- **成功時のレスポンス**:
  - `react-hot-toast` を通じて成功メッセージがUIに表示されます。
- **失敗時のレスポンス**:
  - `errorMessage` stateにエラーメッセージがセットされます。

### 2. キャラクター作成

新しいキャラクターを手動で作成します。

- **アクションファイル**: `src/actions/character.ts`
- **関数名**: `createCharacter`
- **説明**: 新しいキャラクターをFirestoreの`characters`コレクションに作成します。
- **入力 (`characterData`)**:
  ```json
  {
    "name": "string",
    "introduction": "string",
    "description": "string", // AIのペルソナ設定
    "imagePath": "string",   // 例: "/images/icons/icon1.png"
    "isLocked": "boolean",
    "unlockCost": "number (optional)"
  }
  ```
- **出力**:
  ```json
  {
    "success": "boolean",
    "message": "string",
    "id": "string (optional)" // 成功時に作成されたドキュメントID
  }
  ```

### 3. AIによるキャラクター自動生成

AIを使用して新しいキャラクターを自動生成し、作成します。

- **アクションファイル**: `src/actions/character.ts`
- **関数名**: `generateAndCreateCharacter`
- **説明**: 指定されたテーマに基づき、AIがキャラクター情報を生成してFirestoreに保存します。
- **入力 (`theme`)**:
  ```json
  {
    "theme": "string" // 例: "ファンタジー世界の住人"
  }
  ```
- **出力**:
  ```json
  {
    "success": "boolean",
    "message": "string"
  }
  ```

### 4. AIキャラクターへのメッセージ送信

キャラクターとの会話メッセージを送信し、AIからの応答を取得します。

- **アクションファイル**: `src/actions/chat.ts`
- **関数名**: `getAiResponse`
- **説明**: ユーザーからのメッセージとこれまでの会話履歴を基に、AIキャラクターからの返信を生成します。
- **入力**:
  - `character`: `Character` オブジェクト
  - `userMessage`: `string`
  - `conversationHistory`: `Message[]` 配列
  - `userProfile`: `UserProfile` オブジェクト
- **出力**:
  ```json
  {
    "success": "boolean",
    "message": "string", // AIからの返信メッセージ
    "loveScore": "number (optional)" // -1.0から1.0の間の数値
  }
  ```

### 5. 次の期へ進む（宿屋に泊まる）

ゲーム内の日付を1日進め、全キャラクターの好感度をリセットします。

- **アクションファイル**: `src/contexts/game-state.tsx` 内
- **関数名**: `stayAtInn`
- **説明**: `users/{userId}` ドキュメントの `gameDate` をインクリメントし、`users/{userId}/characterStates` 内の全キャラクターの好感度を初期値（50）にリセットします。
- **入力**: なし（ログイン中のユーザー情報に依存）
- **出力**:
  - `react-hot-toast` を通じてUIに通知が表示されます。

### 6. ロックされたキャラクターの解放

生産ポイントを消費して、ロックされているキャラクターを解放します。

- **アクションファイル**: `src/contexts/game-state.tsx` 内
- **関数名**: `unlockCharacter`
- **説明**: ユーザーの生産ポイントを消費し、対象キャラクターの`unlockedBy`配列にユーザーIDを追加します。
- **入力 (`characterId`)**: `string`
- **出力**:
  - `react-hot-toast` を通じてUIに通知が表示されます。

```