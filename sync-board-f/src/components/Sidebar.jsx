import { useNavigate, useLocation } from "react-router-dom";
import {
  Grid3x3,
  Rss,
  PlusSquare,
  FolderKanban,
  Users,
  Handshake,
  MessageSquare,
  User,
  LogOut,
  Shield,
  Zap,
  Moon,
  Sun,
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
  const currentPath = location.pathname.replace("/dashboard/", "");
  const searchParams = new URLSearchParams(location.search);
  const activeSubView = searchParams.get("view");

  const isActive = (path) =>
    currentPath === path || currentPath.startsWith(path + "/");

  const nav = (path) => {
    onMobileClose();
    navigate(path);
  };

  const NAV_ITEMS = [
    { path: "feed", icon: Grid3x3, label: "Community" },
    { path: "my-feed", icon: Rss, label: "My Projects" },
    { path: "messages", icon: MessageSquare, label: "Messages", badge: 3 },
    { path: "projects", icon: FolderKanban, label: "Projects" },
    { path: "create", icon: PlusSquare, label: "Create Project" },
  ];

  const BOTTOM_ITEMS = [
    { path: "feed?view=teams", icon: Users, label: "My Team", checkView: "teams" },
    { path: "feed?view=collaboration", icon: Handshake, label: "Collaboration", checkView: "collaboration" },
  ];

  const isNavActive = (item) => {
    if (item.checkView) return activeSubView === item.checkView;
    return isActive(item.path);
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

        <div className="sidebar-nav-wrapper">
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item);
              return (
                <button
                  key={item.path}
                  className={`nav-item ${active ? "active glow-active" : ""}`}
                  onClick={() => nav(`/dashboard/${item.path}`)}
                >
                  <span className="nav-item-icon-wrap">
                    <Icon size={20} />
                    {item.badge && (
                      <span className="nav-badge">{item.badge > 99 ? "99+" : item.badge}</span>
                    )}
                  </span>
                  <span className="nav-item-label">{item.label}</span>
                  {active && <div className="nav-item-glow" />}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-divider" />

          <nav className="sidebar-nav sidebar-nav-bottom">
            {BOTTOM_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item);
              return (
                <button
                  key={item.path}
                  className={`nav-item ${active ? "active glow-active" : ""}`}
                  onClick={() => nav(`/dashboard/${item.path}`)}
                >
                  <Icon size={20} />
                  <span className="nav-item-label">{item.label}</span>
                  {active && <div className="nav-item-glow" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-pro-card">
          <div className="sidebar-pro-bg" />
          <div className="sidebar-pro-content">
            <Shield size={20} className="sidebar-pro-icon" />
            <div className="sidebar-pro-text">
              <span className="sidebar-pro-title">Upgrade to Pro</span>
              <span className="sidebar-pro-desc">Unlock unlimited projects</span>
            </div>
            <button className="sidebar-pro-btn">
              <Zap size={14} />
              <span>Pro</span>
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div
            className="sidebar-user-card"
            onClick={() => nav("/dashboard/profile")}
          >
            <div className="avatar sidebar-user-avatar">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "U"}&backgroundColor=6366f1&textColor=ffffff`}
                alt="User"
              />
              <div className="status-indicator online" />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user?.username || "User"}
              </span>
              <span className="sidebar-user-plan">Free Plan</span>
            </div>
            <div className="sidebar-user-actions">
              <button
                className="sidebar-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  nav("/dashboard/profile");
                }}
                title="Profile"
              >
                <User size={16} />
              </button>
              <button
                className="sidebar-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTheme();
                }}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                className="sidebar-icon-btn sidebar-icon-btn-logout"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
