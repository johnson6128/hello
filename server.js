const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || 'todos.db';

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/todos', (req, res) => {
  const rows = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all();
  res.json(rows.map(r => ({ ...r, done: !!r.done })));
});

app.post('/api/todos', (req, res) => {
  const title = (req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db.prepare('INSERT INTO todos (title) VALUES (?)').run(title);
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...row, done: !!row.done });
});

app.patch('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const title = (req.body?.title ?? row.title).trim() || row.title;
  const done = req.body?.done !== undefined ? (req.body.done ? 1 : 0) : row.done;
  db.prepare('UPDATE todos SET title = ?, done = ? WHERE id = ?').run(title, done, id);
  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  res.json({ ...updated, done: !!updated.done });
});

app.delete('/api/todos/:id', (req, res) => {
  const info = db.prepare('DELETE FROM todos WHERE id = ?').run(Number(req.params.id));
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.sendStatus(204);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
