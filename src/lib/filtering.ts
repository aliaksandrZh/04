/**
 * Pure filtering/sorting logic for the task list (unit-testable).
 */

import type { Priority, SortBy, StatusFilter, Task } from '../types';
import { isOverdue } from './dates';

const PRIORITY_WEIGHT: Record<Priority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export interface FilterSortOptions {
  status: StatusFilter;
  /** Tag to filter by (case-insensitive); null/empty shows all tasks. */
  tag: string | null;
  sortBy: SortBy;
  /** Sort ascending (earliest due date / lowest priority first) by default. */
  sortDescending?: boolean;
}

export const DEFAULT_FILTER_OPTIONS: FilterSortOptions = {
  status: 'all',
  tag: null,
  sortBy: 'dueDate',
  sortDescending: false,
};

/** Matches the status filter (all / active / completed). */
export function matchesStatus(task: Task, status: StatusFilter): boolean {
  switch (status) {
    case 'all':
      return true;
    case 'active':
      return !task.completed;
    case 'completed':
      return task.completed;
    default: {
      const exhaustive: never = status;
      void exhaustive;
      return true;
    }
  }
}

/** True when the task contains the given tag (case-insensitive). */
export function matchesTag(task: Task, tag: string | null): boolean {
  if (!tag) return true;
  const needle = tag.trim().toLowerCase();
  if (needle.length === 0) return true;
  return task.tags.some((t) => t.toLowerCase() === needle);
}

/**
 * Comparator for the chosen sort key.
 * - dueDate: tasks without a due date sort last (regardless of direction);
 * - priority: high > medium > low > none.
 */
export function compareTasks(a: Task, b: Task, sortBy: SortBy): number {
  if (sortBy === 'priority') {
    const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (diff !== 0) return diff;
    return compareByDueDateFallback(a, b);
  }
  return compareByDueDate(a, b);
}

function compareByDueDate(a: Task, b: Task): number {
  if (a.dueDate === b.dueDate) return compareByPriorityFallback(a, b);
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

function compareByDueDateFallback(a: Task, b: Task): number {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

function compareByPriorityFallback(a: Task, b: Task): number {
  const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  return diff;
}

/**
 * Filters and sorts a task list. Stable regarding input order for ties.
 */
export function applyFilterSort(tasks: Task[], options: FilterSortOptions): Task[] {
  const filtered = tasks.filter(
    (task) => matchesStatus(task, options.status) && matchesTag(task, options.tag),
  );
  const sorted = filtered.slice().sort((a, b) => compareTasks(a, b, options.sortBy));
  if (options.sortDescending) {
    // Due-date "descending" must keep no-due-date tasks last.
    if (options.sortBy === 'dueDate') {
      sorted.sort((a, b) => {
        if (a.dueDate !== null && b.dueDate !== null) {
          return a.dueDate === b.dueDate ? 0 : a.dueDate < b.dueDate ? 1 : -1;
        }
        if (a.dueDate === null && b.dueDate === null) return 0;
        return a.dueDate === null ? 1 : -1;
      });
    } else {
      sorted.reverse();
    }
  }
  return sorted;
}

/** Tasks due today or earlier that are not completed (dashboard count). */
export function countOverdue(tasks: Task[], reference: string): number {
  return tasks.filter((t) => !t.completed && isOverdue(t.dueDate, reference)).length;
}
