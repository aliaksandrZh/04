/**
 * Quick-add bar: save with a single click of `Add` or by pressing Enter.
 * Optional due date; an empty title shows a clear inline prompt instead of
 * saving.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { validateTaskTitle, TITLE_REQUIRED_MESSAGE } from '../lib/validation';

interface QuickAddProps {
  onAdd: (title: string, dueDate: string | null) => void;
}

export default function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      setError(validation.error ?? TITLE_REQUIRED_MESSAGE);
      return;
    }
    setError(null);
    onAdd(validation.trimmed, dueDate ? dueDate : null);
    setTitle('');
    setDueDate('');
  };

  return (
    <form className="quick-add" onSubmit={submit} noValidate>
      <div className="quick-add-row">
        <input
          className="quick-add-title"
          type="text"
          placeholder="Add a task…"
          aria-label="Task title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
        />
        <input
          className="quick-add-date"
          type="date"
          aria-label="Due date (optional)"
          title="Due date (optional)"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="primary" type="submit" disabled={title.trim().length === 0}>
          Add
        </button>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
