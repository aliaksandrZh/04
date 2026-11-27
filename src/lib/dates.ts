/**
 * Date helpers for date-only (`YYYY-MM-DD`) strings and reminder datetimes.
 * All math is done in UTC on the calendar components of the local date so
 * results are timezone-independent and free of DST drift.
 */

/** Formats a Date as a date-only string using its local calendar components. */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local calendar date for "today" as a `YYYY-MM-DD` string. */
export function today(): string {
  return toDateOnly(new Date());
}

/** Parses `YYYY-MM-DD` into local-midnight Date. Returns null for invalid input. */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

/**
 * True when the due date is strictly before today (overdue).
 */
export function isOverdue(dueDate: string | null, reference: string = today()): boolean {
  if (!dueDate) return false;
  const due = parseDateOnly(dueDate);
  const now = parseDateOnly(reference);
  if (!due || !now) return false;
  return due.getTime() < now.getTime();
}

/** Human-friendly label for a due-date badge. */
export function formatDueDate(dueDate: string): string {
  const due = parseDateOnly(dueDate);
  if (!due) return dueDate;
  const ref = today();
  if (dueDate === ref) return 'Today';
  const tomorrow = addDaysToDateOnly(ref, 1);
  if (dueDate === tomorrow) return 'Tomorrow';
  if (isOverdue(dueDate)) return `Overdue: ${dueDate}`;
  return dueDate;
}

/** Adds n calendar days to a date-only string. */
export function addDaysToDateOnly(value: string, days: number): string {
  const date = parseDateOnly(value);
  if (!date) throw new Error(`Invalid date-only value: ${value}`);
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}
