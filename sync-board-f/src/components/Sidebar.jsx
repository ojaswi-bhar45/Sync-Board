import { LayoutDashboard, FolderKanban, Users, MessageSquare, Moon, Sun, Grid3x3, PlusSquare, LogOut } from 'lucide-react';

export default function Sidebar({ toggleTheme, theme, onNavigate, activeView, user, onLogout, isMobileOpen, onMobileClose }) {
  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onMobileClose} />}
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <LayoutDashboard size={24} />
          </div>
          <span>SyncBoard</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === 'feed' ? 'active' : ''}`}
            onClick={() => onNavigate('feed')}
          >
            <Grid3x3 size={20} />
            <span>Feed</span>
          </button>
          <button
            className={`nav-item ${activeView === 'create' ? 'active' : ''}`}
            onClick={() => onNavigate('create')}
          >
            <PlusSquare size={20} />
            <span>Create Project</span>
          </button>
          <button
            className={`nav-item ${activeView === 'canvas' ? 'active' : ''}`}
            onClick={() => onNavigate('canvas')}
          >
            <FolderKanban size={20} />
            <span>Projects</span>
          </button>
          <a href="#" className="nav-item">
            <Users size={20} />
            <span>Team</span>
          </a>
          <a href="#" className="nav-item">
            <MessageSquare size={20} />
            <span>Messages</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="profile-mini" onClick={() => onNavigate('profile')}>
            <div className="avatar">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'U'}`}
                alt="User"
              />
              <div className="status-indicator online"></div>
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.username || 'User'}</span>
              <span className="profile-role">Online</span>
            </div>
          </button>
          <button className="theme-toggle-btn" onClick={onLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </aside>
    </>
  );
}
