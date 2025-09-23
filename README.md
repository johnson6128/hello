# Hello Project

## 概要
このプロジェクトは、GitHub Container Registry (GHCR) を使用して Docker イメージを管理するサンプルプロジェクトです。

## 必要条件
- Docker
- GitHub アカウント
- Personal Access Token (PAT) または Fine-grained Token

## 使用方法

### 1. Docker イメージのビルド
以下のコマンドを使用して Docker イメージをビルドします：

```powershell
# Dockerfile が存在するディレクトリで実行
docker build -t ghcr.io/<your-username>/hello:latest .
```

### 2. GHCR へのログイン
GitHub のトークンを使用して GHCR にログインします：

```powershell
echo $PAT | docker login ghcr.io -u <your-username> --password-stdin
```

### 3. Docker イメージのプッシュ
ビルドしたイメージを GHCR にプッシュします：

```powershell
docker push ghcr.io/<your-username>/hello:latest
```

## トラブルシューティング

### エラー: `denied: permission_denied: The token provided does not match expected scopes`
このエラーは、トークンのスコープが不足している場合に発生します。以下を確認してください：
- トークンに `write:packages` スコープが含まれていること。
- プライベートリポジトリの場合、`read:packages` スコープも必要です。

### エラー: `unauthorized: authentication required`
このエラーは、GHCR に正しくログインしていない場合に発生します。再度ログインしてください：

```powershell
echo $PAT | docker login ghcr.io -u <your-username> --password-stdin
```

## ライセンス
このプロジェクトは MIT ライセンスの下で提供されます。