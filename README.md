# Hello Project - TODO管理アプリ

## 概要

シンプルなTODO管理Webアプリです。

- **GitHub Pages版**: ブラウザの `localStorage` でデータを保存（サーバー不要）
- **Docker版**: Flask + SQLite バックエンドで動作

## GitHub Pages での公開手順

1. このブランチを `main` にマージする
2. リポジトリの **Settings → Pages** を開く
3. Source を **Deploy from a branch** に設定
4. Branch: `main` / Folder: `/docs` を選択して **Save**
5. しばらく待つと `https://<your-username>.github.io/hello/` で公開される

## Docker での起動

```bash
docker build -t todo-app .
docker run -p 5000:5000 -v todo-data:/data todo-app
# → http://localhost:5000
```

依存関係のみでローカル起動する場合：

```bash
pip install -r requirements.txt
python app.py
# → http://localhost:5000
```

## ライセンス

MIT
