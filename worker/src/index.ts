import { Hono } from 'hono'
import { SignJWT, jwtVerify } from 'jose'
import { createMiddleware } from 'hono/factory'

type Bindings = {
  DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  FRONTEND_URL: string
}

type Variables = {
  userId: number
  email: string
}

type HonoEnv = { Bindings: Bindings; Variables: Variables }

const app = new Hono<HonoEnv>()

const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'unauthorized' }, 401)
  try {
    const { payload } = await jwtVerify(
      auth.slice(7),
      new TextEncoder().encode(c.env.JWT_SECRET)
    )
    c.set('userId', Number(payload.sub))
    c.set('email', payload.email as string)
    await next()
  } catch {
    return c.json({ error: 'unauthorized' }, 401)
  }
})

// ── Auth routes ────────────────────────────────────────────────

app.get('/api/auth/google', (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${c.env.FRONTEND_URL}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  })
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

app.get('/api/auth/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.json({ error: 'missing code' }, 400)

  const redirectUri = `${c.env.FRONTEND_URL}/api/auth/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) return c.json({ error: 'token exchange failed' }, 400)
  const { access_token } = await tokenRes.json<{ access_token: string }>()

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!userRes.ok) return c.json({ error: 'failed to get user info' }, 400)
  const g = await userRes.json<{ id: string; email: string; name: string; picture: string }>()

  await c.env.DB.prepare(`
    INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)
    ON CONFLICT(google_id) DO UPDATE SET
      email = excluded.email, name = excluded.name, avatar_url = excluded.avatar_url
  `).bind(g.id, g.email, g.name, g.picture).run()

  const user = await c.env.DB.prepare(
    'SELECT id, email FROM users WHERE google_id = ?'
  ).bind(g.id).first<{ id: number; email: string }>()

  const token = await new SignJWT({ sub: String(user!.id), email: user!.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(new TextEncoder().encode(c.env.JWT_SECRET))

  return c.redirect(`${c.env.FRONTEND_URL}/?token=${token}`)
})

app.get('/api/auth/me', requireAuth, async (c) => {
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, avatar_url FROM users WHERE id = ?'
  ).bind(c.get('userId')).first()
  if (!user) return c.json({ error: 'not found' }, 404)
  return c.json(user)
})

// ── Todo routes ────────────────────────────────────────────────

app.get('/api/todos', requireAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(c.get('userId')).all()
  return c.json((results ?? []).map(r => ({ ...r, done: !!r.done })))
})

app.post('/api/todos', requireAuth, async (c) => {
  const { title } = await c.req.json<{ title?: string }>()
  const trimmed = title?.trim()
  if (!trimmed) return c.json({ error: 'title is required' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO todos (user_id, title) VALUES (?, ?)'
  ).bind(c.get('userId'), trimmed).run()

  const row = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE id = ?'
  ).bind(result.meta.last_row_id).first()

  return c.json({ ...row, done: !!row?.done }, 201)
})

app.patch('/api/todos/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const row = await c.env.DB.prepare(
    'SELECT * FROM todos WHERE id = ? AND user_id = ?'
  ).bind(id, c.get('userId')).first()
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

app.delete('/api/todos/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const result = await c.env.DB.prepare(
    'DELETE FROM todos WHERE id = ? AND user_id = ?'
  ).bind(id, c.get('userId')).run()
  if (result.meta.changes === 0) return c.json({ error: 'not found' }, 404)
  return new Response(null, { status: 204 })
})

export default app
