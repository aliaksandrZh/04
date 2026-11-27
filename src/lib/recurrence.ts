/**
 * Recurrence math: computes the next occurrence of a task when a repeating
 * task is completed. All operations work on `YYYY-MM-DD` date-only strings
 * using local calendar components (no timezone conversion).
 */

import type { RepeatRule } from '../types';
import { addDaysToDateOnly, parseDateOnly, toDateOnly } from './dates';

/** Number of days in a given (1-based) month of a year. */
function daysInMonth(year: number, month1Based: number): number {
  // Day 0 of the next month = last day of this month.
  return new Date(year, month1Based, 0).getDate();
}

/**
 * Adds months to a date-only string with end-of-month clamping:
 * Jan 31 -> Feb 28/29, Mar 31 -> Apr 30, May 31 -> Jun 30, etc.
 * The resulting day never exceeds the length of the target month.
 */
export function addMonthsToDateOnly(value: string, months: number): string {
  const date = parseDateOnly(value);
  if (!date) throw new Error(`Invalid date-only value: ${value}`);
  const originalDay = date.getDate();
  const targetMonthIndex = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(originalDay, daysInMonth(targetYear, normalizedMonthIndex + 1));
  const result = new Date(targetYear, normalizedMonthIndex, clampedDay);
  return toDateOnly(result);
}

/**
 * Next occurrence date for a repeating task given its current due date.
 * Returns null when the rule is `none`, the task has no due date, or the
 * input is invalid — such tasks simply complete without generating a successor.
 */
export function nextDueDate(dueDate: string | null | undefined, rule: RepeatRule): string | null {
  if (rule === 'none' || !dueDate) return null;
  const date = parseDateOnly(dueDate);
  if (!date) return null;
  switch (rule) {
    case 'daily':
      return addDaysToDateOnly(dueDate, 1);
    case 'weekly':
      return addDaysToDateOnly(dueDate, 7);
    case 'monthly':
      return addMonthsToDateOnly(dueDate, 1);
    default:
      return null;
  }
}

/**
 * Shifts a reminder datetime (`YYYY-MM-DDTHH:mm[:ss]`, local wall-clock)
 * forward by the same interval as the recurrence rule, preserving the time
 * of day. Returns null when there is no reminder, no rule, or the value is
 * not parseable.
 */
export function nextReminderAt(
  reminderAt: string | null | undefined,
  rule: RepeatRule,
): string | null {
  if (rule === 'none' || !reminderAt) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(reminderAt);
  if (!match) return null;
  const [, y, m, d, hh, mm, ss] = match;
  const dateOnly = `${y}-${m}-${d}`;
  let nextDate: string | null;
  switch (rule) {
    case 'daily':
      nextDate = nextDueDate(dateOnly, 'daily');
      break;
    case 'weekly':
      nextDate = nextDueDate(dateOnly, 'weekly');
      break;
    case 'monthly':
      nextDate = addMonthsToDateOnly(dateOnly, 1);
      break;
    default:
      nextDate = null;
  }
  if (!nextDate) return null;
  const timePart = `${hh}:${mm}${ss ? `:${ss}` : ''}`;
  return `${nextDate}T${timePart}`;
}
