from flask import Flask, request, jsonify, render_template
import sqlite3
import os

app = Flask(__name__)
DB_PATH = os.environ.get("DB_PATH", "todos.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                done INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/todos", methods=["GET"])
def list_todos():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM todos ORDER BY created_at DESC").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/todos", methods=["POST"])
def create_todo():
    data = request.get_json()
    title = (data or {}).get("title", "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400
    with get_db() as conn:
        cur = conn.execute("INSERT INTO todos (title) VALUES (?)", (title,))
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/todos/<int:todo_id>", methods=["PATCH"])
def update_todo(todo_id):
    data = request.get_json() or {}
    with get_db() as conn:
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
        if not row:
            return jsonify({"error": "not found"}), 404
        done = int(data.get("done", row["done"]))
        title = data.get("title", row["title"]).strip() or row["title"]
        conn.execute("UPDATE todos SET title = ?, done = ? WHERE id = ?", (title, done, todo_id))
        row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    return jsonify(dict(row))


@app.route("/api/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    with get_db() as conn:
        result = conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
        if result.rowcount == 0:
            return jsonify({"error": "not found"}), 404
    return "", 204


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
