import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import api from '../../lib/api';
import type { Notification } from '../../lib/types';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 60_000, // Poll every 60s
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M13.5 6.5a4.5 4.5 0 10-9 0c0 5-2 6.5-2 6.5h13s-2-1.5-2-6.5zM10.3 15a1.5 1.5 0 01-2.6 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-bg text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-accent/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 glass-card p-0 overflow-hidden animate-scale-in z-50 shadow-2xl">
          <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-accent font-medium">{unreadCount} new</span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="text-2xl block mb-2">🔔</span>
                <p className="text-xs text-text-muted">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) markReadMutation.mutate(notif.id);
                  }}
                  className={`px-4 py-3 border-b border-border-default cursor-pointer transition-colors hover:bg-white/[0.03] ${
                    !notif.read ? 'bg-accent/[0.03]' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && (
                      <div className="w-1.5 h-1.5 rounded-full gradient-bg mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${notif.read ? 'text-text-muted' : 'text-text-primary'}`}>
                        {notif.message}
                      </p>
                      {notif.created_at && (
                        <p className="text-[10px] text-text-muted mt-1">
                          {new Date(notif.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
