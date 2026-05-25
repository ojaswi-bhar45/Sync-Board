import { Heart, MessageSquare, Handshake } from "lucide-react";
import CommentSection from "./CommentSection";

export default function ProjectCard({
  project,
  isLiked,
  onLike,
  onComment,
  onRequest,
  likeLoading,
  commentLoading,
}) {
  const date = new Date(project.timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">
              {project.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              by {project.userId?.username || "Unknown"} · {date}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-3">
          {project.description}
        </p>

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

        <div className="flex items-center gap-4 pt-3 border-t border-white/5">
          <button
            onClick={() => onLike(project._id)}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 text-xs transition-all duration-200 active:scale-90 ${
              isLiked
                ? "text-red-400"
                : "text-gray-400 hover:text-red-400"
            }`}
          >
            <Heart
              size={16}
              className={isLiked ? "fill-red-400" : ""}
            />
            {project.likes?.length || 0}
          </button>

          <div className="flex-1">
            <CommentSection
              comments={project.comments}
              onAddComment={(text) => onComment(project._id, text)}
              loading={commentLoading}
            />
          </div>

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
