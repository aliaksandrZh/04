import { computed, ref, watch } from 'vue'
import type { Task, TaskFilter, TaskPriority } from '../types/task'

const STORAGE_KEY = 'vue-todo.tasks.v1'

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Defensively coerce a stored JSON value into a Task (returns null for junk). */
function toTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (typeof record.text !== 'string' || record.text.trim() === '') return null
  return {
    id: typeof record.id === 'string' && record.id ? record.id : createId(),
    text: record.text,
    completed: record.completed === true,
    createdAt: typeof record.createdAt === 'number' ? record.createdAt : Date.now(),
    priority:
      record.priority === 'low' || record.priority === 'medium' || record.priority === 'high'
        ? record.priority
        : 'low',
    dueDate: typeof record.dueDate === 'string' && record.dueDate ? record.dueDate : undefined,
  }
}

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map(toTask).filter((task): task is Task => task !== null)
  } catch {
    return []
  }
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2 }

/**
 * Single source of truth for the task list.
 * Tasks are stored as an array so the DOM order (and drag & drop
 * reordering) is preserved, and persisted to localStorage on every change.
 */
export function useTasks() {
  const tasks = ref<Task[]>(loadTasks())
  const filter = ref<TaskFilter>('all')

  const visibleTasks = computed<Task[]>(() => {
    switch (filter.value) {
      case 'active':
        return tasks.value.filter((task) => !task.completed)
      case 'completed':
        return tasks.value.filter((task) => task.completed)
      default:
        return tasks.value
    }
  })

  const remaining = computed(() => tasks.value.filter((task) => !task.completed).length)
  const completedCount = computed(() => tasks.value.length - remaining.value)
  const counts = computed<Record<TaskFilter, number>>(() => ({
    all: tasks.value.length,
    active: remaining.value,
    completed: completedCount.value,
  }))

  const canMarkAll = computed(() => tasks.value.length > 0 && remaining.value > 0)

  // Persist on every (deep) change of the task list.
  watch(
    tasks,
    (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        // Storage may be unavailable (private mode / quota); app still works in-memory.
      }
    },
    { deep: true },
  )

  function find(id: string): Task | undefined {
    return tasks.value.find((task) => task.id === id)
  }

  /** Add a task; returns false (and adds nothing) when the text is empty. */
  function add(text: string, priority: TaskPriority = 'low', dueDate?: string): boolean {
    const trimmed = text.trim()
    if (!trimmed) return false
    tasks.value.push({
      id: createId(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
      priority: PRIORITY_WEIGHT[priority] !== undefined ? priority : 'low',
      dueDate: dueDate?.trim() ? dueDate.trim() : undefined,
    })
    return true
  }

  function toggle(id: string): void {
    const task = find(id)
    if (task) task.completed = !task.completed
  }

  function remove(id: string): void {
    tasks.value = tasks.value.filter((task) => task.id !== id)
  }

  function updateText(id: string, text: string): void {
    const task = find(id)
    const trimmed = text.trim()
    if (task && trimmed) task.text = trimmed
  }

  function setPriority(id: string, priority: TaskPriority): void {
    const task = find(id)
    if (task) task.priority = priority
  }

  function clearCompleted(): void {
    tasks.value = tasks.value.filter((task) => !task.completed)
  }

  function markAllCompleted(): void {
    tasks.value.forEach((task) => {
      task.completed = true
    })
  }

  /**
   * Move `id` next to `targetId`: before it when `before` is true,
   * otherwise after it. Used by drag & drop reordering.
   */
  function move(id: string, targetId: string, before: boolean): void {
    if (id === targetId) return
    const fromIndex = tasks.value.findIndex((task) => task.id === id)
    if (fromIndex === -1) return
    const [dragged] = tasks.value.splice(fromIndex, 1)
    const targetIndex = tasks.value.findIndex((task) => task.id === targetId)
    if (targetIndex === -1) {
      tasks.value.splice(fromIndex, 0, dragged)
      return
    }
    tasks.value.splice(before ? targetIndex : targetIndex + 1, 0, dragged)
  }

  return {
    tasks,
    filter,
    visibleTasks,
    counts,
    remaining,
    completedCount,
    canMarkAll,
    add,
    toggle,
    remove,
    updateText,
    setPriority,
    clearCompleted,
    markAllCompleted,
    move,
  }
}
