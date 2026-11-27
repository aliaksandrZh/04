/**
 * App shell — wires all pieces together.
 *
 * Note on reminders: they fire only while this app/tab is open (30 s poll).
 * Push/email reminders would require backend infrastructure and are out of
 * scope (see README).
 */

import { useMemo, useState } from 'react';
import { TaskValidationError, useTasks } from './hooks/useTasks';
import { useReminders } from './hooks/useReminders';
import { applyFilterSort, DEFAULT_FILTER_OPTIONS } from './lib/filtering';
import type { FilterSortOptions } from './lib/filtering';
import type { StatusFilter, SortBy } from './types';
import QuickAdd from './components/QuickAdd';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';
import ReminderBanner from './components/ReminderBanner';
import EditTaskModal from './components/EditTaskModal';

const PERMISSION_HINT: Record<string, string> = {
  default: 'Get notified when a reminder comes due',
  granted: 'Notifications are enabled',
  denied: 'Notifications are blocked in your browser — reminders appear in the app only',
  unsupported: 'Your browser does not support notifications — reminders appear in the app only',
};

export default function App() {
  const [tasks, actions] = useTasks();
  const [filterOptions, setFilterOptions] = useState<FilterSortOptions>(DEFAULT_FILTER_OPTIONS);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reminders = useReminders(tasks);
  const editingTask = useMemo(
    () => tasks.find((t) => t.id === editingId) ?? null,
    [tasks, editingId],
  );

  const visibleTasks = useMemo(() => applyFilterSort(tasks, filterOptions), [tasks, filterOptions]);

  const setStatus = (status: StatusFilter) =>
    setFilterOptions((prev) => ({ ...prev, status }));
  const setTag = (tag: string | null) => setFilterOptions((prev) => ({ ...prev, tag }));
  const setSortBy = (sortBy: SortBy) => setFilterOptions((prev) => ({ ...prev, sortBy }));
  const setSortDescending = (sortDescending: boolean) =>
    setFilterOptions((prev) => ({ ...prev, sortDescending }));

  const handleEditSave = (id: string, patch: Parameters<typeof actions.updateTask>[1]) => {
    try {
      actions.updateTask(id, patch);
    } catch (error) {
      // The modal already validates the title inline; this guards against
      // races (task deleted while its editor is open).
      if (!(error instanceof TaskValidationError)) throw error;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo</h1>
        <p className="subtitle">
          Add, complete, edit, delete, filter, sort and set reminders — data is saved in your
          browser.
        </p>
        {reminders.permission !== 'granted' && (
          <button type="button" className="ghost notify-button" onClick={() => void reminders.requestPermission()}>
            🔔 Enable notifications
          </button>
        )}
      </header>

      <ReminderBanner
        reminders={reminders.active}
        permissionHint={PERMISSION_HINT[reminders.permission]}
        onDismiss={reminders.dismiss}
      />

      <main className="app-main">
        <QuickAdd
          onAdd={(title, dueDate) => {
            actions.addTask(title, { dueDate });
          }}
        />

        <FilterBar
          status={filterOptions.status}
          tag={filterOptions.tag}
          sortBy={filterOptions.sortBy}
          sortDescending={filterOptions.sortDescending ?? false}
          tasks={tasks}
          onStatusChange={setStatus}
          onTagChange={setTag}
          onSortChange={setSortBy}
          onDirectionChange={setSortDescending}
        />

        <TaskList
          tasks={visibleTasks}
          onToggle={actions.toggleComplete}
          onEdit={setEditingId}
          onDelete={actions.deleteTask}
        />
      </main>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleEditSave}
          onClose={() => setEditingId(null)}
        />
      )}

      <footer className="app-footer">
        <p>
          Reminders fire while the app is open (checked every 30 s). Browser notifications require
          permission — {PERMISSION_HINT[reminders.permission] ?? ''}.
          {reminders.lastScannedAt !== null && (
            <span> Last reminder scan: {new Date(reminders.lastScannedAt).toLocaleTimeString()}.</span>
          )}
        </p>
      </footer>
    </div>
  );
}
