<script setup lang="ts">
import { computed } from 'vue'
import AddTaskForm from './components/AddTaskForm.vue'
import TaskFilters from './components/TaskFilters.vue'
import TaskList from './components/TaskList.vue'
import type { TaskPriority } from './types/task'
import { useTasks } from './composables/useTasks'

const {
  tasks,
  filter,
  visibleTasks,
  counts,
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
} = useTasks()

// Native drag & drop reordering only makes sense in the unfiltered view.
const enableDrag = computed(() => filter.value === 'all' && tasks.value.length > 1)

function onAdd(text: string, priority: TaskPriority, dueDate?: string): void {
  add(text, priority, dueDate)
}

function onReorder(id: string, targetId: string, before: boolean): void {
  move(id, targetId, before)
}
</script>

<template>
  <main class="app">
    <header class="app-header">
      <h1 class="app-title">ToDo</h1>
      <p class="app-subtitle">Vue 3 · Composition API — saved automatically to localStorage</p>
    </header>

    <section class="panel">
      <AddTaskForm @add="onAdd" />
      <TaskFilters v-model="filter" :counts="counts" />
      <TaskList
        :tasks="visibleTasks"
        :filter="filter"
        :enable-drag="enableDrag"
        @toggle="toggle"
        @remove="remove"
        @update="updateText"
        @priority-change="setPriority"
        @reorder="onReorder"
      />
      <footer class="bulk-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="!canMarkAll"
          @click="markAllCompleted"
        >
          Mark all as completed
        </button>
        <button
          class="secondary-button danger"
          type="button"
          :disabled="completedCount === 0"
          @click="clearCompleted"
        >
          Clear completed ({{ completedCount }})
        </button>
      </footer>
    </section>

    <p class="hint">Tip: double-click a task text to edit · drag tasks to reorder (All view)</p>
  </main>
</template>

<style scoped>
.app {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 2.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.app-header {
  text-align: center;
}

.app-title {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent-strong), var(--high));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.app-subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 10px 30px rgb(15 23 42 / 8%);
}

.bulk-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.secondary-button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.secondary-button:hover:not(:disabled) {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-strong);
}

.secondary-button.danger:hover:not(:disabled) {
  background: var(--high-soft);
  border-color: var(--high);
  color: var(--high);
}

.secondary-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
}
</style>
