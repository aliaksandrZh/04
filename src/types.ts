/**
 * Task model and related enum types for the to-do app.
 */

/**
 * Task priority levels. `none` is the default and sorts below medium/low/high.
 */
export type Priority = 'none' | 'low' | 'medium' | 'high';

/**
 * Recurrence rule for a task. A non-`none` rule causes the next occurrence
 * to be generated automatically when the task is marked complete.
 */
export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

/**
 * Date-only string in `YYYY-MM-DD` form (local calendar date, no timezone).
 */
export type DateOnly = string;

/**
 * The core task persisted in localStorage.
 */
export interface Task {
  id: string;
  /** Required display title. Never empty or whitespace-only. */
  title: string;
  /** Free-form notes (optional). */
  notes: string;
  /** Optional due date, date-only `YYYY-MM-DD`. */
  dueDate: DateOnly | null;
  /** Priority (defaults to `none`). */
  priority: Priority;
  /** Zero or more tags (lowercase, trimmed). */
  tags: string[];
  /**
   * Optional reminder date/time as an ISO 8601 datetime string
   * (local wall-clock, as produced by `<input type="datetime-local">`).
   */
  reminderAt: string | null;
  /** Recurrence rule (defaults to `none`). */
  repeat: RepeatRule;
  /** Whether the task is completed. */
  completed: boolean;
  /** Creation timestamp (ISO string). */
  createdAt: string;
  /** Last-update timestamp (ISO string). */
  updatedAt: string;
}

/** Filter by completion status. */
export type StatusFilter = 'all' | 'active' | 'completed';

/** Sort keys supported by the task list. */
export type SortBy = 'dueDate' | 'priority';

export const PRIORITIES: readonly Priority[] = ['none', 'low', 'medium', 'high'];
export const REPEAT_RULES: readonly RepeatRule[] = ['none', 'daily', 'weekly', 'monthly'];

export function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value);
}

export function isRepeatRule(value: unknown): value is RepeatRule {
  return typeof value === 'string' && (REPEAT_RULES as readonly string[]).includes(value);
}
