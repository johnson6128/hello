# システム構成

## 概要

TODO管理Webアプリ。Cloudflare Pages（フロントエンド）+ Cloudflare Workers（APIバックエンド）+ Cloudflare D1（データベース）で構成される。

## アーキテクチャ

```
ブラウザ
  │
  ├── / (静的アセット)
  │     └── Cloudflare Pages
  │
  └── /api/* (APIリクエスト)
        └── Pages Functions (プロキシ)
              └── Cloudflare Workers (Hono)
                    └── Cloudflare D1 (SQLite)
```

## サービス構成

| 役割 | サービス | URL |
|---|---|---|
| フロントエンド | Cloudflare Pages | `https://hello-todo.pages.dev` |
| API プロキシ | Pages Functions | `https://hello-todo.pages.dev/api/*` |
| バックエンド | Cloudflare Workers (Hono) | `https://hello-todo.jamkline03.workers.dev` |
| データベース | Cloudflare D1 (SQLite) | - |
| CI/CD | GitHub Actions | ビルド → e2e → デプロイ |

## ディレクトリ構成

```
/
├── client/                      # フロントエンド（React + TypeScript + Tailwind CSS）
│   ├── src/
│   │   ├── App.tsx              # メインコンポーネント
│   │   ├── storage.ts           # ストレージ抽象化（API / localStorage 切り替え）
│   │   └── types.ts             # 型定義
│   ├── e2e/                     # Playwright e2eテスト
│   ├── playwright.config.ts
│   └── vite.config.ts
├── worker/                      # Cloudflare Workers バックエンド（Hono）
│   ├── src/index.ts             # APIハンドラ
│   ├── schema.sql               # D1スキーマ定義
│   ├── wrangler.toml            # Wrangler設定
│   └── package.json
├── functions/
│   └── api/[[route]].ts         # Pages Functions APIプロキシ
├── public/                      # Viteビルド出力（Cloudflare Pagesへデプロイ）
├── server.js                    # Express バックエンド（ローカル開発・Docker用）
├── dockerfile                   # マルチステージビルド
└── .github/workflows/ci.yml     # CI/CDパイプライン
```

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|---|---|---|
| React | 18 | UIフレームワーク |
| TypeScript | 5 | 型安全性 |
| Tailwind CSS | 3 | スタイリング |
| Vite | 5 | ビルドツール・開発サーバー |

### バックエンド（本番）
| 技術 | バージョン | 用途 |
|---|---|---|
| Cloudflare Workers | - | サーバーレスランタイム |
| Hono | 4 | Webフレームワーク |
| Cloudflare D1 | - | SQLiteデータベース |

### バックエンド（ローカル開発・Docker）
| 技術 | バージョン | 用途 |
|---|---|---|
| Node.js | 22 | ランタイム |
| Express | 4 | Webフレームワーク |
| better-sqlite3 | 9 | データベース |

### インフラ
| 技術 | 用途 |
|---|---|
| Cloudflare Pages | フロントエンドホスティング・Pages Functions |
| Cloudflare Workers | APIバックエンド |
| Cloudflare D1 | マネージドSQLiteデータベース |
| GitHub Actions | CI/CD |
| Docker | ローカル開発・コンテナ実行 |
