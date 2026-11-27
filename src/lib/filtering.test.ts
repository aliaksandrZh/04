import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { applyFilterSort, countOverdue, DEFAULT_FILTER_OPTIONS } from './filtering';
import { matchesStatus, matchesTag } from './filtering';

function makeTask(overrides?: Partial<Task>): Task {
  return {
    id: 't',
    title: 'Task',
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

describe('matchesStatus', () => {
  const active = makeTask({ completed: false, id: 'a' });
  const done = makeTask({ completed: true, id: 'b' });

  it('shows everything for "all"', () => {
    expect(matchesStatus(active, 'all')).toBe(true);
    expect(matchesStatus(done, 'all')).toBe(true);
  });

  it('filters active and completed separately', () => {
    expect(matchesStatus(active, 'active')).toBe(true);
    expect(matchesStatus(done, 'active')).toBe(false);
    expect(matchesStatus(done, 'completed')).toBe(true);
    expect(matchesStatus(active, 'completed')).toBe(false);
  });
});

describe('matchesTag', () => {
  it('matches case-insensitively', () => {
    const task = makeTask({ tags: ['Work'] });
    expect(matchesTag(task, 'work')).toBe(true);
    expect(matchesTag(task, 'WORK')).toBe(true);
    expect(matchesTag(task, 'home')).toBe(false);
  });

  it('passes all tasks when the tag filter is empty', () => {
    expect(matchesTag(makeTask(), null)).toBe(true);
    expect(matchesTag(makeTask(), '')).toBe(true);
  });
});

describe('applyFilterSort — sorting', () => {
  const tasks = [
    makeTask({ id: 'late', dueDate: '2026-03-10' }),
    makeTask({ id: 'early', dueDate: '2026-02-01' }),
    makeTask({ id: 'none', dueDate: null }),
    makeTask({ id: 'mid', dueDate: '2026-02-20' }),
  ];

  it('sorts by due date ascending with no-due-date tasks last', () => {
    const ids = applyFilterSort(tasks, { ...DEFAULT_FILTER_OPTIONS }).map((t) => t.id);
    expect(ids).toEqual(['early', 'mid', 'late', 'none']);
  });

  it('sorts by due date descending with no-due-date tasks still last', () => {
    const ids = applyFilterSort(tasks, {
      ...DEFAULT_FILTER_OPTIONS,
      sortDescending: true,
    }).map((t) => t.id);
    expect(ids).toEqual(['late', 'mid', 'early', 'none']);
  });

  it('sorts by priority high -> none', () => {
    const priorityTasks = [
      makeTask({ id: 'low', priority: 'low' }),
      makeTask({ id: 'high', priority: 'high' }),
      makeTask({ id: 'none', priority: 'none' }),
      makeTask({ id: 'medium', priority: 'medium' }),
    ];
    const ids = applyFilterSort(priorityTasks, {
      ...DEFAULT_FILTER_OPTIONS,
      sortBy: 'priority',
    }).map((t) => t.id);
    expect(ids).toEqual(['high', 'medium', 'low', 'none']);
  });

  it('breaks due-date ties by priority (higher first)', () => {
    const tied = [
      makeTask({ id: 'low', priority: 'low', dueDate: '2026-02-01' }),
      makeTask({ id: 'high', priority: 'high', dueDate: '2026-02-01' }),
    ];
    const ids = applyFilterSort(tied, { ...DEFAULT_FILTER_OPTIONS }).map((t) => t.id);
    expect(ids).toEqual(['high', 'low']);
  });
});

describe('applyFilterSort — filtering', () => {
  const tasks = [
    makeTask({ id: 'work-active', tags: ['work'], completed: false }),
    makeTask({ id: 'work-done', tags: ['work'], completed: true }),
    makeTask({ id: 'home-active', tags: ['home'], completed: false }),
    makeTask({ id: 'untagged', tags: [], completed: false }),
  ];

  it('filters by status', () => {
    const ids = applyFilterSort(tasks, { ...DEFAULT_FILTER_OPTIONS, status: 'completed' }).map(
      (t) => t.id,
    );
    expect(ids).toEqual(['work-done']);
  });

  it('filters by tag', () => {
    const ids = applyFilterSort(tasks, { ...DEFAULT_FILTER_OPTIONS, tag: 'work' }).map((t) => t.id);
    expect(ids).toEqual(['work-active', 'work-done']);
  });

  it('combines status and tag filters', () => {
    const ids = applyFilterSort(tasks, {
      ...DEFAULT_FILTER_OPTIONS,
      status: 'active',
      tag: 'work',
    }).map((t) => t.id);
    expect(ids).toEqual(['work-active']);
  });

  it('never mutates the input array', () => {
    const copy = JSON.parse(JSON.stringify(tasks)) as Task[];
    applyFilterSort(tasks, { ...DEFAULT_FILTER_OPTIONS, sortDescending: true });
    expect(tasks).toEqual(copy);
  });
});

describe('countOverdue', () => {
  it('counts only active tasks with a past due date', () => {
    const tasks = [
      makeTask({ id: 'overdue', dueDate: '2026-01-01' }),
      makeTask({ id: 'done-overdue', dueDate: '2026-01-01', completed: true }),
      makeTask({ id: 'future', dueDate: '2026-12-31' }),
      makeTask({ id: 'nodate', dueDate: null }),
    ];
    expect(countOverdue(tasks, '2026-06-01')).toBe(1);
  });
});
