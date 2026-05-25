import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Workspace from './Workspace';
import Profile from './Profile';

export default function HomeLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);

  const openProject = (project) => {
    setSelectedProject(project);
    setActiveView('workspace');
  };

  const handleNavigate = (view) => {
    if (view !== 'workspace') setSelectedProject(null);
    setActiveView(view);
  };

  return (
    <div className="app-container">
      <Sidebar
        toggleTheme={toggleTheme}
        theme={theme}
        onNavigate={handleNavigate}
        activeView={activeView === 'workspace' ? 'canvas' : activeView}
        user={user}
        onLogout={logout}
      />
      {activeView === 'profile' ? <Profile /> : activeView === 'dashboard' ? <Dashboard onOpenProject={openProject} /> : <Workspace project={selectedProject} />}
    </div>
  );
}
