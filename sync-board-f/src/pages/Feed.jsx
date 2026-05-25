import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import ProjectCard from "../components/ProjectCard";
import RequestModal from "../components/RequestModal";
import { toast } from "../components/Toast";
import {
  getFeedProjects,
  toggleLike,
  addComment,
  sendJoinRequest,
} from "../api";
import { Loader2, FolderOpen } from "lucide-react";

export default function Feed({ onNavigate }) {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [likeLoading, setLikeLoading] = useState(null);
  const [commentLoading, setCommentLoading] = useState(null);
  const [reqModal, setReqModal] = useState({ open: false, project: null });
  const [reqLoading, setReqLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getFeedProjects();
      setProjects(data);
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const userId = decoded.userId;
        const liked = new Set(
          data
            .filter((p) => p.likes?.some((l) => l.toString() === userId || l._id?.toString() === userId))
            .map((p) => p._id),
        );
        setLikedIds(liked);
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLike = async (projectId) => {
    if (!token) return toast("Please login to like", "error");
    setLikeLoading(projectId);
    try {
      await toggleLike(token, projectId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(projectId)) next.delete(projectId);
        else next.add(projectId);
        return next;
      });
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? {
                ...p,
                likes: likedIds.has(projectId)
                  ? p.likes.filter(
                      (l) => l.toString() !== JSON.parse(atob(token.split(".")[1])).userId,
                    )
                  : [...p.likes, JSON.parse(atob(token.split(".")[1])).userId],
              }
            : p,
        ),
      );
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLikeLoading(null);
    }
  };

  const handleComment = async (projectId, text) => {
    if (!token) return toast("Please login to comment", "error");
    setCommentLoading(projectId);
    try {
      const result = await addComment(token, projectId, text);
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? { ...p, comments: result.comments } : p)),
      );
      toast("Comment added!");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCommentLoading(null);
    }
  };

  const handleRequest = async (note) => {
    if (!token) return toast("Please login", "error");
    setReqLoading(true);
    try {
      await sendJoinRequest(token, reqModal.project._id, note);
      toast("Collaboration request sent!");
      setReqModal({ open: false, project: null });
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Project Feed</h1>
          <p className="text-gray-400 text-sm mt-1">
            Discover and collaborate on amazing projects
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-indigo-400 animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FolderOpen size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-1">
              No projects yet
            </h3>
            <p className="text-sm text-gray-500">
              Be the first to create a project!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                isLiked={likedIds.has(project._id)}
                onLike={handleLike}
                onComment={handleComment}
                onRequest={(p) => setReqModal({ open: true, project: p })}
                likeLoading={likeLoading === project._id}
                commentLoading={commentLoading === project._id}
              />
            ))}
          </div>
        )}
      </div>

      <RequestModal
        isOpen={reqModal.open}
        onClose={() => setReqModal({ open: false, project: null })}
        onSubmit={handleRequest}
        loading={reqLoading}
      />
    </>
  );
}
