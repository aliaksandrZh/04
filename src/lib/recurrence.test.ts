import { describe, expect, it } from 'vitest';
import type { RepeatRule } from '../types';
import { addMonthsToDateOnly, nextDueDate, nextReminderAt } from './recurrence';

describe('addMonthsToDateOnly', () => {
  it('clamps to the last day of short months (Jan 31 -> Feb 28)', () => {
    expect(addMonthsToDateOnly('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('clamps across non-leap years (Jan 31 2027 -> Feb 28)', () => {
    expect(addMonthsToDateOnly('2027-01-31', 1)).toBe('2027-02-28');
  });

  it('handles leap years (Jan 31 2028 -> Feb 29)', () => {
    expect(addMonthsToDateOnly('2028-01-31', 1)).toBe('2028-02-29');
  });

  it('clamps Mar 31 -> Apr 30', () => {
    expect(addMonthsToDateOnly('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('keeps ordinary days unchanged (Jan 15 -> Feb 15)', () => {
    expect(addMonthsToDateOnly('2026-01-15', 1)).toBe('2026-02-15');
  });

  it('crosses year boundaries (Nov 20 2026 -> Dec 20, Jan 20)', () => {
    expect(addMonthsToDateOnly('2026-11-20', 1)).toBe('2026-12-20');
    expect(addMonthsToDateOnly('2026-11-20', 2)).toBe('2027-01-20');
  });
});

describe('nextDueDate', () => {
  const cases: Array<[RepeatRule, string | null, string | null, string | null]> = [
    // [rule, dueDate, expected, description]
    ['daily', '2026-05-31', '2026-06-01', 'daily rolls over the month'],
    ['daily', '2026-02-28', '2026-03-01', 'daily handles non-leap February'],
    ['weekly', '2026-01-01', '2026-01-08', 'weekly adds seven days'],
    ['weekly', '2026-12-29', '2027-01-05', 'weekly crosses the year boundary'],
    ['monthly', '2026-01-31', '2026-02-28', 'monthly clamps month-overflow'],
    ['monthly', '2028-01-31', '2028-02-29', 'monthly uses leap-day when applicable'],
  ];

  for (const [rule, dueDate, expected] of cases) {
    it(`${rule}: ${dueDate} -> ${expected}`, () => {
      expect(nextDueDate(dueDate, rule)).toBe(expected);
    });
  }

  it('returns null for rule=none', () => {
    expect(nextDueDate('2026-01-01', 'none')).toBeNull();
  });

  it('returns null when the task has no due date', () => {
    expect(nextDueDate(null, 'daily')).toBeNull();
    expect(nextDueDate(null, 'weekly')).toBeNull();
    expect(nextDueDate(null, 'monthly')).toBeNull();
  });

  it('returns null for malformed date values', () => {
    expect(nextDueDate('2026-13-40', 'daily')).toBeNull();
    expect(nextDueDate('yesterday', 'weekly')).toBeNull();
  });
});

describe('nextReminderAt', () => {
  it('shifts a daily reminder by one day, preserving time', () => {
    expect(nextReminderAt('2026-05-31T09:30', 'daily')).toBe('2026-06-01T09:30');
  });

  it('shifts a weekly reminder by seven days', () => {
    expect(nextReminderAt('2026-12-29T18:00:00', 'weekly')).toBe('2027-01-05T18:00:00');
  });

  it('shifts a monthly reminder with month-end clamping', () => {
    expect(nextReminderAt('2026-01-31T08:15', 'monthly')).toBe('2026-02-28T08:15');
  });

  it('returns null for rule=none, missing reminder or unparseable values', () => {
    expect(nextReminderAt('2026-01-01T09:00', 'none')).toBeNull();
    expect(nextReminderAt(null, 'daily')).toBeNull();
    expect(nextReminderAt('not-a-date', 'daily')).toBeNull();
  });
});
