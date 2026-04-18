# CI/CDパイプライン仕様

## トリガー

| イベント | 対象ブランチ |
|---|---|
| push | `main`, `claude/**` |
| pull_request | `main` へのPR |

## ジョブ構成

```
build ──→ e2e ──→ deploy（mainのみ）
               └→ deploy-worker（mainのみ）
```

### build

| ステップ | 内容 |
|---|---|
| Checkout | ソースコード取得 |
| Setup Node.js 22 | `client/package-lock.json` でキャッシュ |
| Install backend deps | `npm install` |
| Install frontend deps | `npm install --prefix client` |
| Type check | `tsc --noEmit`（`client/` で実行） |
| Build frontend | `npm --prefix client run build`（`public/` に出力） |
| Upload artifact | ビルド成果物（`public/`）をアーティファクトとして保存 |

### e2e

buildジョブ完了後に実行。

| ステップ | 内容 |
|---|---|
| Checkout | ソースコード取得 |
| Setup Node.js 22 | キャッシュあり |
| Install frontend deps | `npm install --prefix client` |
| Install Playwright browsers | Chromiumのみインストール（`--with-deps`） |
| Run e2e tests | `npx playwright test`（`client/` で実行、`VITE_STORAGE=local`） |
| Upload test report | テスト失敗時のみ、HTMLレポートを7日間保存 |

### deploy（Cloudflare Pages）

buildおよびe2eジョブ完了後、**mainブランチへのpush時のみ**実行。

| ステップ | 内容 |
|---|---|
| Checkout | ソースコード取得 |
| Download artifact | buildジョブの `public/` を取得 |
| Deploy to Cloudflare Pages | `wrangler pages deploy public/ --project-name=hello-todo`（リポジトリルートから実行、`functions/` を自動検出） |

デプロイ先: `https://hello-todo.pages.dev`

### deploy-worker（Cloudflare Workers）

e2eジョブ完了後、**mainブランチへのpush時のみ**実行。

| ステップ | 内容 |
|---|---|
| Checkout | ソースコード取得 |
| Install worker deps | `npm install --prefix worker` |
| Deploy Cloudflare Worker | `npx wrangler deploy`（`worker/` で実行） |

デプロイ先: `https://hello-todo.jamkline03.workers.dev`

## 必要なGitHub Secrets

| Secret名 | 取得場所 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → 右サイドバー |

APIトークンに必要な権限: `Workers Scripts:Edit`, `D1:Edit`, `Cloudflare Pages:Edit`
