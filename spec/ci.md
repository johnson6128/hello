# CI/CDパイプライン仕様

## トリガー

| イベント | 対象ブランチ |
|---|---|
| push | `main`, `claude/**` |
| pull_request | `main` へのPR |

## ジョブ構成

```
build ──→ e2e ──→ deploy（mainのみ）
```

### build

| ステップ | 内容 |
|---|---|
| Checkout | ソースコード取得 |
| Setup Node.js 22 | `client/package-lock.json` でキャッシュ |
| Install backend deps | `npm install` |
| Install frontend deps | `npm install --prefix client` |
| Type check | `tsc --noEmit`（`client/` で実行） |
| Build frontend | `npm --prefix client run build`（`VITE_STORAGE=local`） |
| Upload Pages artifact | ビルド成果物（`public/`）をPages用にアップロード |

### e2e

buildジョブ完了後に実行。

| ステップ | 内容 |
|---|---|
| Checkout | ソースコード取得 |
| Setup Node.js 22 | キャッシュあり |
| Install frontend deps | `npm install --prefix client` |
| Install Playwright browsers | Chromiumのみインストール（`--with-deps`） |
| Run e2e tests | `npx playwright test`（`client/` で実行） |
| Upload test report | テスト失敗時のみ、HTMLレポートを7日間保存 |

### deploy

buildおよびe2eジョブ完了後、**mainブランチへのpush時のみ**実行。

| ステップ | 内容 |
|---|---|
| Deploy to GitHub Pages | `actions/deploy-pages` でデプロイ |

デプロイ先: `https://johnson6128.github.io/hello/`

## 必要なリポジトリ設定

- Settings → Pages → Source: **GitHub Actions**
- Permissions（`ci.yml`内で設定済み）:
  - `contents: read`
  - `pages: write`
  - `id-token: write`
