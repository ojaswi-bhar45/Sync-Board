import { useState, useEffect } from "react";
import { Loader2, Users, ArrowUpRight, Clock } from "lucide-react";
import { toast } from "../components/Toast";
import { getMyTeams } from "../api";

export default function TeamsView({ token, onNavigate }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchTeams = async () => {
      setLoading(true);
      try {
        const res = await getMyTeams(token);
        if (!cancelled) {
          setTeams(res.teams || []);
        }
      } catch (err) {
        if (!cancelled) toast(err.message, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTeams();
    return () => { cancelled = true; };
  }, [token]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (!token) {
    return (
      <div className="feed-center-scroll">
        <div className="feed-empty" style={{ marginTop: 80 }}>
          <h3 className="feed-empty-title">Please log in</h3>
          <p className="feed-empty-desc">Sign in to view your teams.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-center-scroll">
      <div className="collab-header">
        <h1 className="feed-title">
          My Teams
        </h1>
        <p className="feed-subtitle">Projects you're a member of</p>
      </div>

      {loading ? (
        <div className="feed-loading">
          <Loader2 size={36} className="feed-spinner" />
          <p className="feed-loading-text">Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="feed-empty" style={{ marginTop: 40 }}>
          <div className="feed-empty-icon">
            <Users size={32} className="text-indigo-400" />
          </div>
          <h3 className="feed-empty-title">No teams yet</h3>
          <p className="feed-empty-desc">
            Once your collaboration requests are accepted, your teams will appear here.
          </p>
        </div>
      ) : (
        <div className="collab-list">
          {teams.map((project) => (
            <div key={project._id} className="collab-card">
              <div className="collab-card-top">
                <div className="collab-card-user">
                  <div className="collab-avatar">
                    {(project.userId?.username || "P")[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="collab-username">{project.title}</span>
                    <span className="collab-project-label">
                      by {project.userId?.username || "Unknown"} · {project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.("workspace", project)}
                  className="collab-view-project"
                  title="View project"
                >
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Project owner + member initials */}
              <div className="feed-card-members" style={{ marginBottom: 10 }}>
                <div className="feed-card-members-avatars">
                  <div
                    className="feed-card-member-dot"
                    title={project.userId?.username || "Owner"}
                    style={{ marginLeft: 0 }}
                  >
                    {(project.userId?.username || "O")[0].toUpperCase()}
                  </div>
                  {project.members?.slice(0, 5).map((m) => (
                    <div
                      key={m._id || m}
                      className="feed-card-member-dot"
                      title={m.username || "Member"}
                    >
                      {m.username ? m.username[0].toUpperCase() : ""}
                    </div>
                  ))}
                </div>
              </div>

              {project.description && (
                <p style={{
                  fontSize: "0.8125rem",
                  color: "#9ca3af",
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}>
                  {project.description}
                </p>
              )}

              {project.techStack?.length > 0 && (
                <div className="feed-card-tags" style={{ marginBottom: 10 }}>
                  {project.techStack.map((tech, i) => (
                    <span key={i} className="feed-card-tag">{tech}</span>
                  ))}
                </div>
              )}

              <div className="collab-card-meta" style={{ marginBottom: 0 }}>
                <Clock size={12} />
                <span>Created {formatDate(project.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
