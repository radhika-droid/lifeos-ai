import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Habit, HabitCreate } from '../lib/types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import HabitCard from '../components/habits/HabitCard';
import { useToastStore } from '../components/ui/Toast';

export default function Habits() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFreq, setNewFreq] = useState('daily');
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const { addToast } = useToastStore();

  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: HabitCreate) => api.post('/habits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setModalOpen(false);
      setNewName('');
      setNewFreq('daily');
      addToast('Habit created');
    },
    onError: () => addToast('Failed to create habit', 'error'),
  });

  const logMutation = useMutation({
    mutationFn: (habitId: number) => api.post(`/habits/${habitId}/log`, { completed: true }),
    onMutate: (id) => setLoggingId(id),
    onSettled: () => setLoggingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      addToast('Habit logged! 🔥');
    },
  });

  const isLoggedToday = (habit: Habit) => {
    if (!habit.last_logged_at) return false;
    const last = new Date(habit.last_logged_at).toDateString();
    return last === new Date().toDateString();
  };

  const frequencies = ['daily', '3x/week', '2x/week', 'weekly'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Habits</h1>
          <p className="text-sm text-text-secondary mt-1">Build consistency, one day at a time</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Habit</Button>
      </div>

      {/* Streak summary */}
      {habits && habits.length > 0 && (
        <div className="glass-card p-5 gradient-border">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔥</span>
            <h2 className="text-base font-semibold text-text-primary">Streak Overview</h2>
          </div>
          <div className="flex gap-4 flex-wrap">
            {habits
              .filter((h) => h.streak_count > 0)
              .sort((a, b) => b.streak_count - a.streak_count)
              .map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  <span className="text-warning font-bold">{h.streak_count}d</span>
                  <span className="text-text-secondary">{h.name}</span>
                </div>
              ))}
            {habits.every((h) => h.streak_count === 0) && (
              <p className="text-sm text-text-muted">No active streaks — start logging today!</p>
            )}
          </div>
        </div>
      )}

      {/* Habit grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : !habits || habits.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No habits yet"
          description="Track daily habits and build winning streaks"
          action={<Button onClick={() => setModalOpen(true)}>+ Create Habit</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onLog={(id) => logMutation.mutate(id)}
              logLoading={loggingId === habit.id}
              todayLogged={isLoggedToday(habit)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Habit">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ name: newName, target_frequency: newFreq });
          }}
          className="space-y-4"
        >
          <Input
            label="Habit Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Meditate, Read, Exercise"
            required
          />
          <div>
            <label className="text-sm text-text-secondary font-medium mb-1.5 block">Frequency</label>
            <div className="flex gap-2 flex-wrap">
              {frequencies.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setNewFreq(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    newFreq === f
                      ? 'gradient-bg text-white'
                      : 'bg-bg-input border border-border-default text-text-secondary hover:border-border-glow'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={createMutation.isPending}>
              Create Habit
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
