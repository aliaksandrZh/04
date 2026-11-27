/**
 * Edit modal: title (required — validated inline), notes, due date,
 * priority, tags, reminder and repeat rule.
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Priority, RepeatRule, Task } from '../types';
import { PRIORITIES, REPEAT_RULES } from '../types';
import { parseTagInput, validateTaskTitle, TITLE_REQUIRED_MESSAGE } from '../lib/validation';

interface EditTaskModalProps {
  task: Task;
  onSave: (
    id: string,
    patch: {
      title: string;
      notes: string;
      dueDate: string | null;
      priority: Priority;
      tags: string[];
      reminderAt: string | null;
      repeat: RepeatRule;
    },
  ) => void;
  onClose: () => void;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const REPEAT_LABELS: Record<RepeatRule, string> = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

/** Converts an ISO datetime into the `datetime-local` value format. */
function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export default function EditTaskModal({ task, onSave, onClose }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [tags, setTags] = useState(task.tags.join(', '));
  const [reminderAt, setReminderAt] = useState(toLocalInputValue(task.reminderAt));
  const [repeat, setRepeat] = useState<RepeatRule>(task.repeat);
  const [error, setError] = useState<string | null>(null);

  // Reset fields when a different task is being edited.
  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes);
    setDueDate(task.dueDate ?? '');
    setPriority(task.priority);
    setTags(task.tags.join(', '));
    setReminderAt(toLocalInputValue(task.reminderAt));
    setRepeat(task.repeat);
    setError(null);
  }, [task]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      setError(validation.error ?? TITLE_REQUIRED_MESSAGE);
      return;
    }
    onSave(task.id, {
      title: validation.trimmed,
      notes,
      dueDate: dueDate ? dueDate : null,
      priority,
      tags: parseTagInput(tags),
      reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
      repeat,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit task "${task.title}"`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Edit task</h2>
          <button type="button" className="ghost" onClick={onClose} aria-label="Close editor">
            ✕
          </button>
        </div>
        <form className="edit-form" onSubmit={submit} noValidate>
          <label>
            Title *
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />
          </label>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}

          <label>
            Notes
            <textarea
              value={notes}
              rows={3}
              placeholder="Optional notes…"
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="form-grid">
            <label>
              Due date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reminder
              <input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
              />
            </label>
            <label>
              Repeat
              <select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatRule)}>
                {REPEAT_RULES.map((r) => (
                  <option key={r} value={r}>
                    {REPEAT_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Tags (comma-separated)
            <input
              type="text"
              value={tags}
              placeholder="work, home…"
              onChange={(e) => setTags(e.target.value)}
            />
          </label>

          <p className="hint">
            Repeating tasks automatically create their next occurrence when completed.
          </p>

          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
