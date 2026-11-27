/**
 * Task list split into Active and Completed sections.
 */

import type { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function Section({
  heading,
  count,
  tasks,
  emptyText,
  onToggle,
  onEdit,
  onDelete,
}: {
  heading: string;
  count: number;
  tasks: Task[];
  emptyText: string;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="task-section">
      <h2 className="section-heading">
        {heading} <span className="section-count">{count}</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="empty-hint">{emptyText}</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="task-list-container">
      <Section
        heading="Active"
        count={active.length}
        tasks={active}
        emptyText="No active tasks. Add one above!"
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <Section
        heading="Completed"
        count={completed.length}
        tasks={completed}
        emptyText="Nothing completed yet."
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
