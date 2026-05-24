import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Workspace from './Workspace';

export default function HomeLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="app-container">
      <Sidebar
        toggleTheme={toggleTheme}
        theme={theme}
        onNavigate={setActiveView}
        activeView={activeView}
        user={user}
        onLogout={logout}
      />
      {activeView === 'dashboard' ? <Dashboard /> : <Workspace />}
    </div>
  );
}
