# Hello Project - TODO管理アプリ

## 概要

シンプルなTODO管理Webアプリです。

- **GitHub Pages版**: ブラウザの `localStorage` でデータを保存（サーバー不要）
- **Docker版**: Node.js (Express) + SQLite バックエンドで動作

## GitHub Pages での公開手順

1. このリポジトリの **Settings → Pages** を開く
2. Source を **GitHub Actions** に設定
3. `main` ブランチにpushするとCIが自動でビルド・デプロイを実行
4. `https://<your-username>.github.io/hello/` で公開される

## Docker での起動

```bash
docker build -t todo-app .
docker run -p 3000:3000 -v todo-data:/data todo-app
# → http://localhost:3000
```

## ローカルでの起動

```bash
npm install
npm run build
npm start
# → http://localhost:3000
```

開発時（ホットリロード）:

```bash
npm install && npm start          # ターミナル1: バックエンド
cd client && npm install && npm run dev  # ターミナル2: フロントエンド
# → http://localhost:5173
```

## ライセンス

MIT
