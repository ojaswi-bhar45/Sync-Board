import React from 'react';
import { LayoutDashboard, FolderKanban, Settings, Users, MessageSquare } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <LayoutDashboard size={24} />
        </div>
        <span>SyncBoard</span>
      </div>
      
      <nav className="sidebar-nav">
        <a href="#" className="nav-item active">
          <FolderKanban size={20} />
          <span>Projects</span>
        </a>
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
