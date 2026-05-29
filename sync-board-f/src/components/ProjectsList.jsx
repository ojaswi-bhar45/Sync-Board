import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2, FolderKanban, Users, Clock, ArrowUpRight, MessageSquare, UserCheck } from "lucide-react";
import { toast } from "./Toast";
import { getMyTeams } from "../api";

export default function ProjectsList({ onNavigate, onStartChat }) {
  const { token, user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const openCanvas = (project) => {
    onNavigate("workspace", project);
  };

  const handleChat = (project) => {
    onStartChat?.(project._id, project.title);
  };

  if (!token) {
    return (
      <div className="feed-center-scroll">
        <div className="feed-empty" style={{ marginTop: 80 }}>
          <h3 className="feed-empty-title">Please log in</h3>
          <p className="feed-empty-desc">Sign in to view your projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-list-page">
      <div className="projects-list-header">
        <h1 className="feed-title">
          <FolderKanban size={22} className="feed-title-icon" />
          My Projects
        </h1>
        <p className="feed-subtitle">Projects you own or are a member of</p>
      </div>

      {loading ? (
        <div className="feed-loading">
          <Loader2 size={36} className="feed-spinner" />
          <p className="feed-loading-text">Loading projects...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="feed-empty" style={{ marginTop: 40 }}>
          <div className="feed-empty-icon">
            <Users size={32} className="text-indigo-400" />
          </div>
          <h3 className="feed-empty-title">No projects yet</h3>
          <p className="feed-empty-desc">
            Create a project or join one to get started.
          </p>
          <button
            onClick={() => onNavigate("create")}
            className="gradient-btn inline-flex items-center gap-2"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {teams.map((project) => {
            const isOwner = project.userId?._id === user?._id || project.userId === user?._id;
            return (
              <div key={project._id} className="project-grid-card" onClick={() => openCanvas(project)}>
                <div className="project-grid-card-top">
                  <div className="project-grid-avatar">
                    {(project.title || "P")[0].toUpperCase()}
                  </div>
                  <div className="project-grid-actions">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleChat(project); }}
                      className="project-grid-icon-btn"
                      title="Team Chat"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openCanvas(project); }}
                      className="project-grid-icon-btn"
                      title="Open Canvas"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="project-grid-title">{project.title}</h3>

                {project.description && (
                  <p className="project-grid-desc">{project.description}</p>
                )}

                <div className="project-grid-owner">
                  <UserCheck size={12} />
                  <span>{isOwner ? "You (Owner)" : project.userId?.username || "Unknown"}</span>
                </div>

                {project.techStack?.length > 0 && (
                  <div className="project-grid-tags">
                    {project.techStack.slice(0, 4).map((tech, i) => (
                      <span key={i} className="project-grid-tag">{tech}</span>
                    ))}
                    {project.techStack.length > 4 && (
                      <span className="project-grid-tag">+{project.techStack.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="project-grid-footer">
                  <div className="project-grid-meta">
                    <Users size={12} />
                    <span>{(project.members?.length || 0) + 1} member{(project.members?.length || 0) !== 0 ? "s" : ""}</span>
                  </div>
                  <div className="project-grid-meta">
                    <Clock size={12} />
                    <span>{formatDate(project.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
