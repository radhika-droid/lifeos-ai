import { useState, type FormEvent } from 'react';
import type { Task, TaskCreate, Goal } from '../../lib/types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Textarea } from '../ui/Input';

interface TaskFormProps {
  initial?: Task | null;
  goals?: Goal[];
  onSubmit: (data: TaskCreate) => void;
  onCancel: () => void;
  loading?: boolean;
}

// Static class lookup — prevents Tailwind purge from stripping dynamic classes
const PRIORITY_ACTIVE_STYLES: Record<number, string> = {
  1: 'bg-priority-1/20 text-priority-1 border border-priority-1/40',
  2: 'bg-priority-2/20 text-priority-2 border border-priority-2/40',
  3: 'bg-priority-3/20 text-priority-3 border border-priority-3/40',
  4: 'bg-priority-4/20 text-priority-4 border border-priority-4/40',
  5: 'bg-priority-5/20 text-priority-5 border border-priority-5/40',
};

export default function TaskForm({ initial, goals, onSubmit, onCancel, loading }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [priority, setPriority] = useState(initial?.priority || 3);
  const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimated_minutes || 30);
  const [dueDate, setDueDate] = useState(initial?.due_date?.slice(0, 16) || '');
  const [energy, setEnergy] = useState(initial?.energy_required || 'medium');
  const [goalId, setGoalId] = useState<number | null>(initial?.goal_id || null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      estimated_minutes: estimatedMinutes,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      energy_required: energy as 'low' | 'medium' | 'high',
      goal_id: goalId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        required
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Additional details..."
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
        <div>
          <label className="text-sm text-text-secondary font-medium mb-1.5 block">Priority</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  priority === p
                    ? PRIORITY_ACTIVE_STYLES[p]
                    : 'bg-bg-input border border-border-default text-text-muted hover:border-border-glow'
                }`}
              >
                P{p}
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div>
          <label className="text-sm text-text-secondary font-medium mb-1.5 block">Energy</label>
          <div className="flex gap-1.5">
            {(['low', 'medium', 'high'] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEnergy(e)}
                className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                  energy === e
                    ? 'gradient-bg text-white'
                    : 'bg-bg-input border border-border-default text-text-muted hover:border-border-glow'
                }`}
              >
                {e === 'low' ? '🔋' : e === 'medium' ? '⚡' : '🔥'} {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Estimated Minutes"
          type="number"
          min={5}
          max={480}
          step={5}
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
        />
        <Input
          label="Due Date"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {goals && goals.length > 0 && (
        <div>
          <label className="text-sm text-text-secondary font-medium mb-1.5 block">Link to Goal</label>
          <select
            value={goalId || ''}
            onChange={(e) => setGoalId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-2.5 bg-bg-input border border-border-default rounded-xl text-text-primary text-sm transition-all focus:outline-none focus:border-accent appearance-none cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">No goal</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {initial ? 'Update Task' : 'Create Task'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
