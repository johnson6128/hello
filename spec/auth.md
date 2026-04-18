# 認証仕様（Google OAuth 2.0）

## 概要

Google OAuth 2.0を使ったログイン機能を実装し、ユーザーごとにTODOを分離する。
JWTをlocalStorageに保存し、APIリクエスト時に `Authorization: Bearer <token>` ヘッダーで送信する。

---

## 認証フロー

```
1. ユーザーが「Googleでログイン」をクリック
2. フロントエンドが /api/auth/google へリダイレクト
3. WorkerがGoogleの認証画面へリダイレクト
4. Googleが /api/auth/callback?code=xxx へリダイレクト
5. WorkerがcodeをGoogleのトークンエンドポイントと交換
6. WorkerがGoogleからユーザー情報（email, name, avatar）を取得
7. D1のusersテーブルにユーザーをupsert
8. WorkerがJWTを発行し、フロントエンドへリダイレクト（?token=xxx）
9. フロントエンドがJWTをlocalStorageに保存
10. 以降のAPIリクエストにJWTを付与
```

---

## データモデル変更

### 新規テーブル: users

```sql
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id  TEXT    NOT NULL UNIQUE,
  email      TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### todosテーブル変更

```sql
ALTER TABLE todos ADD COLUMN user_id INTEGER REFERENCES users(id);
```

既存レコードは削除または移行（初回リリース時はDROP & RECREATEで対応）。

---

## APIエンドポイント

### 認証系（認証不要）

#### GET /api/auth/google
Google OAuth認証画面へリダイレクトする。

#### GET /api/auth/callback
Googleからのコールバックを受け取る。

| パラメータ | 説明 |
|---|---|
| `code` | Googleが発行した認可コード |
| `state` | CSRF対策トークン（省略可） |

処理: codeをアクセストークンと交換 → ユーザー情報取得 → D1にupsert → JWT発行 → フロントエンドへリダイレクト

リダイレクト先: `/?token=<jwt>`

#### GET /api/auth/me
現在のログインユーザー情報を返す。Authorizationヘッダー必須。

**レスポンス** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Taro Yamada",
  "avatar_url": "https://..."
}
```

### TODOエンドポイント（要認証）

既存の `GET/POST/PATCH/DELETE /api/todos` はすべてJWT検証が必須となり、
JWT内の `user_id` でデータをフィルタリングする。

認証なしのリクエストは `401 Unauthorized` を返す。

---

## JWT仕様

| 項目 | 内容 |
|---|---|
| アルゴリズム | HS256 |
| ペイロード | `{ sub: user_id, email, exp }` |
| 有効期限 | 7日 |
| 署名鍵 | `JWT_SECRET`（Wrangler Secret） |

---

## 環境変数

| 変数名 | 説明 | 設定場所 |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントID | Wrangler Secret |
| `GOOGLE_CLIENT_SECRET` | Google OAuthクライアントシークレット | Wrangler Secret |
| `JWT_SECRET` | JWT署名鍵（32文字以上のランダム文字列） | Wrangler Secret |

---

## フロントエンド変更

### 新規ファイル

- `client/src/auth.ts` — JWT読み書き、ログアウト、Authorizationヘッダー付与
- `client/src/LoginPage.tsx` — ログイン画面

### 変更ファイル

- `client/src/storage.ts` — 全APIリクエストに `Authorization` ヘッダーを付与
- `client/src/App.tsx` — 未ログイン時はLoginPageを表示、ヘッダーにユーザー情報・ログアウトボタンを追加
- `client/src/types.ts` — `User` 型を追加

### ログイン画面

- 「Googleでログイン」ボタンのみ表示
- `/api/auth/google` へのリンク

### ログイン後

- ヘッダーにアバター・名前・ログアウトボタンを表示
- ログアウト時はJWTをlocalStorageから削除してログイン画面へ

---

## Google Cloud Console設定（手動）

1. Google Cloud Console → APIとサービス → 認証情報 → OAuth 2.0クライアントIDを作成
2. アプリケーションの種類: **ウェブアプリケーション**
3. 承認済みのリダイレクトURI:
   - `https://hello-todo.pages.dev/api/auth/callback`（本番）
   - `http://localhost:8788/api/auth/callback`（ローカル開発）
4. クライアントIDとシークレットを取得

---

## e2eテスト方針

localStorageモード（`VITE_STORAGE=local`）では認証をスキップする。
`USE_LOCAL` が `true` の場合、`/api/auth/me` を呼ばずにゲストユーザーとして動作させる。
既存のe2eテストは変更不要。

---

## 実装タスク

### 事前準備（手動）
- [ ] Google Cloud ConsoleでOAuth 2.0クライアントを作成
- [ ] `JWT_SECRET` 用のランダム文字列を生成

### バックエンド
- [ ] D1スキーマ更新（`users` テーブル追加、`todos` に `user_id` カラム追加）
- [ ] `worker/schema.sql` 更新
- [ ] JWT検証ミドルウェア実装（`worker/src/middleware/auth.ts`）
- [ ] 認証エンドポイント実装（`worker/src/routes/auth.ts`）
  - `GET /api/auth/google`
  - `GET /api/auth/callback`
  - `GET /api/auth/me`
- [ ] `worker/src/index.ts` にルーティングとミドルウェアを追加
- [ ] todosエンドポイントに `user_id` フィルタを追加
- [ ] `wrangler.toml` に `JWT_SECRET`・`GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET` のSecret定義を追加

### フロントエンド
- [ ] `types.ts` に `User` 型を追加
- [ ] `auth.ts` 実装（JWT保存・取得・削除・ヘッダー付与）
- [ ] `LoginPage.tsx` 実装
- [ ] `storage.ts` に `Authorization` ヘッダーを追加
- [ ] `App.tsx` に認証チェックとログアウトボタンを追加

### CI/インフラ
- [ ] Wrangler SecretにGoogle認証情報・JWT_SECRETを設定
- [ ] GitHub SecretsにWranglerのSecretデプロイ用変数を追加（必要に応じて）

### 仕様書
- [ ] `spec/architecture.md` 更新
- [ ] `spec/api.md` 更新
