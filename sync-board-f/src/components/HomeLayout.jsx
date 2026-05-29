import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChatProvider, useChat } from '../context/ChatContext';
import { useTheme } from '../hooks/useTheme';
import { Menu, Grid3x3, PlusSquare, User, MessageSquare } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import ToastContainer from './Toast';

function HomeLayoutInner() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { chatOpen, setChatOpen } = useChat();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = location.pathname.replace('/dashboard/', '');
  const isWorkspace = currentPath.startsWith('workspace');
  const isCreate = currentPath === 'create';

  const showChat = !isWorkspace && !isCreate;

  return (
    <>
      <ToastContainer />
      <div className="app-container">
        <Sidebar
          toggleTheme={toggleTheme}
          theme={theme}
          user={user}
          onLogout={logout}
          isMobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
        <div className="main-content">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/5 md:hidden">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-white">SyncBoard</span>
          </div>

          <Outlet />

          {showChat && (
            <ChatPanel />
          )}

          {!isWorkspace && !isCreate && (
            <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex items-center justify-around h-14 bg-[var(--bg-sidebar)] border-t border-[var(--border-color)] backdrop-blur-xl bg-opacity-90">
              {[
                { view: 'feed', icon: Grid3x3, label: 'Feed' },
                { view: 'create', icon: PlusSquare, label: 'New' },
                { view: 'profile', icon: User, label: 'Profile' },
              ].map(({ view, icon: Icon, label }) => (
                <a
                  key={view}
                  href={`/dashboard/${view}`}
                  className={`flex flex-col items-center justify-center gap-0.5 h-full px-4 transition-colors ${
                    currentPath === view ? 'text-[var(--accent-color)]' : 'text-gray-500'
                  }`}
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{label}</span>
                </a>
              ))}
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`flex flex-col items-center justify-center gap-0.5 h-full px-4 transition-colors ${
                  chatOpen ? 'text-[var(--accent-color)]' : 'text-gray-500'
                }`}
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <MessageSquare size={20} />
                <span className="text-[10px] font-medium">Chat</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}

export default function HomeLayout() {
  return (
    <ChatProvider>
      <HomeLayoutInner />
    </ChatProvider>
  );
}
