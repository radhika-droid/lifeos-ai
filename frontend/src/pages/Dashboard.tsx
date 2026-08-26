import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Badge, { StatusBadge } from '../components/ui/Badge';
import { useToastStore } from '../components/ui/Toast';
import type { Task, ScoredTask, Habit, Goal, CheckIn, CheckInCreate } from '../lib/types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // ── Queries ────────────────────────
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then((r) => r.data),
  });

  const { data: habits } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then((r) => r.data),
  });

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals').then((r) => r.data),
  });

  const { data: todayCheckin } = useQuery<CheckIn | null>({
    queryKey: ['checkin-today'],
    queryFn: () => api.get('/checkin/today').then((r) => r.data),
  });

  // ── Check-in state ──────────────────
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(3);
  const [minutes, setMinutes] = useState(60);
  const [showCheckin, setShowCheckin] = useState(false);

  const checkinMutation = useMutation({
    mutationFn: (data: CheckInCreate) => api.post('/checkin', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-today'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      setShowCheckin(false);
      addToast('Check-in saved! Here are your recommendations.');
    },
    onError: () => addToast('Failed to save check-in', 'error'),
  });

  // ── Recommendations ─────────────────
  const hasPendingTasks = tasks ? tasks.filter((t) => t.status !== 'done').length > 0 : false;

  const { data: recommendations, isLoading: recsLoading } = useQuery<ScoredTask[]>({
    queryKey: ['recommendations', todayCheckin?.id],
    queryFn: () =>
      api
        .post('/recommend', {
          energy_level: todayCheckin?.energy_level || 3,
          available_minutes: todayCheckin?.available_minutes || 60,
          time_of_day: new Date().toTimeString().slice(0, 5),
        })
        .then((r) => r.data),
    enabled: !!tasks && hasPendingTasks,
  });

  // ── Derived stats ───────────────────
  const pendingTasks = tasks?.filter((t) => t.status !== 'done').length || 0;
  const completedTasks = tasks?.filter((t) => t.status === 'done').length || 0;
  const activeStreaks = habits?.filter((h) => h.streak_count > 0).length || 0;
  const activeGoals = goals?.length || 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const moodEmojis = ['😫', '😟', '😐', '🙂', '😄'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {greeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!todayCheckin && !showCheckin && (
          <Button onClick={() => setShowCheckin(true)} size="sm">
            ✨ Daily Check-in
          </Button>
        )}
        {todayCheckin && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>Today: {moodEmojis[todayCheckin.mood - 1]} Energy {todayCheckin.energy_level}/5</span>
            <Badge variant="success">Checked in</Badge>
          </div>
        )}
      </div>

      {/* ── Check-in form ──────────────── */}
      {showCheckin && (
        <div className="glass-card p-6 animate-scale-in">
          <h2 className="text-lg font-semibold text-text-primary mb-4">How are you feeling today?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Energy */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Energy Level</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setEnergy(v)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      energy === v
                        ? 'gradient-bg text-white shadow-lg shadow-accent/30'
                        : 'bg-bg-input border border-border-default text-text-secondary hover:border-border-glow'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {/* Mood */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Mood</label>
              <div className="flex gap-2">
                {moodEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => setMood(i + 1)}
                    className={`w-10 h-10 rounded-xl text-lg transition-all cursor-pointer ${
                      mood === i + 1
                        ? 'bg-accent/20 border border-accent/40 scale-110'
                        : 'bg-bg-input border border-border-default hover:border-border-glow'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            {/* Available time */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Available Minutes</label>
              <input
                type="range"
                min="15"
                max="480"
                step="15"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <p className="text-sm text-text-primary mt-1 font-medium">{minutes} min</p>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button
              onClick={() =>
                checkinMutation.mutate({ energy_level: energy, mood, available_minutes: minutes })
              }
              loading={checkinMutation.isPending}
              size="sm"
            >
              Save Check-in
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCheckin(false)}>
              Skip
            </Button>
          </div>
        </div>
      )}

      {/* ── Quick stats ────────────────── */}
      {tasksLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatCard icon="📋" label="Pending Tasks" value={pendingTasks} color="text-info" />
          <StatCard icon="✅" label="Completed" value={completedTasks} color="text-success" />
          <StatCard icon="🔥" label="Active Streaks" value={activeStreaks} color="text-warning" />
          <StatCard icon="🎯" label="Goals" value={activeGoals} color="text-accent" />
        </div>
      )}

      {/* ── AI Recommendations ─────────── */}
      {(tasksLoading || (recsLoading && hasPendingTasks)) && (
        <div className="glass-card p-6 gradient-border">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🤖</span>
            <h2 className="text-lg font-semibold text-text-primary">AI Recommendations</h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-border-default p-4 h-16 animate-pulse" />
            ))}
          </div>
        </div>
      )}
      {!tasksLoading && !recsLoading && recommendations && recommendations.length > 0 && (
        <div className="glass-card p-6 gradient-border animate-pulse-glow relative overflow-hidden">
          {/* Subtle background glow for the whole AI section */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-glow rounded-full blur-3xl opacity-50 pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-xl shadow-lg shadow-accent/40 animate-pulse">
              🧠
            </div>
            <div>
              <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-secondary">
                AI Intelligence
              </h2>
              <p className="text-xs text-text-muted">Learning from your habits...</p>
            </div>
            <div className="ml-auto">
              <Badge variant="info">Live Model</Badge>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            {recommendations.map((task, i) => (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-bg-secondary/50 border border-border-default hover:border-accent/50 hover:bg-accent/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-accent/20">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-text-primary">{task.title}</span>
                    <Badge variant="priority" priority={task.priority}>P{task.priority}</Badge>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-xs text-accent-secondary mt-1 font-medium flex gap-2">
                    <span>✨</span>
                    <TypewriterEffect text={task.reason} delay={i * 500} />
                  </p>
                </div>
                <div className="text-right shrink-0 bg-bg-primary/50 px-3 py-1 rounded-lg border border-border-default">
                  <div className="text-lg font-bold gradient-text">{Math.round(task.score * 100)}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Match</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent completed ───────────── */}
      {tasks && tasks.filter((t) => t.status === 'done').length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recently Completed</h2>
          <div className="space-y-2">
            {tasks
              .filter((t) => t.status === 'done')
              .slice(0, 5)
              .map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 text-sm"
                >
                  <span className="text-success">✓</span>
                  <span className="text-text-secondary line-through">{task.title}</span>
                  {task.completed_at && (
                    <span className="text-xs text-text-muted ml-auto">
                      {new Date(task.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TypewriterEffect({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    
    const startTimeout = setTimeout(() => {
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplayed((prev) => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(timer);
        }
      }, 30);
      return () => clearInterval(timer);
    }, delay);
    
    return () => clearTimeout(startTimeout);
  }, [text, delay]);
  
  return <span>{displayed}</span>;
}
