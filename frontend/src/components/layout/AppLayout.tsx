import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from '../chat/ChatWidget';

export default function AppLayout() {
  return (
    <div className="flex min-h-dvh bg-bg-primary">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-16 lg:pt-8">
          <Outlet />
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
