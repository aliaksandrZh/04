/**
 * Versioned localStorage persistence module for tasks.
 *
 * The persisted payload is `{ version, tasks }`. Unknown/unloadable
 * structures degrade gracefully to an empty list rather than crashing.
 */

import type { Task } from '../types';
import { isPriority, isRepeatRule } from '../types';

export const STORAGE_KEY = 'todo-app.tasks.v1';
export const STORAGE_VERSION = 1;

/** Persistence boundary, injectable so tests can run without a browser. */
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PersistedPayload {
  version: number;
  tasks: Task[];
}

function defaultStorage(): KVStorage | null {
  if (typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage;
  }
  return null;
}

/** Minimal structural check so corrupt payloads never crash the app. */
function isTaskLike(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    isPriority(task.priority) &&
    isRepeatRule(task.repeat) &&
    Array.isArray(task.tags)
  );
}

/** Parses and validates a raw payload string; returns tasks or null. */
export function parsePayload(raw: string | null): Task[] | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const payload = parsed as Record<string, unknown>;
    if (payload.version !== STORAGE_VERSION || !Array.isArray(payload.tasks)) return null;
    return payload.tasks.filter(isTaskLike);
  } catch {
    return null;
  }
}

/** Loads all tasks; returns an empty array when nothing/corrupt data is stored. */
export function loadTasks(storage: KVStorage | null = defaultStorage()): Task[] {
  if (!storage) return [];
  const tasks = parsePayload(storage.getItem(STORAGE_KEY));
  return tasks ?? [];
}

/** Serializes and persists tasks. Failures (quota, private mode) are swallowed. */
export function saveTasks(tasks: Task[], storage: KVStorage | null = defaultStorage()): void {
  if (!storage) return;
  const payload: PersistedPayload = { version: STORAGE_VERSION, tasks };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable (quota exceeded / disabled): keep the app usable
    // with in-memory state only.
  }
}
