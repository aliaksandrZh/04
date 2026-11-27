/**
 * Reminder scheduler: polls reminder timestamps every 30 seconds while the
 * app is open and fires an alert for each reminder that has come due on a
 * non-completed task.
 *
 * LIMITATION: reminders only fire while the app/tab is open — a backend with
 * push/email delivery is out of scope.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Task } from '../types';

export type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

/** Period between reminder scans (ms). */
export const REMINDER_POLL_INTERVAL_MS = 30_000;

export interface FiredReminder {
  /** Task id the alert refers to. */
  taskId: string;
  /** Snapshot of the alert text (title is editable, so keep a copy). */
  title: string;
  reminderAt: string;
}

function currentPermission(): NotificationPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

function reminderKey(task: Task): string {
  return `${task.id}@${task.reminderAt ?? ''}`;
}

export interface RemindersApi {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  /** Alerts that fired and have not been dismissed yet. */
  active: FiredReminder[];
  dismiss: (taskId: string) => void;
  /** Timestamps of the most recent scan, for the footer hint. */
  lastScannedAt: number | null;
}

/**
 * Watches task reminders. An alert fires once per (task, reminderAt) pair;
 * re-editing the reminder re-arms it.
 */
export function useReminders(tasks: Task[]): RemindersApi {
  const [permission, setPermission] = useState<NotificationPermission>(currentPermission);
  const [active, setActive] = useState<FiredReminder[]>([]);
  const [lastScannedAt, setLastScannedAt] = useState<number | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;

  const scan = useCallback(() => {
    const now = new Date();
    setLastScannedAt(now.getTime());
    const due: FiredReminder[] = [];
    for (const task of tasksRef.current) {
      if (task.completed || !task.reminderAt) continue;
      const key = reminderKey(task);
      if (firedRef.current.has(key)) continue;
      const reminderAt = new Date(task.reminderAt);
      if (Number.isNaN(reminderAt.getTime()) || reminderAt.getTime() > now.getTime()) continue;
      firedRef.current.add(key);
      const reminder: FiredReminder = { taskId: task.id, title: task.title, reminderAt: task.reminderAt };
      due.push(reminder);
    }
    if (due.length === 0) return;
    setActive((prev) => [...prev, ...due]);
    if (permission === 'granted') {
      for (const reminder of due) {
        try {
          void new Notification('Task reminder', {
            body: reminder.title,
            tag: reminder.taskId,
          });
        } catch {
          // Notification constructor failing (e.g. SW-less Android) is not fatal:
          // the in-app banner is always shown as well.
        }
      }
    }
  }, [permission]);

  // Drop fired-records whose reminder time was edited away, so a changed
  // reminder can fire again.
  useEffect(() => {
    const keys = new Set(tasks.filter((t) => t.reminderAt && !t.completed).map(reminderKey));
    for (const key of Array.from(firedRef.current)) {
      if (!keys.has(key)) firedRef.current.delete(key);
    }
  }, [tasks]);

  const requestPermission = useCallback(async () => {
    if (currentPermission() === 'unsupported') return;
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      setPermission(currentPermission());
    }
  }, []);

  const dismiss = useCallback((taskId: string) => {
    setActive((prev) => prev.filter((r) => r.taskId !== taskId));
  }, []);

  useEffect(() => {
    scan();
    const interval = setInterval(scan, REMINDER_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [scan]);

  return useMemo(
    () => ({ permission, requestPermission, active, dismiss, lastScannedAt }),
    [permission, requestPermission, active, dismiss, lastScannedAt],
  );
}
