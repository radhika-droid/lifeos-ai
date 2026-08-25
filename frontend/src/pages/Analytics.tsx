import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api';
import type { ProductivityAnalytics, HabitAnalytics } from '../lib/types';
import EmptyState from '../components/ui/EmptyState';

export default function Analytics() {
  const { data: productivity, isLoading: prodLoading } = useQuery<ProductivityAnalytics>({
    queryKey: ['analytics-productivity'],
    queryFn: () => api.get('/analytics/productivity?days=30').then((r) => r.data),
  });

  const { data: habitAnalytics, isLoading: habitsLoading } = useQuery<HabitAnalytics[]>({
    queryKey: ['analytics-habits'],
    queryFn: () => api.get('/analytics/habits?days=30').then((r) => r.data),
  });

  const isLoading = prodLoading || habitsLoading;
  const chartData = productivity?.daily_completions.slice(-14) || [];
  const hasData = (productivity?.total_completed ?? 0) > 0 || (habitAnalytics?.length ?? 0) > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Your productivity at a glance — last 30 days</p>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 h-20 animate-pulse" />
            ))}
          </div>
          <div className="glass-card p-6 h-72 animate-pulse" />
        </div>
      ) : !hasData ? (
        <EmptyState
          icon="📊"
          title="No analytics yet"
          description="Complete some tasks and log habits to see your productivity insights here"
        />
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <StatCard
              label="Completed"
              value={productivity?.total_completed || 0}
              icon="✅"
              color="text-success"
            />
            <StatCard
              label="Pending"
              value={productivity?.total_pending || 0}
              icon="📋"
              color="text-warning"
            />
            <StatCard
              label="Avg Priority"
              value={productivity?.avg_priority_tackled || 0}
              icon="⭐"
              color="text-accent"
              isFloat
            />
            <StatCard
              label="Top Streak"
              value={
                habitAnalytics?.reduce((max, h) => Math.max(max, h.streak_count), 0) || 0
              }
              icon="🔥"
              color="text-warning"
            />
          </div>

          {/* Productivity chart */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">Tasks Completed Per Day</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(5)}
                    tick={{ fill: '#55566a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#55566a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#16161d',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      color: '#f1f1f4',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-text-muted text-center py-12">No data yet — complete some tasks!</p>
            )}
          </div>

          {/* Habit completion rates */}
          {habitAnalytics && habitAnalytics.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-base font-semibold text-text-primary mb-4">Habit Completion Rates</h2>
              <ResponsiveContainer width="100%" height={Math.max(200, habitAnalytics.length * 50)}>
                <BarChart data={habitAnalytics} layout="vertical" margin={{ left: 80 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fill: '#55566a', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#8b8da3', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#16161d',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      color: '#f1f1f4',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [`${value}%`, 'Completion']}
                  />
                  <Bar
                    dataKey="completion_rate"
                    fill="url(#barGradient)"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  isFloat,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  isFloat?: boolean;
}) {
  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`text-2xl font-bold ${color}`}>
            {isFloat ? value.toFixed(1) : value}
          </p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
