# REST API仕様

## エンドポイント

本番環境ではCloudflare Pages Functions（`functions/api/[[route]].ts`）がプロキシとして機能し、実体はCloudflare Workers（Hono）が処理する。

| 環境 | ベースURL |
|---|---|
| 本番（Cloudflare Pages） | `https://hello-todo.pages.dev/api` |
| ローカル開発 | `http://localhost:3000/api` |

フロントエンドからは常に `/api/*` への相対パスでアクセスする。

## エンドポイント一覧

### GET /api/todos
TODO一覧を取得する。

**レスポンス** `200 OK`
```json
[
  {
    "id": 1,
    "title": "タスク名",
    "done": false,
    "created_at": "2026-04-17T00:00:00.000Z"
  }
]
```
作成日時の降順で返却する。

---

### POST /api/todos
TODOを新規作成する。

**リクエスト**
```json
{ "title": "タスク名" }
```

**レスポンス** `201 Created`
```json
{
  "id": 2,
  "title": "タスク名",
  "done": false,
  "created_at": "2026-04-17T00:00:00.000Z"
}
```

**エラー** `400 Bad Request` — titleが空の場合
```json
{ "error": "title is required" }
```

---

### PATCH /api/todos/:id
TODOを更新する（完了状態またはタイトル）。

**リクエスト**（いずれか片方のみでも可）
```json
{ "done": true, "title": "新しいタスク名" }
```

**レスポンス** `200 OK` — 更新後のTODOオブジェクト

**エラー** `404 Not Found` — 指定IDが存在しない場合

---

### DELETE /api/todos/:id
TODOを削除する。

**レスポンス** `204 No Content`

**エラー** `404 Not Found` — 指定IDが存在しない場合

---

## データモデル

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | number | 自動採番の主キー（D1 AUTOINCREMENT） |
| `title` | string | タスク名（最大200文字） |
| `done` | boolean | 完了フラグ（D1内部は 0/1 で保存） |
| `created_at` | string | 作成日時（D1 TIMESTAMP、ISO 8601形式で返却） |

## D1スキーマ

```sql
CREATE TABLE IF NOT EXISTS todos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL CHECK(length(title) <= 200),
  done       INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
