/**
 * Filter/sort controls: status filter (All/Active/Completed), tag filter
 * (derived from the tasks on screen) and sort by due date or priority.
 */

import type { StatusFilter, SortBy, Task } from '../types';
import { matchesTag } from '../lib/filtering';

interface FilterBarProps {
  status: StatusFilter;
  tag: string | null;
  sortBy: SortBy;
  sortDescending: boolean;
  tasks: Task[];
  onStatusChange: (status: StatusFilter) => void;
  onTagChange: (tag: string | null) => void;
  onSortChange: (sortBy: SortBy) => void;
  onDirectionChange: (descending: boolean) => void;
}

const STATUSES: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

/** Unique tag list derived from existing tasks. */
export function collectTags(tasks: Task[]): string[] {
  const set = new Set<string>();
  for (const task of tasks) {
    for (const tag of task.tags) set.add(tag);
  }
  return Array.from(set).sort();
}

export default function FilterBar(props: FilterBarProps) {
  const { status, tag, sortBy, sortDescending, tasks } = props;
  const tags = collectTags(tasks);

  const visibleCount = tasks.filter((t) => matchesTag(t, tag)).length;
  const showTagFilter = tags.length > 0 || tag !== null;

  return (
    <div className="filter-bar" role="group" aria-label="Filter and sort tasks">
      <div className="status-filter">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`chip ${status === value ? 'chip-active' : ''}`}
            aria-pressed={status === value}
            onClick={() => props.onStatusChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="sort-controls">
        {showTagFilter && (
          <select
            aria-label="Filter by tag"
            value={tag ?? ''}
            onChange={(e) => props.onTagChange(e.target.value || null)}
          >
            <option value="">All tags ({visibleCount})</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Sort tasks by"
          value={sortBy}
          onChange={(e) => props.onSortChange(e.target.value as SortBy)}
        >
          <option value="dueDate">Sort by due date</option>
          <option value="priority">Sort by priority</option>
        </select>
        <button
          type="button"
          className="chip"
          aria-label="Toggle sort direction"
          title="Toggle sort direction"
          onClick={() => props.onDirectionChange(!sortDescending)}
        >
          {sortDescending ? '↓ Descending' : '↑ Ascending'}
        </button>
      </div>
    </div>
  );
}
