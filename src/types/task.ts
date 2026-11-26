export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskFilter = 'all' | 'active' | 'completed'

export interface Task {
  id: string
  text: string
  completed: boolean
  /** Creation timestamp (ms since epoch). */
  createdAt: number
  priority: TaskPriority
  /** Optional due date in `YYYY-MM-DD` format. */
  dueDate?: string
}
