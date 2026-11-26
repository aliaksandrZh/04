<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task, TaskFilter, TaskPriority } from '../types/task'
import TaskItem from './TaskItem.vue'

const props = defineProps<{
  tasks: Task[]
  filter: TaskFilter
  enableDrag: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
  update: [id: string, text: string]
  'priority-change': [id: string, priority: TaskPriority]
  reorder: [id: string, targetId: string, before: boolean]
}>()

const draggingId = ref<string | null>(null)

const emptyMessage = computed(() => {
  switch (props.filter) {
    case 'active':
      return 'No active tasks. Great job!'
    case 'completed':
      return 'No completed tasks yet.'
    default:
      return 'No tasks yet — add your first task above.'
  }
})

function onDragStart(id: string): void {
  draggingId.value = id
}

/** Live reorder: drop the dragged task before/after the hovered item based on the pointer's half. */
function onDragOver(id: string, event: DragEvent): void {
  if (!draggingId.value || draggingId.value === id) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const before = event.clientY < rect.top + rect.height / 2
  emit('reorder', draggingId.value, id, before)
}

function onDragEnd(): void {
  draggingId.value = null
}
</script>

<template>
  <section class="list-section">
    <TransitionGroup v-if="tasks.length" tag="ul" name="task" class="task-list">
      <TaskItem
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :draggable="enableDrag"
        @toggle="(id) => emit('toggle', id)"
        @remove="(id) => emit('remove', id)"
        @update="(id, text) => emit('update', id, text)"
        @priority-change="(id, priority) => emit('priority-change', id, priority)"
        @dragstart="onDragStart"
        @dragover="onDragOver"
        @dragend="onDragEnd"
      />
    </TransitionGroup>
    <p v-else class="empty-state">{{ emptyMessage }}</p>
  </section>
</template>

<style scoped>
.task-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.empty-state {
  margin: 1.5rem 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  text-align: center;
}

/* <TransitionGroup> animations for add / remove / reorder */
.task-enter-active,
.task-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.task-enter-from,
.task-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.task-leave-active {
  position: absolute;
  width: 100%;
}

.task-move {
  transition: transform 0.25s ease;
}
</style>
