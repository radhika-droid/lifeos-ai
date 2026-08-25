import type { Task } from '../../lib/types';
import Badge, { EnergyBadge, StatusBadge } from '../ui/Badge';
import Button from '../ui/Button';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, status: string) => void;
  onDelete: (taskId: number) => void;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }: TaskCardProps) {
  const isDone = task.status === 'done';

  const nextStatus = () => {
    if (task.status === 'pending') return 'in_progress';
    if (task.status === 'in_progress') return 'done';
    return 'pending';
  };

  const statusButtonLabel = () => {
    if (task.status === 'pending') return '▶ Start';
    if (task.status === 'in_progress') return '✓ Done';
    return '↺ Reopen';
  };

  const dueInfo = () => {
    if (!task.due_date) return null;
    const due = new Date(task.due_date);
    const now = new Date();
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) return { text: 'Overdue', variant: 'danger' as const };
    if (hoursLeft < 24) return { text: 'Due today', variant: 'danger' as const };
    if (hoursLeft < 48) return { text: 'Due tomorrow', variant: 'warning' as const };
    return {
      text: `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      variant: 'default' as const,
    };
  };

  const due = dueInfo();

  return (
    <div
      className={`glass-card p-4 transition-all duration-200 group ${isDone ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={() => onStatusChange(task.id, nextStatus())}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
            isDone
              ? 'bg-success border-success text-white'
              : task.status === 'in_progress'
              ? 'border-info bg-info/20'
              : 'border-text-muted hover:border-accent'
          }`}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {task.status === 'in_progress' && (
            <div className="w-2 h-2 rounded-full bg-info" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}>
              {task.title}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="priority" priority={task.priority}>P{task.priority}</Badge>
            <StatusBadge status={task.status} />
            <EnergyBadge level={task.energy_required} />
            {task.estimated_minutes > 0 && (
              <Badge>⏱ {task.estimated_minutes}m</Badge>
            )}
            {due && <Badge variant={due.variant}>{due.text}</Badge>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onStatusChange(task.id, nextStatus())}>
            {statusButtonLabel()}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
            ✏️
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
            🗑
          </Button>
        </div>
      </div>
    </div>
  );
}
