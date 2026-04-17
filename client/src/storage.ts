import type { Todo } from './types'

const USE_LOCAL = import.meta.env.VITE_STORAGE === 'local'
const API_BASE = import.meta.env.VITE_API_URL ?? ''
const STORAGE_KEY = 'todos_v1'

function loadLocal(): Todo[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

function saveLocal(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function nextId(todos: Todo[]): number {
  return todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1
}

export async function fetchTodos(): Promise<Todo[]> {
  if (USE_LOCAL) return loadLocal()
  const res = await fetch(`${API_BASE}/api/todos`)
  return res.json()
}

export async function createTodo(title: string): Promise<Todo> {
  if (USE_LOCAL) {
    const todos = loadLocal()
    const todo: Todo = {
      id: nextId(todos),
      title,
      done: false,
      created_at: new Date().toISOString(),
    }
    saveLocal([todo, ...todos])
    return todo
  }
  const res = await fetch(`${API_BASE}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  return res.json()
}

export async function updateTodo(id: number, done: boolean): Promise<Todo> {
  if (USE_LOCAL) {
    const todos = loadLocal()
    const updated = { ...todos.find(t => t.id === id)!, done }
    saveLocal(todos.map(t => (t.id === id ? updated : t)))
    return updated
  }
  const res = await fetch(`${API_BASE}/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  })
  return res.json()
}

export async function removeTodo(id: number): Promise<void> {
  if (USE_LOCAL) {
    saveLocal(loadLocal().filter(t => t.id !== id))
    return
  }
  await fetch(`${API_BASE}/api/todos/${id}`, { method: 'DELETE' })
}
