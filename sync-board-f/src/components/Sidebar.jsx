import { useNavigate, useLocation } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  Moon,
  Sun,
  Grid3x3,
  PlusSquare,
  LogOut,
  Handshake,
} from "lucide-react";
import Logo from "./Logo";

export default function Sidebar({
  toggleTheme,
  theme,
  user,
  onLogout,
  isMobileOpen,
  onMobileClose,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.replace('/dashboard/', '');
  const searchParams = new URLSearchParams(location.search);
  const activeSubView = searchParams.get('view');

  const isActive = (path) => currentPath === path || currentPath.startsWith(path + '/');

  const nav = (path) => {
    onMobileClose();
    navigate(path);
  };

  return (
    <>
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={onMobileClose} />
      )}
      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <Logo size={20} />
          </div>
          <span>SyncBoard</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${isActive('feed') ? 'active' : ''}`}
            onClick={() => nav('/dashboard/feed')}
          >
            <Grid3x3 size={20} />
            <span>Feed</span>
          </button>
          <button
            className={`nav-item ${isActive('create') ? 'active' : ''}`}
            onClick={() => nav('/dashboard/create')}
          >
            <PlusSquare size={20} />
            <span>Create Project</span>
          </button>
          <button
            className={`nav-item ${isActive('projects') ? 'active' : ''}`}
            onClick={() => nav('/dashboard/projects')}
          >
            <FolderKanban size={20} />
            <span>Projects</span>
          </button>
          <button
            className={`nav-item ${activeSubView === 'teams' ? 'active' : ''}`}
            onClick={() => nav('/dashboard/feed?view=teams')}
          >
            <Users size={20} />
            <span>My Team</span>
          </button>
          <button
            className={`nav-item ${activeSubView === 'collaboration' ? 'active' : ''}`}
            onClick={() => nav('/dashboard/feed?view=collaboration')}
          >
            <Handshake size={20} />
            <span>Collaboration</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="profile-mini"
            onClick={() => nav('/dashboard/profile')}
          >
            <div className="avatar">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "U"}`}
                alt="User"
              />
              <div className="status-indicator online"></div>
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.username || "User"}</span>
              <span className="profile-role">Online</span>
            </div>
          </button>
          <button
            className="theme-toggle-btn"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>
    </>
  );
}
