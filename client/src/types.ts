export interface Todo {
  id: number
  title: string
  done: boolean
  created_at: string
}

export type Filter = 'all' | 'active' | 'done'
