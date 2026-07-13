import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Users, ArrowRight } from "lucide-react";

const STATUS_LABELS = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
};

export default function CompactProjectCard({
  project,
  isLiked,
  onLike,
  likeLoading,
}) {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);

  const status = project.status || "planning";
  const memberCount = project.members?.length || 0;
  const likeCount = project.likes?.length || 0;

  const avatarUrl = project.userId?.username
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(project.userId.username)}&backgroundColor=6366f1&textColor=ffffff`
    : null;

  const handleClick = () => {
    navigate(`/dashboard/project/${project._id}`, { state: { project } });
  };

  return (
    <div className="compact-card" onClick={handleClick}>
      <div className="compact-card-inner">
        <div className="compact-card-header">
          <div className="compact-card-user">
            {avatarUrl && !imgErr ? (
              <img
                src={avatarUrl}
                alt=""
                className="compact-card-avatar"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="compact-card-avatar compact-card-avatar-fallback">
                {project.title?.[0]?.toUpperCase() || "P"}
              </div>
            )}
            <div className="compact-card-user-info">
              <span className="compact-card-username">{project.userId?.username || "Unknown"}</span>
              <span className={`status-badge ${status}`}>
                <span className="status-dot" />
                {STATUS_LABELS[status] || status}
              </span>
            </div>
          </div>
          <div className="compact-card-meta">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(project._id);
              }}
              disabled={likeLoading}
              className={`compact-card-like ${isLiked ? "liked" : ""}`}
            >
              <Heart size={14} className={isLiked ? "fill-red-400" : ""} />
              <span>{likeCount}</span>
            </button>
            {memberCount > 0 && (
              <span className="compact-card-members">
                <Users size={13} />
                {memberCount}
              </span>
            )}
          </div>
        </div>

        <h3 className="compact-card-title">{project.title}</h3>
        <p className="compact-card-desc">{project.description}</p>

        {project.techStack && project.techStack.length > 0 && (
          <div className="compact-card-tags">
            {project.techStack.slice(0, 3).map((tech, i) => (
              <span key={i} className="compact-card-tag">{tech}</span>
            ))}
            {project.techStack.length > 3 && (
              <span className="compact-card-tag compact-card-tag-more">+{project.techStack.length - 3}</span>
            )}
          </div>
        )}

        <div className="compact-card-footer">
          <span className="compact-card-view-hint">
            View details
            <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
