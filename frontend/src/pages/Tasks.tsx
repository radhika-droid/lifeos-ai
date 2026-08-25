import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Task, TaskCreate, Goal } from '../lib/types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import { useToastStore } from '../components/ui/Toast';

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'done';

export default function Tasks() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { addToast } = useToastStore();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then((r) => r.data),
  });

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskCreate) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setModalOpen(false);
      addToast('Task created');
    },
    onError: () => addToast('Failed to create task', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
      addToast('Task updated');
    },
    onError: () => addToast('Failed to update task', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast('Task deleted');
    },
    onError: () => addToast('Failed to delete task', 'error'),
  });

  const filteredTasks =
    tasks?.filter((t) => (filter === 'all' ? true : t.status === filter)) || [];

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tasks?.length || 0 },
    { key: 'pending', label: 'Pending', count: tasks?.filter((t) => t.status === 'pending').length || 0 },
    { key: 'in_progress', label: 'In Progress', count: tasks?.filter((t) => t.status === 'in_progress').length || 0 },
    { key: 'done', label: 'Done', count: tasks?.filter((t) => t.status === 'done').length || 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and track your to-dos</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Task</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              filter === f.key
                ? 'gradient-bg text-white shadow-lg shadow-accent/20'
                : 'bg-bg-card border border-border-default text-text-secondary hover:border-border-glow'
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No tasks yet"
          description="Create your first task to get started with LifeOS"
          action={<Button onClick={() => setModalOpen(true)}>+ Create Task</Button>}
        />
      ) : (
        <div className="space-y-3 stagger">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
              onDelete={(id) => deleteMutation.mutate(id)}
              onEdit={(t) => setEditingTask(t)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Task">
        <TaskForm
          goals={goals}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setModalOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task">
        {editingTask && (
          <TaskForm
            initial={editingTask}
            goals={goals}
            onSubmit={(data) =>
              updateMutation.mutate({ id: editingTask.id, data: data as unknown as Record<string, unknown> })
            }
            onCancel={() => setEditingTask(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
