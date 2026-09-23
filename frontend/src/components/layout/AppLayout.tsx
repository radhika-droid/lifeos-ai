import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from '../chat/ChatWidget';
import NotificationBell from './NotificationBell';
import { useAuthStore } from '../../lib/store';

const PAGE_TITLES: Record<string, { title: string; subtitle: string; icon: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Daily overview & AI recommendations', icon: '📊' },
  '/tasks': { title: 'Tasks & Focus', subtitle: 'Prioritize and conquer your action items', icon: '📋' },
  '/habits': { title: 'Habits & Discipline', subtitle: 'Build sustainable daily micro-routines', icon: '🔥' },
  '/wellness': { title: 'Mental Wellness', subtitle: 'Mindfulness, mood logging & box breathing', icon: '🧘' },
  '/goals': { title: 'Goals & Milestones', subtitle: 'Track long-term visions and outcomes', icon: '🎯' },
  '/analytics': { title: 'AI Decision Engine', subtitle: 'Machine learning model insights & retraining', icon: '🧠' },
  '/notifications': { title: 'Notifications & Alerts', subtitle: 'Smart reminders and scheduled alerts', icon: '🔔' },
  '/profile': { title: 'Account & Settings', subtitle: 'Personal profile and user statistics', icon: '👤' },
};

export default function AppLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  const currentMeta = PAGE_TITLES[location.pathname] || {
    title: 'LifeOS AI',
    subtitle: 'Intelligent Life Operating System',
    icon: '⚡',
  };

  return (
    <div className="flex min-h-dvh bg-[#0f0f13] text-[#f1f1f4]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#161622]/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 pl-12 lg:pl-0">
            <span className="text-xl shrink-0">{currentMeta.icon}</span>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                {currentMeta.title}
              </h1>
              <p className="text-[11px] text-zinc-400 hidden sm:block leading-tight">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-indigo-400 leading-tight">LifeOS Pro</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
