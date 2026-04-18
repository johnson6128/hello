import { Hono } from 'hono'

type Env = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/todos', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM todos ORDER BY created_at DESC'
  ).all()
  return c.json((results ?? []).map(r => ({ ...r, done: !!r.done })))
})

app.post('/api/todos', async (c) => {
  const { title } = await c.req.json<{ title?: string }>()
  const trimmed = title?.trim()
  if (!trimmed) return c.json({ error: 'title is required' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO todos (title) VALUES (?)'
  ).bind(trimmed).run()

  const row = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE id = ?'
  ).bind(result.meta.last_row_id).first()

  return c.json({ ...row, done: !!row?.done }, 201)
})

app.patch('/api/todos/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const row = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE id = ?'
  ).bind(id).first()
  if (!row) return c.json({ error: 'not found' }, 404)

  const data = await c.req.json<{ title?: string; done?: boolean }>()
  const title = (data.title ?? (row.title as string)).trim() || (row.title as string)
  const done = data.done !== undefined ? (data.done ? 1 : 0) : row.done

  await c.env.DB.prepare(
    'UPDATE todos SET title = ?, done = ? WHERE id = ?'
  ).bind(title, done, id).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE id = ?'
  ).bind(id).first()

  return c.json({ ...updated, done: !!updated?.done })
})

app.delete('/api/todos/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const result = await c.env.DB.prepare(
    'DELETE FROM todos WHERE id = ?'
  ).bind(id).run()
  if (result.meta.changes === 0) return c.json({ error: 'not found' }, 404)
  return new Response(null, { status: 204 })
})

export default app
