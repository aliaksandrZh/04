<script setup lang="ts">
import { ref } from 'vue'
import type { TaskPriority } from '../types/task'

const emit = defineEmits<{
  add: [text: string, priority: TaskPriority, dueDate?: string]
}>()

const text = ref('')
const priority = ref<TaskPriority>('low')
const dueDate = ref('')
const error = ref('')

function onInput(): void {
  if (error.value && text.value.trim()) error.value = ''
}

function submit(): void {
  const trimmed = text.value.trim()
  if (!trimmed) {
    error.value = 'Task text cannot be empty.'
    return
  }
  emit('add', trimmed, priority.value, dueDate.value || undefined)
  text.value = ''
  priority.value = 'low'
  dueDate.value = ''
  error.value = ''
}
</script>

<template>
  <form class="add-form" @submit.prevent="submit">
    <div class="add-row">
      <input
        v-model="text"
        class="add-input"
        type="text"
        placeholder="What needs to be done?"
        aria-label="New task text"
        @input="onInput"
      />
      <select v-model="priority" class="add-select" aria-label="Task priority">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input v-model="dueDate" class="add-date" type="date" aria-label="Due date" />
      <button class="add-button" type="submit">Add</button>
    </div>
    <p v-if="error" class="add-error" role="alert">{{ error }}</p>
  </form>
</template>

<style scoped>
.add-form {
  margin-bottom: 1rem;
}

.add-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.add-input {
  flex: 1 1 220px;
  min-width: 0;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 0.95rem;
  background: var(--surface);
  color: var(--text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.add-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.add-select,
.add-date {
  padding: 0.55rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.9rem;
}

.add-select:focus,
.add-date:focus {
  outline: none;
  border-color: var(--accent);
}

.add-button {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.add-button:hover {
  background: var(--accent-strong);
}

.add-button:active {
  transform: scale(0.97);
}

.add-error {
  margin: 0.5rem 0 0;
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
