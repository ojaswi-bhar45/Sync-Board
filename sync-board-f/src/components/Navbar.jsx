import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusSquare, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      location.pathname === path
        ? "bg-white/10 text-white shadow-sm"
        : "text-gray-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gray-950/70 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 text-white font-bold text-lg">
            <LayoutDashboard size={24} className="text-indigo-400" />
            <span>SyncBoard</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <Link to="/dashboard" className={linkClass("/dashboard")}>
              <LayoutDashboard size={16} />
              Community
            </Link>
            <Link to="/create" className={linkClass("/create")}>
              <PlusSquare size={16} />
              Create Project
            </Link>
            <Link to="/dashboard" className={linkClass("/profile")}>
              <User size={16} />
              Profile
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:block text-sm text-gray-400">
                {user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="sm:hidden flex items-center justify-center gap-4 pb-3">
          <Link to="/dashboard" className={linkClass("/dashboard")}>
            <LayoutDashboard size={16} />
            Community
          </Link>
          <Link to="/create" className={linkClass("/create")}>
            <PlusSquare size={16} />
            Create
          </Link>
          <Link to="/dashboard" className={linkClass("/profile")}>
            <User size={16} />
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
}
