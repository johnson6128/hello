# システム構成

## 概要

TODO管理Webアプリ。GitHub Pages向けの静的版とDocker向けのフルスタック版の2つの動作モードを持つ。

## 動作モード

| モード | フロントエンド | データ保存 | 用途 |
|---|---|---|---|
| 静的モード (`VITE_STORAGE=local`) | React (Vite) | localStorage | GitHub Pages |
| フルスタックモード | React (Vite) | Express + SQLite | Docker / ローカル |

## ディレクトリ構成

```
/
├── client/                  # フロントエンド（React + TypeScript + Tailwind CSS）
│   ├── src/
│   │   ├── App.tsx          # メインコンポーネント
│   │   ├── storage.ts       # ストレージ抽象化（API / localStorage 切り替え）
│   │   └── types.ts         # 型定義
│   ├── e2e/                 # Playwright e2eテスト
│   ├── playwright.config.ts
│   └── vite.config.ts
├── server.js                # Express バックエンド
├── package.json             # バックエンド依存関係
├── dockerfile               # マルチステージビルド
└── .github/workflows/ci.yml # CI/CDパイプライン
```

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|---|---|---|
| React | 18 | UIフレームワーク |
| TypeScript | 5 | 型安全性 |
| Tailwind CSS | 3 | スタイリング |
| Vite | 5 | ビルドツール・開発サーバー |

### バックエンド（フルスタックモード）
| 技術 | バージョン | 用途 |
|---|---|---|
| Node.js | 22 | ランタイム |
| Express | 4 | Webフレームワーク |
| better-sqlite3 | 9 | データベース |

### インフラ
| 技術 | 用途 |
|---|---|
| GitHub Pages | 静的ホスティング |
| GitHub Actions | CI/CD |
| Docker | コンテナ実行 |
