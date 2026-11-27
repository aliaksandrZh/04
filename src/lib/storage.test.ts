import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { STORAGE_KEY, STORAGE_VERSION, loadTasks, parsePayload, saveTasks } from './storage';

/** Minimal in-memory Storage implementation for tests. */
function fakeStorage(initial?: Record<string, string>): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  dump: () => Record<string, string>;
} {
  const map: Record<string, string> = { ...(initial ?? {}) };
  return {
    getItem: (key) => (key in map ? map[key] : null),
    setItem: (key, value) => {
      map[key] = value;
    },
    removeItem: (key) => {
      delete map[key];
    },
    dump: () => ({ ...map }),
  };
}

function makeTask(overrides?: Partial<Task>): Task {
  return {
    id: 't1',
    title: 'Sample task',
    notes: '',
    dueDate: null,
    priority: 'none',
    tags: [],
    reminderAt: null,
    repeat: 'none',
    completed: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('storage round-trip', () => {
  it('saves and loads tasks with the versioned payload', () => {
    const storage = fakeStorage();
    const tasks: Task[] = [
      makeTask(),
      makeTask({ id: 't2', title: 'Second', dueDate: '2026-05-01', priority: 'high', tags: ['work'] }),
    ];
    saveTasks(tasks, storage);
    const raw = JSON.parse(storage.dump()[STORAGE_KEY]);
    expect(raw.version).toBe(STORAGE_VERSION);
    expect(loadTasks(storage)).toEqual(tasks);
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadTasks(fakeStorage())).toEqual([]);
    expect(loadTasks(null)).toEqual([]);
  });

  it('swallows set failures (quota/private mode)', () => {
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => undefined,
    };
    expect(() => saveTasks([makeTask()], broken)).not.toThrow();
  });
});

describe('parsePayload robustness', () => {
  it('returns null for invalid JSON', () => {
    expect(parsePayload('{not json')).toBeNull();
  });

  it('returns null for non-object payloads', () => {
    expect(parsePayload(JSON.stringify('hello'))).toBeNull();
    expect(parsePayload('42')).toBeNull();
  });

  it('rejects payloads with a wrong or missing version', () => {
    expect(parsePayload(JSON.stringify({ version: 999, tasks: [makeTask()] }))).toBeNull();
    expect(parsePayload(JSON.stringify({ tasks: [makeTask()] }))).toBeNull();
  });

  it('filters out task entries with a broken shape instead of crashing', () => {
    const bad = JSON.stringify({
      version: STORAGE_VERSION,
      tasks: [makeTask(), { id: 'x' }, 'garbage', null],
    });
    expect(parsePayload(bad)).toEqual([makeTask()]);
  });

  it('returns null when the key is absent', () => {
    expect(parsePayload(null)).toBeNull();
  });
});
