import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import {
  FolderKanban, Users, Clock,
  MessageSquare, Search, Plus, StickyNote,
} from "lucide-react";
import { toast } from "./Toast";
import { getMyTeams } from "../api";

function SkeletonCard() {
  return (
    <div className="project-skeleton-card">
      <div className="skeleton-avatar" />
      <div className="skeleton-line" style={{ width: "75%" }} />
      <div className="skeleton-line" style={{ width: "100%" }} />
      <div className="skeleton-line" style={{ width: "45%" }} />
    </div>
  );
}

function Badge({ status }) {
  if (!status) return null;
  const labels = { planning: "Planning", active: "Active", completed: "Completed" };
  return <span className={`project-badge ${status}`}>{labels[status] || status.replace("_", " ")}</span>;
}

export default function ProjectsList() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { startChat } = useChat();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getMyTeams(token);
        if (!cancelled) setTeams(res.teams || []);
      } catch (err) {
        if (!cancelled) toast(err.message, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [token]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const openWorkspace = (project) => {
    navigate(`/dashboard/workspace/${project._id}`, { state: { project } });
  };

  const handleChat = (project) => {
    startChat(project._id, project.title);
  };

  const filtered = teams.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = p.title?.toLowerCase().includes(q);
    const matchDesc = p.description?.toLowerCase().includes(q);
    const matchTags = p.techStack?.some((t) => t.toLowerCase().includes(q));
    return matchTitle || matchDesc || matchTags;
  });

  const isOwner = (project) =>
    project.userId?._id === user?._id || project.userId === user?._id;

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="projects-header-left">
          <h1 className="gradient-text">
            <FolderKanban size={24} />
            My Projects
          </h1>
          {!loading && (
            <div className="projects-stats">
              <span>
                <FolderKanban size={13} />
                {teams.length} total
              </span>
              <span>
                <Users size={13} />
                {teams.filter((p) => isOwner(p)).length} owned
              </span>
            </div>
          )}
        </div>
        <div className="projects-actions">
          <div className="projects-search">
            <Search size={14} className="projects-search-icon" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => navigate("/dashboard/create")}
            className="gradient-btn inline-flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="projects-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="projects-empty">
          <div className="projects-empty-icon">
            <FolderKanban size={28} className="text-indigo-400" />
          </div>
          <h3>{searchQuery ? "No matching projects" : "No projects yet"}</h3>
          <p>
            {searchQuery
              ? "Try a different search term."
              : "Create a project or get your collaboration requests accepted to get started."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate("/dashboard/create")}
              className="gradient-btn inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((project) => (
            <div
              key={project._id}
              className="project-glass-card"
              onClick={() => openWorkspace(project)}
            >
              <div className="card-top">
                <div className="card-avatar">
                  {(project.title || "P")[0].toUpperCase()}
                </div>
                <div className="card-badges">
                  <Badge status={project.status} />
                </div>
                <div className="card-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleChat(project); }}
                    className="card-icon-btn"
                    title="Team Chat"
                  >
                    <MessageSquare size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openWorkspace(project); }}
                    className="card-icon-btn"
                    title="Open Workspace"
                  >
                    <StickyNote size={14} />
                  </button>
                </div>
              </div>

              <h3 className="card-title">{project.title}</h3>

              {project.description && (
                <p className="card-desc">{project.description}</p>
              )}

              {project.techStack?.length > 0 && (
                <div className="card-tags">
                  {project.techStack.slice(0, 5).map((tech, i) => (
                    <span key={i} className="card-tag">{tech}</span>
                  ))}
                  {project.techStack.length > 5 && (
                    <span className="card-tag">+{project.techStack.length - 5}</span>
                  )}
                </div>
              )}

              <div className="card-owner">
                <span className={`owner-dot ${isOwner(project) ? "owner" : "member"}`} />
                <span>{isOwner(project) ? "You (Owner)" : project.userId?.username || "Unknown"}</span>
              </div>

              <div className="card-meta">
                <span>
                  <Users size={12} />
                  {(project.members?.length || 0) + 1}
                </span>
                <span>
                  <Clock size={12} />
                  {formatDate(project.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
