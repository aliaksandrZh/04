/**
 * In-app fallback/adjunct for fired reminders: visible even when browser
 * notifications are blocked or unsupported.
 */

import type { FiredReminder } from '../hooks/useReminders';

interface ReminderBannerProps {
  reminders: FiredReminder[];
  permissionHint?: string;
  onDismiss: (taskId: string) => void;
}

export default function ReminderBanner({ reminders, permissionHint, onDismiss }: ReminderBannerProps) {
  if (reminders.length === 0) return null;

  return (
    <div className="reminder-banner" role="region" aria-label="Fired reminders">
      {reminders.map((reminder) => (
        <div key={reminder.taskId} className="reminder-alert" role="alert">
          <div className="reminder-alert-text">
            <strong>⏰ Reminder: {reminder.title}</strong>
            <span>Due at {new Date(reminder.reminderAt).toLocaleString()}</span>
            {permissionHint && <small>{permissionHint}</small>}
          </div>
          <button
            type="button"
            className="ghost"
            onClick={() => onDismiss(reminder.taskId)}
            aria-label={`Dismiss reminder for "${reminder.title}"`}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
