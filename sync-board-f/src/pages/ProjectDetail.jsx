import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, Heart, MessageCircle, Eye, Users, Clock,
  Handshake, Bookmark, Loader2,
} from "lucide-react";
import CommentSection from "../components/CommentSection";
import RequestModal from "../components/RequestModal";
import { getFeedProjects, toggleLike, addComment, sendJoinRequest } from "../api";
import { toast } from "../components/Toast";

const STATUS_LABELS = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
};

function formatTimeAgo(dateString) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCount(num) {
  if (!num) return "0";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const initialProject = location.state?.project || null;

  const initialLiked = useMemo(() => {
    if (!initialProject || !token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.userId;
      return initialProject.likes?.some((l) => l.toString() === userId || l._id?.toString() === userId) || false;
    } catch { return false; }
  }, [initialProject, token]);

  const initialSaved = useMemo(() => {
    if (!initialProject) return false;
    try {
      const saved = JSON.parse(localStorage.getItem("savedProjects") || "[]");
      return saved.includes(initialProject._id);
    } catch { return false; }
  }, [initialProject]);

  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [reqModal, setReqModal] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (project) return;
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getFeedProjects({ page: 1, limit: 1, search: "" });
        const found = data.projects?.find((p) => p._id === projectId);
        if (!cancelled && found) {
          setProject(found);
        } else if (!cancelled) {
          toast("Project not found", "error");
          navigate("/dashboard/feed");
        }
      } catch (err) {
        if (!cancelled) {
          toast(err.message, "error");
          navigate("/dashboard/feed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [projectId, token, project, navigate]);

  const extractUserId = () => {
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])).userId; } catch { return null; }
  };

  const handleLike = async () => {
    if (!token) return toast("Please login to like", "error");
    setLikeLoading(true);
    try {
      await toggleLike(token, project._id);
      const userId = extractUserId();
      setIsLiked((prev) => !prev);
      setProject((prev) => ({
        ...prev,
        likes: isLiked
          ? prev.likes.filter((l) => l.toString() !== userId)
          : [...(prev.likes || []), userId],
      }));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (text) => {
    if (!token) return toast("Please login to comment", "error");
    setCommentLoading(true);
    try {
      const result = await addComment(token, project._id, text);
      setProject((prev) => ({ ...prev, comments: result.comments }));
      toast("Comment added!");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleRequest = async (note) => {
    if (!token) return toast("Please login", "error");
    setReqLoading(true);
    try {
      await sendJoinRequest(token, project._id, note);
      toast("Collaboration request sent!");
      setReqModal(false);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setReqLoading(false);
    }
  };

  const handleSave = () => {
    setSaved((prev) => {
      const next = !prev;
      try {
        const raw = JSON.parse(localStorage.getItem("savedProjects") || "[]");
        const updated = next ? [...raw, project._id] : raw.filter((id) => id !== project._id);
        localStorage.setItem("savedProjects", JSON.stringify(updated));
      } catch { /* ignore */ }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <Loader2 size={32} className="feed-spinner" />
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) return null;

  const status = project.status || "planning";
  const memberCount = project.members?.length || 0;
  const likeCount = project.likes?.length || 0;
  const commentCount = project.comments?.length || 0;
  const viewCount = project.views || (project._id ? (project._id.charCodeAt(project._id.length - 1) * 37 + 50) : 250);

  const avatarUrl = project.userId?.username
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(project.userId.username)}&backgroundColor=6366f1&textColor=ffffff`
    : null;

  const gradientColors = [
    "from-indigo-500/20 via-purple-500/20 to-pink-500/20",
    "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
    "from-amber-500/20 via-orange-500/20 to-rose-500/20",
    "from-blue-500/20 via-indigo-500/20 to-violet-500/20",
  ];
  const gradientIndex = project._id?.charCodeAt(project._id.length - 1) % gradientColors.length || 0;

  return (
    <>
      <div className="feed-center-scroll">
        <button className="detail-back" onClick={() => navigate("/dashboard/feed")}>
          <ArrowLeft size={18} />
          Back to Feed
        </button>

        <div className="detail-card">
          <div className="detail-card-header">
            <div className="detail-card-user">
              {avatarUrl && !imgErr ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="detail-card-avatar"
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="detail-card-avatar detail-card-avatar-fallback">
                  {project.title?.[0]?.toUpperCase() || "P"}
                </div>
              )}
              <div className="detail-card-user-info">
                <span className="detail-card-username">{project.userId?.username || "Unknown"}</span>
                <div className="detail-card-meta">
                  <Clock size={13} />
                  <span>{formatTimeAgo(project.timestamp)}</span>
                  <span className="detail-card-dot">·</span>
                  <span className={`status-badge ${status}`}>
                    <span className="status-dot" />
                    {STATUS_LABELS[status] || status}
                  </span>
                </div>
              </div>
            </div>
            <div className="detail-card-actions-top">
              <button
                onClick={handleSave}
                className={`detail-card-bookmark ${saved ? "saved" : ""}`}
              >
                <Bookmark size={18} className={saved ? "fill-indigo-400" : ""} />
              </button>
            </div>
          </div>

          <h1 className="detail-card-title">{project.title}</h1>
          <p className="detail-card-desc">{project.description}</p>

          <div className={`detail-card-image ${gradientColors[gradientIndex]}`}>
            <div className="detail-card-image-glow" />
            <div className="detail-card-image-content">
              <span className="detail-card-image-icon">
                {project.title?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "P"}
              </span>
            </div>
          </div>

          {project.techStack && project.techStack.length > 0 && (
            <div className="detail-card-tags">
              {project.techStack.map((tech, i) => (
                <span key={i} className="detail-card-tag">{tech}</span>
              ))}
            </div>
          )}

          <div className="detail-card-collab-row">
            <span
              className={`collab-badge ${project.isOpenForCollaboration !== false ? "open" : "closed"}`}
            >
              {project.isOpenForCollaboration !== false ? "Looking for Collaborators" : "Team Full"}
            </span>
            {project.lookingFor && project.lookingFor.length > 0 && (
              <div className="looking-for-tags">
                {project.lookingFor.map((role, i) => (
                  <span key={i} className="looking-for-tag">{role}</span>
                ))}
              </div>
            )}
          </div>

          {memberCount > 0 && (
            <div className="detail-card-members">
              <h4 className="detail-card-section-title">
                <Users size={16} />
                Team Members ({memberCount})
              </h4>
              <div className="detail-card-members-list">
                {project.members.map((m) => (
                  <div key={m._id || m} className="detail-card-member">
                    <div className="detail-card-member-avatar">
                      {m.username ? m.username[0].toUpperCase() : "?"}
                    </div>
                    <span className="detail-card-member-name">{m.username || "Member"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-card-actions">
            <div className="detail-card-actions-left">
              <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`detail-card-action-btn ${isLiked ? "liked" : ""}`}
              >
                <Heart size={18} className={isLiked ? "fill-red-400" : ""} />
                <span>{formatCount(likeCount)}</span>
              </button>
              <div className="detail-card-action-btn detail-card-action-static">
                <MessageCircle size={18} />
                <span>{formatCount(commentCount)}</span>
              </div>
              <div className="detail-card-action-btn detail-card-action-static">
                <Eye size={18} />
                <span>{formatCount(viewCount)}</span>
              </div>
            </div>
            <div className="detail-card-actions-right">
              {project.isOpenForCollaboration !== false && (
                <button
                  onClick={() => setReqModal(true)}
                  className="detail-collab-btn"
                >
                  <Handshake size={16} />
                  Collaborate
                </button>
              )}
            </div>
          </div>

          <div className="detail-card-comments">
            <CommentSection
              comments={project.comments}
              onAddComment={handleComment}
              loading={commentLoading}
            />
          </div>
        </div>
      </div>

      <RequestModal
        isOpen={reqModal}
        onClose={() => setReqModal(false)}
        onSubmit={handleRequest}
        loading={reqLoading}
      />
    </>
  );
}
