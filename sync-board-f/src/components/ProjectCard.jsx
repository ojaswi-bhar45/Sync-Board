import { useState } from "react";
import { Heart, MessageSquare, Handshake, Bookmark, Users, ExternalLink } from "lucide-react";
import CommentSection from "./CommentSection";

export default function ProjectCard({
  project,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onComment,
  onRequest,
  likeLoading,
  commentLoading,
  compact,
}) {
  const [imgErr, setImgErr] = useState(false);
  const date = new Date(project.timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const status = project.status || "open";
  const memberCount = project.members?.length || 0;
  const likeCount = project.likes?.length || 0;
  const commentCount = project.comments?.length || 0;

  const avatarUrl = project.userId?.username
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(project.userId.username)}&backgroundColor=6366f1&textColor=ffffff`
    : null;

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
      <div className="p-5 sm:p-6">
        {/* Top row: avatar + title + bookmark */}
        <div className="flex items-start gap-3 mb-3">
          {avatarUrl && !imgErr ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-10 h-10 rounded-xl shrink-0 mt-0.5"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
              {project.title?.[0]?.toUpperCase() || "P"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                {project.title}
              </h3>
              <span className={`status-badge ${status}`}>
                <span className="status-dot" />
                {status === "in_progress" ? "In Progress" : status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              by {project.userId?.username || "Unknown"} · {date}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(project._id); }}
            className={`shrink-0 p-1.5 rounded-lg transition-all duration-200 ${
              isSaved
                ? "text-indigo-400 bg-indigo-500/10"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <Bookmark size={16} className={isSaved ? "fill-indigo-400" : ""} />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 mb-3">
          {project.description}
        </p>

        {/* Tech Stack */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.techStack.map((tech, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-4 pt-3 border-t border-white/5">
          <button
            onClick={() => onLike(project._id)}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 text-xs transition-all duration-200 active:scale-90 ${
              isLiked ? "text-red-400" : "text-gray-400 hover:text-red-400"
            }`}
          >
            <Heart size={15} className={isLiked ? "fill-red-400" : ""} />
            {likeCount}
          </button>

          <div className="flex-1">
            <CommentSection
              comments={project.comments}
              onAddComment={(text) => onComment(project._id, text)}
              loading={commentLoading}
            />
          </div>

          {memberCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={14} />
              {memberCount}
            </div>
          )}

          <button
            onClick={() => onRequest(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200 active:scale-95"
          >
            <Handshake size={14} />
            Collaborate
          </button>
        </div>
      </div>
    </div>
  );
}
