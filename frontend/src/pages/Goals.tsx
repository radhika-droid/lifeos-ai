import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Goal, GoalCreate } from '../lib/types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import GoalCard from '../components/goals/GoalCard';
import { useToastStore } from '../components/ui/Toast';

export default function Goals() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { addToast } = useToastStore();

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: GoalCreate) => api.post('/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setModalOpen(false);
      addToast('Goal created');
    },
    onError: () => addToast('Failed to create goal', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.patch(`/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setEditingGoal(null);
      addToast('Goal updated');
    },
    onError: () => addToast('Failed to update goal', 'error'),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Goals</h1>
          <p className="text-sm text-text-secondary mt-1">Set big goals, break them into tasks</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Goal</Button>
      </div>

      {/* Goals list */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : !goals || goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Define your big-picture goals and link tasks to them"
          action={<Button onClick={() => setModalOpen(true)}>+ Create Goal</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={(g) => setEditingGoal(g)} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Goal">
        <GoalForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setModalOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingGoal} onClose={() => setEditingGoal(null)} title="Edit Goal">
        {editingGoal && (
          <GoalForm
            initial={editingGoal}
            onSubmit={(data) =>
              updateMutation.mutate({ id: editingGoal.id, data: data as unknown as Record<string, unknown> })
            }
            onCancel={() => setEditingGoal(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

// ── Goal Form ─────────────────────────
function GoalForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Goal;
  onSubmit: (data: GoalCreate & { progress_percent?: number }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [targetDate, setTargetDate] = useState(initial?.target_date?.slice(0, 16) || '');
  const [progress, setProgress] = useState(initial?.progress_percent || 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      target_date: targetDate ? new Date(targetDate).toISOString() : null,
      ...(initial ? { progress_percent: progress } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's your goal?"
        required
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Why is this important?"
      />
      <Input
        label="Target Date"
        type="datetime-local"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
      />
      {initial && (
        <div>
          <label className="text-sm text-text-secondary font-medium mb-1.5 block">
            Progress: {Math.round(progress)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {initial ? 'Update Goal' : 'Create Goal'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
