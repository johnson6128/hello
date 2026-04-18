import { useState, useEffect, useCallback } from 'react'
import type { Todo, User, Filter } from './types'
import { fetchTodos, createTodo, updateTodo, removeTodo } from './storage'
import { fetchMe, setToken, clearToken } from './auth'
import LoginPage from './LoginPage'

const USE_LOCAL = import.meta.env.VITE_STORAGE === 'local'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'active', label: '未完了' },
  { key: 'done', label: '完了済み' },
]

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecking, setAuthChecking] = useState(!USE_LOCAL)
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)

  // Auth check / token pickup after OAuth redirect
  useEffect(() => {
    if (USE_LOCAL) {
      fetchTodos().then(setTodos).finally(() => setLoading(false))
      return
    }

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setToken(token)
      window.history.replaceState({}, '', '/')
    }

    fetchMe()
      .then(setUser)
      .catch(() => {
        clearToken()
        setLoading(false)
      })
      .finally(() => setAuthChecking(false))
  }, [])

  // Fetch todos after user is confirmed
  useEffect(() => {
    if (USE_LOCAL || !user) return
    fetchTodos().then(setTodos).finally(() => setLoading(false))
  }, [user])

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    const todo = await createTodo(title)
    setTodos(prev => [todo, ...prev])
    setNewTitle('')
  }

  const toggleTodo = useCallback(async (id: number, done: boolean) => {
    const updated = await updateTodo(id, done)
    setTodos(prev => prev.map(t => (t.id === id ? updated : t)))
  }, [])

  const deleteTodo = useCallback(async (id: number) => {
    await removeTodo(id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleLogout = () => {
    clearToken()
    setUser(null)
    setTodos([])
  }

  const visible = todos.filter(t => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  const doneCount = todos.filter(t => t.done).length

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    )
  }

  if (!USE_LOCAL && !user) return <LoginPage />

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">TODO 管理</h1>
          {user && (
            <div className="flex items-center gap-3">
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>

        <form onSubmit={addTodo} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="新しいタスクを入力..."
            maxLength={200}
            required
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            追加
          </button>
        </form>

        <div className="flex gap-2 mb-3">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-1.5 rounded-md text-sm border transition-colors ${
                filter === key
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-right text-xs text-gray-400 mb-2">
          {doneCount} / {todos.length} 件完了
        </p>

        {loading ? (
          <p className="text-center text-gray-400 py-8">読み込み中...</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-gray-400 py-8">タスクがありません</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map(todo => (
              <li
                key={todo.id}
                className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm transition-opacity ${
                  todo.done ? 'opacity-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={e => toggleTodo(todo.id, e.target.checked)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0"
                />
                <span
                  className={`flex-1 text-sm text-gray-800 break-words ${
                    todo.done ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none px-1 shrink-0"
                  title="削除"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
