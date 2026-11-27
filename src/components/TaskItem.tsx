/**
 * A single task row: complete toggle, title, badges (due date / overdue /
 * priority / tags / repeat / reminder) — with edit and delete actions.
 */

import { useId, useState } from 'react';
import type { Task } from '../types';
import { formatDueDate, isOverdue } from '../lib/dates';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Low priority',
  medium: 'Medium priority',
  high: 'High priority',
};

export default function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const checkboxId = useId();
  const [confirming, setConfirming] = useState(false);
  const overdue = isOverdue(task.dueDate);

  return (
    <li className={`task-item ${task.completed ? 'task-completed' : ''}`}>
      <input
        id={checkboxId}
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={task.completed ? `Mark "${task.title}" as active` : `Mark "${task.title}" as complete`}
      />
      <div className="task-content">
        <label className="task-title" htmlFor={checkboxId}>
          {task.title}
        </label>
        {task.notes && <p className="task-notes">{task.notes}</p>}
        <div className="task-badges">
          {task.dueDate && (
            <span className={`badge badge-due ${overdue ? 'badge-overdue' : ''}`}>
              {formatDueDate(task.dueDate)}
            </span>
          )}
          {task.priority !== 'none' && (
            <span className={`badge badge-priority badge-${task.priority}`}>
              {PRIORITY_LABEL[task.priority] ?? task.priority}
            </span>
          )}
          {task.tags.map((tag) => (
            <span key={tag} className="badge badge-tag">
              #{tag}
            </span>
          ))}
          {task.repeat !== 'none' && (
            <span className="badge badge-repeat" title="Repeats automatically after completion">
              ↻ {task.repeat}
            </span>
          )}
          {task.reminderAt && (
            <span className="badge badge-reminder">
              ⏰ {new Date(task.reminderAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <div className="task-actions">
        <button type="button" className="ghost" onClick={() => onEdit(task.id)} aria-label={`Edit "${task.title}"`}>
          Edit
        </button>
        {confirming ? (
          <>
            <button
              type="button"
              className="danger"
              onClick={() => onDelete(task.id)}
              aria-label={`Confirm deleting "${task.title}"`}
            >
              Delete
            </button>
            <button type="button" className="ghost" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ghost"
            onClick={() => setConfirming(true)}
            aria-label={`Delete "${task.title}"`}
          >
            Delete
          </button>
        )}
      </div>
    </li>
  );
}
