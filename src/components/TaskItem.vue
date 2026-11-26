<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task, TaskPriority } from '../types/task'

const props = defineProps<{
  task: Task
  draggable: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
  update: [id: string, text: string]
  'priority-change': [id: string, priority: TaskPriority]
  dragstart: [id: string]
  dragover: [id: string, event: DragEvent]
  dragend: []
}>()

const editing = ref(false)
const draft = ref('')
const editInput = ref<HTMLInputElement | null>(null)

const today = (): string => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const isOverdue = computed(
  () => !props.task.completed && props.task.dueDate !== undefined && props.task.dueDate < today(),
)

const createdAtLabel = computed(() =>
  new Date(props.task.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }),
)

const dueDateLabel = computed(() => {
  if (!props.task.dueDate) return ''
  const date = new Date(`${props.task.dueDate}T00:00:00`)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})

function startEdit(): void {
  draft.value = props.task.text
  editing.value = true
  requestAnimationFrame(() => {
    editInput.value?.focus()
    editInput.value?.select()
  })
}

function saveEdit(): void {
  if (!editing.value) return
  editing.value = false
  emit('update', props.task.id, draft.value)
}

function cancelEdit(): void {
  editing.value = false
}

function onEditKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveEdit()
  } else if (event.key === 'Escape') {
    cancelEdit()
  }
}

function onPriorityChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as TaskPriority
  emit('priority-change', props.task.id, value)
}
</script>

<template>
  <li
    class="task-item"
    :class="[`priority-${task.priority}`, { completed: task.completed, 'is-draggable': draggable }]"
    :draggable="draggable && !editing"
    @dragstart="emit('dragstart', task.id)"
    @dragover.prevent="emit('dragover', task.id, $event)"
    @drop.prevent
    @dragend="emit('dragend')"
  >
    <input
      class="task-checkbox"
      type="checkbox"
      :checked="task.completed"
      :aria-label="task.completed ? 'Mark task as active' : 'Mark task as completed'"
      @change="emit('toggle', task.id)"
    />

    <div class="task-body">
      <input
        v-if="editing"
        ref="editInput"
        v-model="draft"
        class="task-edit-input"
        type="text"
        aria-label="Edit task text"
        @keydown="onEditKeydown"
        @blur="saveEdit"
      />
      <span v-else class="task-text" title="Double-click to edit" @dblclick="startEdit">{{
        task.text
      }}</span>

      <div class="task-meta">
        <span class="priority-badge" :class="`badge-${task.priority}`">
          <span class="priority-dot" aria-hidden="true"></span>{{ task.priority }}
        </span>
        <span class="meta-item" :title="`Created ${createdAtLabel}`">{{ createdAtLabel }}</span>
        <span
          v-if="task.dueDate"
          class="meta-item due"
          :class="{ overdue: isOverdue }"
        >
          {{ isOverdue ? 'Overdue' : 'Due' }} {{ dueDateLabel }}
        </span>
      </div>
    </div>

    <div class="task-actions">
      <select
        class="priority-select"
        :value="task.priority"
        aria-label="Change priority"
        title="Change priority"
        @change="onPriorityChange"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button
        class="icon-button edit-button"
        type="button"
        title="Edit task"
        aria-label="Edit task"
        @click="startEdit"
      >
        ✎
      </button>
      <button
        class="icon-button delete-button"
        type="button"
        title="Delete task"
        aria-label="Delete task"
        @click="emit('remove', task.id)"
      >
        ✕
      </button>
    </div>
  </li>
</template>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--priority-color);
  border-radius: 10px;
  transition: box-shadow 0.15s ease, background 0.15s ease;
}

.task-item.is-draggable {
  cursor: grab;
}

.task-item.is-draggable:active {
  cursor: grabbing;
}

.task-item.priority-low {
  --priority-color: var(--low);
}

.task-item.priority-medium {
  --priority-color: var(--medium);
}

.task-item.priority-high {
  --priority-color: var(--high);
}

.task-item:hover {
  box-shadow: 0 2px 10px rgb(0 0 0 / 8%);
}

.task-checkbox {
  width: 1.15rem;
  height: 1.15rem;
  flex-shrink: 0;
  accent-color: var(--accent);
  cursor: pointer;
}

.task-body {
  flex: 1 1 auto;
  min-width: 0;
}

.task-text {
  display: block;
  overflow-wrap: anywhere;
  font-size: 0.95rem;
  color: var(--text);
}

.task-item.completed .task-text {
  color: var(--text-muted);
  text-decoration: line-through;
}

.task-edit-input {
  width: 100%;
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--accent);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text);
  background: var(--surface);
}

.task-edit-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: capitalize;
}

.priority-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--priority-color);
}

.badge-low {
  color: var(--low);
  background: var(--low-soft);
}

.badge-medium {
  color: var(--medium);
  background: var(--medium-soft);
}

.badge-high {
  color: var(--high);
  background: var(--high-soft);
}

.meta-item {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.meta-item.due {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: var(--muted);
}

.meta-item.due.overdue {
  color: white;
  background: var(--high);
  font-weight: 600;
}

.task-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
  opacity: 0.45;
  transition: opacity 0.15s ease;
}

.priority-select {
  padding: 0.25rem 0.35rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: capitalize;
  cursor: pointer;
}

.task-item:hover .task-actions,
.task-item:focus-within .task-actions {
  opacity: 1;
}

.icon-button {
  width: 1.9rem;
  height: 1.9rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.edit-button:hover {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.delete-button:hover {
  background: var(--high-soft);
  color: var(--high);
}
</style>
