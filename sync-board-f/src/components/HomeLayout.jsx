import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Menu, Grid3x3, PlusSquare, User, MessageSquare } from 'lucide-react';
import Sidebar from './Sidebar';
import Feed from '../pages/Feed';
import CreateProject from '../pages/CreateProject';
import Workspace from './Workspace';
import Profile from './Profile';
import ChatPanel from './ChatPanel';
import ToastContainer from './Toast';

export default function HomeLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState('feed');
  const [selectedProject, setSelectedProject] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const openProject = (project) => {
    setSelectedProject(project);
    setActiveView('workspace');
  };

  const handleNavigate = (view) => {
    if (view === 'canvas') view = 'workspace';
    if (view !== 'workspace') setSelectedProject(null);
    setActiveView(view);
    setSidebarOpen(false);
  };

  const activeViewForSidebar =
    activeView === 'workspace' ? 'canvas' :
    activeView === 'feed' ? 'feed' :
    activeView === 'create' ? 'create' :
    activeView === 'profile' ? 'profile' : activeView;

  return (
    <>
      <ToastContainer />
      <div className="app-container">
        <Sidebar
          toggleTheme={toggleTheme}
          theme={theme}
          onNavigate={handleNavigate}
          activeView={activeViewForSidebar}
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
          {activeView === 'feed' && <Feed onNavigate={handleNavigate} />}
          {activeView === 'create' && <CreateProject onNavigate={handleNavigate} />}
          {activeView === 'profile' && <Profile />}
          {activeView === 'workspace' && <Workspace project={selectedProject} />}
          {activeView !== 'create' && <ChatPanel isOpen={chatOpen} setIsOpen={setChatOpen} />}

          {/* ─── Mobile Bottom Tab Bar ─── */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex items-center justify-around h-14 bg-[var(--bg-sidebar)] border-t border-[var(--border-color)] backdrop-blur-xl bg-opacity-90">
            {[
              { view: 'feed', icon: Grid3x3, label: 'Feed' },
              { view: 'create', icon: PlusSquare, label: 'New' },
              { view: 'profile', icon: User, label: 'Profile' },
            ].map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => handleNavigate(view)}
                className={`flex flex-col items-center justify-center gap-0.5 h-full px-4 transition-colors ${
                  activeView === view ? 'text-[var(--accent-color)]' : 'text-gray-500'
                }`}
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
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
        </div>
      </div>
    </>
  );
}
