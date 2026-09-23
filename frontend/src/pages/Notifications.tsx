import { useState, useEffect } from 'react';
import api from '../lib/api';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([
    {
      id: 1,
      title: '🚨 Overdue Task Alert',
      message: 'Task "Review Q3 Product Roadmap" is past its scheduled deadline.',
      type: 'danger',
      read: false,
      created_at: '10 mins ago',
    },
    {
      id: 2,
      title: '🌱 Habit Reminder',
      message: "Don't forget to complete your Morning Meditation today!",
      type: 'warning',
      read: false,
      created_at: '1 hour ago',
    },
    {
      id: 3,
      title: '🧘 Daily Wellness Check-In',
      message: "How are you feeling today? Take 2 minutes for your mood check-in.",
      type: 'info',
      read: true,
      created_at: '3 hours ago',
    },
  ]);

  useEffect(() => {
    api.get<NotificationItem[]>('/notifications')
      .then(res => {
        if (res.data && res.data.length > 0) setItems(res.data);
      })
      .catch(() => {
        // Fallback to sample items
      });
  }, []);

  const handleMarkAllRead = () => {
    setItems(items.map(i => ({ ...i, read: true })));
  };

  const handleDismiss = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            🔔 Notifications & Alerts
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Stay on top of deadlines, habit milestones, and wellness reminders.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="px-4 py-2 rounded-xl border border-border-default text-xs font-medium text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors cursor-pointer"
        >
          ✓ Mark All as Read
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="glass-card p-12 text-center text-text-secondary">
            <span className="text-4xl block mb-2">🎉</span>
            <p className="text-sm">You're all caught up! No pending notifications right now.</p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className={`glass-card p-4 flex items-center justify-between gap-4 border-l-4 transition-all ${
                item.type === 'danger'
                  ? 'border-l-danger bg-danger/5'
                  : item.type === 'warning'
                  ? 'border-l-warning bg-warning/5'
                  : item.type === 'success'
                  ? 'border-l-success bg-success/5'
                  : 'border-l-accent'
              } ${item.read ? 'opacity-60' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">{item.message}</p>
                <span className="text-[10px] text-text-muted mt-2 block">{item.created_at}</span>
              </div>

              <button
                type="button"
                onClick={() => handleDismiss(item.id)}
                className="px-3 py-1.5 rounded-lg border border-border-default text-xs text-text-secondary hover:text-danger hover:border-danger/30 transition-colors cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
