import { useState } from "react";
import {
  Heart, Handshake, Bookmark, Eye, ArrowUpRight, Clock,
  MoreHorizontal, MessageCircle,
} from "lucide-react";
import CommentSection from "./CommentSection";

const STATUS_LABELS = {
  open: "New Project",
  in_progress: "In Progress",
  closed: "Completed",
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

function getReadingTime(text) {
  const words = text?.split(/\s+/).length || 0;
  const min = Math.max(1, Math.ceil(words / 200));
  return `${min} min read`;
}

export default function PremiumProjectCard({
  project,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onComment,
  onRequest,
  onViewProject,
  likeLoading,
  commentLoading,
}) {
  const [imgErr, setImgErr] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const status = project.status || "open";
  const memberCount = project.members?.length || 0;
  const likeCount = project.likes?.length || 0;
  const commentCount = project.comments?.length || 0;
  const viewCount = project.views || (project._id ? (project._id.charCodeAt(project._id.length - 1) * 37 + 50) : 250);

  const avatarUrl = project.userId?.username
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(project.userId.username)}&backgroundColor=6366f1&textColor=ffffff`
    : null;

  const timeAgo = formatTimeAgo(project.timestamp);
  const readingTime = getReadingTime(project.description);

  const gradientColors = [
    "from-indigo-500/20 via-purple-500/20 to-pink-500/20",
    "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
    "from-amber-500/20 via-orange-500/20 to-rose-500/20",
    "from-blue-500/20 via-indigo-500/20 to-violet-500/20",
  ];
  const gradientIndex = project._id?.charCodeAt(project._id.length - 1) % gradientColors.length || 0;

  return (
    <div className="premium-card">
      <div className="premium-card-inner">
        <div className="premium-card-top">
          <div className="premium-card-user">
            {avatarUrl && !imgErr ? (
              <img
                src={avatarUrl}
                alt=""
                className="premium-card-avatar"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="premium-card-avatar premium-card-avatar-fallback">
                {project.title?.[0]?.toUpperCase() || "P"}
              </div>
            )}
            <div className="premium-card-user-info">
              <span className="premium-card-username">{project.userId?.username || "Unknown"}</span>
              <div className="premium-card-meta-row">
                <span className="premium-card-time">
                  <Clock size={12} />
                  {timeAgo}
                </span>
                <span className="premium-card-dot">·</span>
                <span className="premium-card-reading">{readingTime}</span>
              </div>
            </div>
          </div>
          <div className="premium-card-top-actions">
            <span className={`status-badge ${status}`}>
              <span className="status-dot" />
              {STATUS_LABELS[status] || status}
            </span>
            <div className="premium-card-menu-container">
              <button
                className="premium-card-menu-btn"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="premium-menu-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="premium-card-menu">
                    <button onClick={() => { onViewProject?.(project); setMenuOpen(false); }}>
                      <ArrowUpRight size={14} /> Open
                    </button>
                    <button onClick={() => { onRequest(project); setMenuOpen(false); }}>
                      <Handshake size={14} /> Collaborate
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <h3 className="premium-card-title">{project.title}</h3>
        <p className="premium-card-desc">{project.description}</p>

        {project.techStack && project.techStack.length > 0 && (
          <div className="premium-card-tags">
            {project.techStack.slice(0, 6).map((tech, i) => (
              <span key={i} className="premium-card-tag">{tech}</span>
            ))}
            {project.techStack.length > 6 && (
              <span className="premium-card-tag premium-card-tag-more">+{project.techStack.length - 6}</span>
            )}
          </div>
        )}

        <div className={`premium-card-image ${gradientColors[gradientIndex]}`}>
          <div className="premium-card-image-glow" />
          <div className="premium-card-image-content">
            <span className="premium-card-image-icon">
              {project.title?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "P"}
            </span>
          </div>
        </div>

        <div className="premium-card-actions">
          <div className="premium-card-actions-left">
            <button
              onClick={() => onLike(project._id)}
              disabled={likeLoading}
              className={`premium-card-action-btn ${isLiked ? "liked" : ""}`}
            >
              <Heart size={16} className={isLiked ? "fill-red-400" : ""} />
              <span>{formatCount(likeCount)}</span>
            </button>
            <div className="premium-card-action-btn premium-card-action-btn-static">
              <MessageCircle size={16} />
              <span>{formatCount(commentCount)}</span>
            </div>
            <div className="premium-card-action-btn premium-card-action-btn-static">
              <Eye size={16} />
              <span>{formatCount(viewCount)}</span>
            </div>
          </div>
          <div className="premium-card-actions-right">
            {memberCount > 0 && (
              <div className="premium-card-members">
                <div className="premium-card-members-avatars">
                  {project.members.slice(0, 4).map((m, i) => (
                    <div
                      key={m._id || m || i}
                      className="premium-card-member-dot"
                      style={{ zIndex: 4 - i, marginLeft: i === 0 ? 0 : -8 }}
                      title={m.username || "Member"}
                    >
                      {m.username ? m.username[0].toUpperCase() : "?"}
                    </div>
                  ))}
                  {memberCount > 4 && (
                    <div className="premium-card-member-dot premium-card-member-more" style={{ marginLeft: -8 }}>
                      +{memberCount - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onSave?.(project._id); }}
              className={`premium-card-bookmark ${isSaved ? "saved" : ""}`}
              title="Save"
            >
              <Bookmark size={16} className={isSaved ? "fill-indigo-400" : ""} />
            </button>
            <button
              onClick={() => onViewProject?.(project)}
              className="premium-card-view-btn"
            >
              View Project
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <CommentSection
          comments={project.comments}
          onAddComment={(text) => onComment(project._id, text)}
          loading={commentLoading}
        />
      </div>
    </div>
  );
}
