import type { Goal } from '../../lib/types';
import ProgressRing from '../ui/ProgressRing';
import Badge from '../ui/Badge';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
}

export default function GoalCard({ goal, onEdit }: GoalCardProps) {
  const daysLeft = () => {
    if (!goal.target_date) return null;
    const diff = new Date(goal.target_date).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, variant: 'danger' as const };
    if (days === 0) return { text: 'Due today', variant: 'warning' as const };
    return { text: `${days}d left`, variant: 'default' as const };
  };

  const due = daysLeft();

  return (
    <div
      className="glass-card p-5 cursor-pointer group"
      onClick={() => onEdit(goal)}
    >
      <div className="flex items-start gap-4">
        {/* Progress ring */}
        <ProgressRing percent={goal.progress_percent} size={64} strokeWidth={5}>
          <span className="text-xs font-bold text-text-primary">
            {Math.round(goal.progress_percent)}%
          </span>
        </ProgressRing>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">{goal.description}</p>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="info">
              {goal.completed_task_count}/{goal.task_count} tasks
            </Badge>
            {due && <Badge variant={due.variant}>{due.text}</Badge>}
          </div>
        </div>
      </div>
    </div>
  );
}
