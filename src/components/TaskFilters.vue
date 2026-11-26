<script setup lang="ts">
import type { TaskFilter } from '../types/task'

const props = defineProps<{
  modelValue: TaskFilter
  counts: Record<TaskFilter, number>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TaskFilter]
}>()

const filters: Array<{ value: TaskFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

function select(value: TaskFilter): void {
  if (value !== props.modelValue) emit('update:modelValue', value)
}
</script>

<template>
  <div class="filters">
    <div class="filter-tabs" role="tablist" aria-label="Task filter">
      <button
        v-for="item in filters"
        :key="item.value"
        type="button"
        role="tab"
        class="filter-tab"
        :class="{ selected: modelValue === item.value }"
        :aria-selected="modelValue === item.value"
        @click="select(item.value)"
      >
        {{ item.label }}
        <span class="filter-count">{{ counts[item.value] }}</span>
      </button>
    </div>
    <p class="remaining" aria-live="polite">
      {{ counts.active }} {{ counts.active === 1 ? 'task' : 'tasks' }} remaining
    </p>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.filter-tabs {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.2rem;
  background: var(--muted);
  border-radius: 10px;
}

.filter-tab {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.filter-tab:hover {
  color: var(--text);
}

.filter-tab.selected {
  background: var(--surface);
  color: var(--accent-strong);
  box-shadow: 0 1px 3px rgb(0 0 0 / 12%);
}

.filter-count {
  display: inline-block;
  min-width: 1.1rem;
  margin-left: 0.2rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: rgb(0 0 0 / 8%);
  font-size: 0.75rem;
  text-align: center;
}

.remaining {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
  white-space: nowrap;
}
</style>
