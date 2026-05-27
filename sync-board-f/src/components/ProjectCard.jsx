import { useState } from "react";
import { Heart, Handshake, Bookmark, Eye, ArrowUpRight, Clock } from "lucide-react";
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

export default function ProjectCard({
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
  compact,
  showThumbnail,
}) {
  const [imgErr, setImgErr] = useState(false);

  const status = project.status || "open";
  const memberCount = project.members?.length || 0;
  const likeCount = project.likes?.length || 0;
  const viewCount = project.views || (project._id ? (project._id.charCodeAt(project._id.length - 1) * 37 + 50) : 250);

  const avatarUrl = project.userId?.username
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(project.userId.username)}&backgroundColor=6366f1&textColor=ffffff`
    : null;

  const timeAgo = formatTimeAgo(project.timestamp);

  if (compact) {
    return (
      <div className="trending-card feed-card p-4 cursor-pointer" onClick={() => onRequest(project)}>
        <div className="flex items-start gap-3 mb-2">
          {avatarUrl && !imgErr ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-8 h-8 rounded-lg shrink-0"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
              {project.title?.[0]?.toUpperCase() || "P"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{project.title}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">by {project.userId?.username || "Unknown"}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{project.description}</p>
      </div>
    );
  }

  return (
    <div className="feed-card">
      <div className="feed-card-body">
        {/* Top row: avatar + user info + status badge */}
        <div className="feed-card-top">
          <div className="feed-card-user">
            {avatarUrl && !imgErr ? (
              <img
                src={avatarUrl}
                alt=""
                className="feed-card-avatar"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="feed-card-avatar feed-card-avatar-fallback">
                {project.title?.[0]?.toUpperCase() || "P"}
              </div>
            )}
            <div className="feed-card-user-info">
              <span className="feed-card-username">{project.userId?.username || "Unknown"}</span>
              <span className="feed-card-time">
                <Clock size={12} />
                {timeAgo}
              </span>
            </div>
          </div>
          <div className="feed-card-top-actions">
            <span className={`status-badge ${status}`}>
              <span className="status-dot" />
              {STATUS_LABELS[status] || status}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onSave?.(project._id); }}
              className={`feed-card-bookmark ${isSaved ? "saved" : ""}`}
              title="Save"
            >
              <Bookmark size={15} className={isSaved ? "fill-indigo-400" : ""} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="feed-card-title">{project.title}</h3>

        {/* Description */}
        <p className="feed-card-desc">{project.description}</p>

        {/* Tech Stack */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="feed-card-tags">
            {project.techStack.map((tech, i) => (
              <span key={i} className="feed-card-tag">{tech}</span>
            ))}
          </div>
        )}

        {/* Optional Thumbnail */}
        {showThumbnail && !imgErr && (
          <div className="feed-card-thumbnail">
            <div className="feed-card-thumbnail-placeholder">
              <span className="feed-card-thumbnail-text">{project.title}</span>
            </div>
          </div>
        )}

        {/* Engagement row */}
        <div className="feed-card-actions">
          <div className="feed-card-actions-left">
            <button
              onClick={() => onLike(project._id)}
              disabled={likeLoading}
              className={`feed-card-action-btn ${isLiked ? "liked" : ""}`}
            >
              <Heart size={15} className={isLiked ? "fill-red-400" : ""} />
              <span>{formatCount(likeCount)}</span>
            </button>

            <div className="feed-card-action-btn feed-card-action-btn-static">
              <Eye size={15} />
              <span>{formatCount(viewCount)}</span>
            </div>
          </div>

          <div className="feed-card-actions-right">
            {memberCount > 0 && (
              <div className="feed-card-members">
                <div className="feed-card-members-avatars">
                  {Array.from({ length: Math.min(memberCount, 3) }).map((_, i) => (
                    <div key={i} className="feed-card-member-dot" />
                  ))}
                </div>
                <span className="feed-card-member-count">{memberCount}</span>
              </div>
            )}

            <button
              onClick={() => onViewProject?.(project)}
              className="view-project-btn"
            >
              View Project
              <ArrowUpRight size={14} />
            </button>

            <button
              onClick={() => onRequest(project)}
              className="collab-btn"
              title="Request to collaborate"
            >
              <Handshake size={15} />
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
