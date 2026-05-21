import React from 'react';
import { LayoutDashboard, FolderKanban, Settings, Users, MessageSquare, Moon, Sun, Grid3x3 } from 'lucide-react';

export default function Sidebar({ toggleTheme, theme, onNavigate, activeView }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <LayoutDashboard size={24} />
        </div>
        <span>SyncBoard</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <Grid3x3 size={20} />
          <span>Dashboard</span>
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
        <a href="#" className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
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
        <div className="profile-mini">
          <div className="avatar">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" />
            <div className="status-indicator online"></div>
          </div>
          <div className="profile-info">
            <span className="profile-name">Alex Rivera</span>
            <span className="profile-role">Product Designer</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
