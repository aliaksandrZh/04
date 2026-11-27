/**
 * Central task state hook: owns the in-memory task list, persists every
 * change to localStorage and implements the domain actions (add / update /
 * delete / complete-toggle with recurrence).
 */

import { useCallback, useRef, useState } from 'react';
import type { Priority, RepeatRule, Task } from '../types';
import { loadTasks, saveTasks } from '../lib/storage';
import { nextDueDate, nextReminderAt } from '../lib/recurrence';
import { validateTaskTitle } from '../lib/validation';

export class TaskValidationError extends Error {}

export type TaskOverrides = Partial<Omit<Task, 'id' | 'title' | 'completed' | 'createdAt' | 'updatedAt'>>;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
}

export function createTask(title: string, overrides?: TaskOverrides): Task {
  const validation = validateTaskTitle(title);
  if (!validation.valid) {
    throw new TaskValidationError(validation.error ?? 'Invalid title.');
  }
  const now = new Date().toISOString();
  const base: Task = {
    id: generateId(),
    title: validation.trimmed,
    notes: '',
    dueDate: null,
    priority: 'none' as Priority,
    tags: [],
    reminderAt: null,
    repeat: 'none' as RepeatRule,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  const task: Task = { ...base, ...overrides };
  task.tags = normalizeTags(task.tags);
  return task;
}

export interface TaskActions {
  addTask: (title: string, overrides?: TaskOverrides) => Task;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>, validateTitle?: boolean) => Task;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
}

export function useTasks(): [Task[], TaskActions] {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  // Mirror of the latest state so actions can read it synchronously.
  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;

  const commit = useCallback((next: Task[]) => {
    tasksRef.current = next;
    setTasks(next);
    saveTasks(next);
  }, []);

  const addTask = useCallback<TaskActions['addTask']>(
    (title, overrides) => {
      const task = createTask(title, overrides);
      // Newest first: unsorted views (input order) show the new task on top.
      commit([task, ...tasksRef.current]);
      return task;
    },
    [commit],
  );

  const updateTask = useCallback<TaskActions['updateTask']>(
    (id, patch, validateTitle = true) => {
      const current = tasksRef.current;
      const index = current.findIndex((t) => t.id === id);
      if (index === -1) throw new Error(`Task not found: ${id}`);
      const next: Task = { ...current[index], ...patch };
      if (patch.title !== undefined) {
        const validation = validateTaskTitle(patch.title);
        if (validateTitle && !validation.valid) {
          throw new TaskValidationError(validation.error ?? 'Invalid title.');
        }
        next.title = validation.trimmed;
      }
      next.tags = normalizeTags(next.tags);
      next.updatedAt = new Date().toISOString();
      commit(current.map((t) => (t.id === id ? next : t)));
      return next;
    },
    [commit],
  );

  const deleteTask = useCallback<TaskActions['deleteTask']>(
    (id) => {
      commit(tasksRef.current.filter((t) => t.id !== id));
    },
    [commit],
  );

  const toggleComplete = useCallback<TaskActions['toggleComplete']>(
    (id) => {
      const task = tasksRef.current.find((t) => t.id === id);
      if (!task) return;
      const now = new Date().toISOString();
      const produced: Task[] = [];
      if (!task.completed) {
        // Completing a repeating task generates the next occurrence (same
        // details, due date and reminder advanced by one interval); the
        // completed instance stays in the Completed section.
        const nextDate = nextDueDate(task.dueDate, task.repeat);
        if (nextDate) {
          produced.push({
            ...task,
            id: generateId(),
            dueDate: nextDate,
            reminderAt: nextReminderAt(task.reminderAt, task.repeat),
            completed: false,
            createdAt: now,
            updatedAt: now,
          });
        }
        produced.push({ ...task, completed: true, updatedAt: now });
      } else {
        produced.push({ ...task, completed: false, updatedAt: now });
      }
      commit([...tasksRef.current.filter((t) => t.id !== id), ...produced]);
    },
    [commit],
  );

  const actions: TaskActions = { addTask, updateTask, deleteTask, toggleComplete };
  return [tasks, actions];
}
