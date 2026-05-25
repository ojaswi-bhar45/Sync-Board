import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Menu } from 'lucide-react';
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
          {activeView !== 'create' && <ChatPanel />}
        </div>
      </div>
    </>
  );
}
