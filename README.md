# Hello Project - TODO管理アプリ

## 概要

シンプルなTODO管理Webアプリです。

## 構成

| 役割 | サービス | URL |
|---|---|---|
| フロントエンド | Cloudflare Pages | `https://hello-todo.pages.dev` |
| API プロキシ | Pages Functions | `https://hello-todo.pages.dev/api/*` |
| バックエンド | Cloudflare Workers (Hono) | `https://hello-todo.jamkline03.workers.dev` |
| データベース | Cloudflare D1 (SQLite) | - |
| CI/CD | GitHub Actions | ビルド → e2e → デプロイ |

## ローカルでの起動

```bash
# バックエンド
npm install && npm start
# → http://localhost:3000

# フロントエンド（別ターミナル・ホットリロード）
cd client && npm install && npm run dev
# → http://localhost:5173
```

## Docker での起動

```bash
docker build -t todo-app .
docker run -p 3000:3000 -v todo-data:/data todo-app
# → http://localhost:3000
```

## Cloudflare へのデプロイ

### 初回セットアップ

```bash
# D1データベース作成
cd worker
npx wrangler login
npx wrangler d1 create todo-db
# → 出力された database_id を worker/wrangler.toml に設定

# スキーマ適用
npx wrangler d1 execute todo-db --remote --file=./schema.sql

# Pagesプロジェクト作成
npx wrangler pages project create hello-todo
```

### GitHub Secrets の設定

| Secret名 | 取得場所 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → 右サイドバー |

APIトークンに必要な権限: `Workers Scripts:Edit`, `D1:Edit`, `Cloudflare Pages:Edit`

### 自動デプロイ

`main` ブランチにpushするとCIが自動でビルド・e2eテスト・デプロイを実行します。

## ライセンス

MIT
