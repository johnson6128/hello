export interface Todo {
  id: number
  title: string
  done: boolean
  created_at: string
}

export interface User {
  id: number
  email: string
  name: string
  avatar_url: string | null
}

export type Filter = 'all' | 'active' | 'done'
