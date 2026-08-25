import type { Habit } from '../../lib/types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface HabitCardProps {
  habit: Habit;
  onLog: (habitId: number) => void;
  logLoading?: boolean;
  todayLogged?: boolean;
}

export default function HabitCard({ habit, onLog, logLoading, todayLogged }: HabitCardProps) {
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{habit.name}</h3>
          <p className="text-xs text-text-muted mt-0.5 capitalize">{habit.target_frequency}</p>
        </div>
        {habit.streak_count > 0 && (
          <div className="flex items-center gap-1 text-warning">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold">{habit.streak_count}</span>
          </div>
        )}
      </div>

      {/* Streak bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full gradient-bg rounded-full transition-all duration-500"
          style={{ width: `${Math.min(habit.streak_count * 14.3, 100)}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {habit.last_logged_at ? (
            <Badge variant="default">
              Last: {new Date(habit.last_logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Badge>
          ) : (
            <Badge>Never logged</Badge>
          )}
        </div>
        {todayLogged ? (
          <Badge variant="success">✓ Done today</Badge>
        ) : (
          <Button
            size="sm"
            onClick={() => onLog(habit.id)}
            loading={logLoading}
          >
            ✓ Log
          </Button>
        )}
      </div>
    </div>
  );
}
