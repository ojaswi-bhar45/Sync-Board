import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";
import {
  getMyProjects, createDashboardProject, toggleLike, addComment,
  pinProject, deleteProject, updateProjectProgress,
} from "../api";
import {
  Loader2, Plus, X, Sparkles, Heart, MessageCircle, Share2,
  MoreVertical, Edit3, Trash2, Pin, PinOff, Clock, FolderOpen,
  Lightbulb, CheckCircle, Target, Zap, Users, ArrowUpRight,
} from "lucide-react";

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

function getAchievements(project) {
  const badges = [];
  if (project.status === "open") badges.push({ label: "New Project", icon: Lightbulb, color: "#6366f1" });
  if (project.status === "in_progress") badges.push({ label: "In Progress", icon: Target, color: "#f59e0b" });
  if (project.status === "closed") badges.push({ label: "Completed", icon: CheckCircle, color: "#10b981" });
  if (project.likes?.length >= 5) badges.push({ label: "Trending", icon: Zap, color: "#ec4899" });
  if (project.members?.length >= 2) badges.push({ label: "Team Player", icon: Users, color: "#06b6d4" });
  if (project.progress >= 100) badges.push({ label: "100% Complete", icon: CheckCircle, color: "#10b981" });
  return badges;
}

function CreatePostCard({ user, token, onPostCreated }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const descRef = useRef(null);

  useEffect(() => {
    if (expanded && descRef.current) {
      descRef.current.focus();
    }
  }, [expanded]);

  const addTech = (val) => {
    const trimmed = val.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
    }
  };

  const handleTechKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTech(techInput);
      setTechInput("");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast("Title is required", "error");
    if (!description.trim()) return toast("Description is required", "error");
    setLoading(true);
    try {
      const project = await createDashboardProject(token, {
        title: title.trim(),
        description: description.trim(),
        note: note.trim(),
      });
      onPostCreated(project);
      setTitle("");
      setDescription("");
      setTechStack([]);
      setTechInput("");
      setNote("");
      setExpanded(false);
      toast("Project created!");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = user?.username
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=6366f1&textColor=ffffff`
    : null;

  return (
    <div className="my-feed-create-card">
      {!expanded ? (
        <div className="my-feed-create-collapsed" onClick={() => setExpanded(true)}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="my-feed-create-avatar" />
          ) : (
            <div className="my-feed-create-avatar my-feed-create-avatar-fallback">
              {(user?.username || "U")[0].toUpperCase()}
            </div>
          )}
          <span className="my-feed-create-placeholder">Share your latest project update...</span>
        </div>
      ) : (
        <div className="my-feed-create-expanded">
          <div className="my-feed-create-header">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="my-feed-create-avatar" />
            ) : (
              <div className="my-feed-create-avatar my-feed-create-avatar-fallback">
                {(user?.username || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="my-feed-create-user">
              <span className="my-feed-create-name">{user?.username || "You"}</span>
              <span className="my-feed-create-label">Creating a new project</span>
            </div>
            <button className="my-feed-create-close" onClick={() => setExpanded(false)}>
              <X size={18} />
            </button>
          </div>
          <input
            type="text"
            className="my-feed-create-title-input"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            ref={descRef}
            className="my-feed-create-desc-input"
            placeholder="Describe your project idea in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div className="my-feed-create-tech-row">
            {techStack.map((t, i) => (
              <span key={i} className="my-feed-create-tag">
                {t}
                <button onClick={() => setTechStack(techStack.filter((_, j) => j !== i))}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              className="my-feed-create-tech-input"
              placeholder="Add tech tag..."
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={handleTechKey}
            />
          </div>
          <div className="my-feed-create-actions">
            <button
              className="my-feed-create-submit"
              onClick={handleSubmit}
              disabled={loading || !title.trim() || !description.trim()}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
              <span>{loading ? "Publishing..." : "Publish"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MyPostCard({ project, onLike, onEdit, onDelete, onPin, onProgressChange, isLiked, likeLoading, onViewProject }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [progressVal, setProgressVal] = useState(project.progress || 0);
  const [imgErr, setImgErr] = useState(false);

  const avatarUrl = project.userId?.username
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(project.userId.username)}&backgroundColor=6366f1&textColor=ffffff`
    : null;

  const timeAgo = formatTimeAgo(project.timestamp);
  const achievements = getAchievements(project);
  const likeCount = project.likes?.length || 0;
  const commentCount = project.comments?.length || 0;

  const handleProgressSave = () => {
    onProgressChange(project._id, progressVal);
    setEditingProgress(false);
  };

  const progressColor =
    progressVal >= 100 ? "#10b981" :
    progressVal >= 50 ? "#6366f1" :
    progressVal >= 25 ? "#f59e0b" :
    "#ef4444";

  return (
    <div className="my-feed-post-card">
      <div className="my-feed-post-header">
        <div className="my-feed-post-user">
          {avatarUrl && !imgErr ? (
            <img src={avatarUrl} alt="" className="my-feed-post-avatar" onError={() => setImgErr(true)} />
          ) : (
            <div className="my-feed-post-avatar my-feed-post-avatar-fallback">
              {(project.userId?.username || "U")[0].toUpperCase()}
            </div>
          )}
          <div className="my-feed-post-user-info">
            <span className="my-feed-post-username">{project.userId?.username || "You"}</span>
            <span className="my-feed-post-time"><Clock size={12} /> {timeAgo}</span>
          </div>
        </div>
        <div className="my-feed-post-header-actions">
          {project.pinned && <Pin size={14} className="my-feed-pinned-icon" />}
          <div className="my-feed-post-menu-container">
            <button className="my-feed-post-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="my-feed-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="my-feed-post-menu">
                  <button onClick={() => { onEdit(project); setMenuOpen(false); }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => { onPin(project._id); setMenuOpen(false); }}>
                    {project.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    {project.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button className="my-feed-menu-danger" onClick={() => { onDelete(project._id); setMenuOpen(false); }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <h3 className="my-feed-post-title">{project.title}</h3>
      <p className="my-feed-post-desc">{project.description}</p>

      {project.techStack?.length > 0 && (
        <div className="my-feed-post-tags">
          {project.techStack.map((tech, i) => (
            <span key={i} className="my-feed-post-tag">{tech}</span>
          ))}
        </div>
      )}

      <div className="my-feed-post-progress-section">
        <div className="my-feed-post-progress-header">
          <span className="my-feed-post-progress-label">Progress</span>
          {editingProgress ? (
            <div className="my-feed-progress-edit">
              <input
                type="range"
                min="0"
                max="100"
                value={progressVal}
                onChange={(e) => setProgressVal(Number(e.target.value))}
                className="my-feed-progress-slider"
              />
              <span className="my-feed-progress-value" style={{ color: progressColor }}>{progressVal}%</span>
              <button className="my-feed-progress-save" onClick={handleProgressSave}>
                <CheckCircle size={14} />
              </button>
            </div>
          ) : (
            <button className="my-feed-progress-edit-btn" onClick={() => setEditingProgress(true)}>
              <span className="my-feed-progress-value" style={{ color: progressColor }}>{progressVal}%</span>
            </button>
          )}
        </div>
        <div className="my-feed-progress-bar-track">
          <div
            className="my-feed-progress-bar-fill"
            style={{ width: `${progressVal}%`, background: `linear-gradient(90deg, ${progressColor}, ${progressColor}88)` }}
          />
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="my-feed-post-achievements">
          {achievements.map((badge, i) => (
            <span
              key={i}
              className="my-feed-achievement-badge"
              style={{ borderColor: `${badge.color}44`, backgroundColor: `${badge.color}15`, color: badge.color }}
            >
              <badge.icon size={12} />
              {badge.label}
            </span>
          ))}
        </div>
      )}

      <div className="my-feed-post-engagement">
        <button
          className={`my-feed-engagement-btn ${isLiked ? "liked" : ""}`}
          onClick={() => onLike(project._id)}
          disabled={likeLoading}
        >
          <Heart size={16} className={isLiked ? "fill-red-400" : ""} />
          <span>{formatCount(likeCount)}</span>
        </button>
        <button className="my-feed-engagement-btn" onClick={() => onViewProject(project)}>
          <MessageCircle size={16} />
          <span>{formatCount(commentCount)}</span>
        </button>
        <button className="my-feed-engagement-btn" onClick={() => {
          navigator.clipboard?.writeText(`${window.location.origin}/dashboard/workspace/${project._id}`);
          toast("Link copied!");
        }}>
          <Share2 size={16} />
        </button>
        <button
          className={`my-feed-engagement-btn ${project._id ? "" : ""}`}
          onClick={() => onViewProject(project)}
        >
          <ArrowUpRight size={16} />
          <span>Open</span>
        </button>
      </div>
    </div>
  );
}

function MyFeedSkeleton() {
  return (
    <div className="my-feed-skeleton-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="my-feed-skeleton-card">
          <div className="my-feed-skeleton-row">
            <div className="my-feed-skeleton-avatar" />
            <div className="my-feed-skeleton-lines">
              <div className="my-feed-skeleton-line w-32" />
              <div className="my-feed-skeleton-line w-20" />
            </div>
          </div>
          <div className="my-feed-skeleton-line w-3/4 mt-4" />
          <div className="my-feed-skeleton-line w-full mt-2" />
          <div className="my-feed-skeleton-line w-2/3 mt-2" />
          <div className="my-feed-skeleton-bar mt-4" />
          <div className="my-feed-skeleton-row mt-4 gap-3">
            <div className="my-feed-skeleton-btn" />
            <div className="my-feed-skeleton-btn" />
            <div className="my-feed-skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyFeed() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [likeLoading, setLikeLoading] = useState(null);
  const [commentLoading, setCommentLoading] = useState(null);

  const extractUserId = useCallback(() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).userId;
    } catch {
      return null;
    }
  }, [token]);

  const buildLikedSet = useCallback((projects) => {
    const userId = extractUserId();
    if (!userId) return new Set();
    return new Set(
      projects
        .filter((p) => p.likes?.some((l) => l.toString() === userId || l._id?.toString() === userId))
        .map((p) => p._id),
    );
  }, [extractUserId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getMyProjects(token);
        if (!mounted) return;
        const projects = Array.isArray(data) ? data : [];
        const pinned = projects.filter((p) => p.pinned);
        const rest = projects.filter((p) => !p.pinned);
        setPinnedPosts(pinned);
        setPosts(rest);
        setLikedIds(buildLikedSet(projects));
      } catch (err) {
        if (mounted) toast(err.message, "error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLike = async (projectId) => {
    if (!token) return toast("Please login to like", "error");
    setLikeLoading(projectId);
    try {
      await toggleLike(token, projectId);
      const userId = extractUserId();
      const wasLiked = likedIds.has(projectId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(projectId);
        else next.add(projectId);
        return next;
      });
      const updateLikes = (list) =>
        list.map((p) =>
          p._id === projectId
            ? {
                ...p,
                likes: wasLiked
                  ? p.likes.filter((l) => l.toString() !== userId)
                  : [...p.likes, userId],
              }
            : p,
        );
      setPinnedPosts((prev) => updateLikes(prev));
      setPosts((prev) => updateLikes(prev));
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
      const updateComments = (list) =>
        list.map((p) => (p._id === projectId ? { ...p, comments: result.comments } : p));
      setPinnedPosts((prev) => updateComments(prev));
      setPosts((prev) => updateComments(prev));
      toast("Comment added!");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCommentLoading(null);
    }
  };

  const handlePin = async (projectId) => {
    try {
      const result = await pinProject(token, projectId);
      if (result.pinned) {
        const project = [...pinnedPosts, ...posts].find((p) => p._id === projectId);
        if (project) {
          setPinnedPosts((prev) => [...prev, { ...project, pinned: true }]);
          setPosts((prev) => prev.filter((p) => p._id !== projectId));
        }
      } else {
        const project = [...pinnedPosts, ...posts].find((p) => p._id === projectId);
        if (project) {
          setPosts((prev) => [{ ...project, pinned: false }, ...prev]);
          setPinnedPosts((prev) => prev.filter((p) => p._id !== projectId));
        }
      }
      toast(result.pinned ? "Pinned!" : "Unpinned");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(token, projectId);
      setPinnedPosts((prev) => prev.filter((p) => p._id !== projectId));
      setPosts((prev) => prev.filter((p) => p._id !== projectId));
      toast("Project deleted");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleProgressChange = async (projectId, progress) => {
    try {
      await updateProjectProgress(token, projectId, progress);
      const updateProgress = (list) =>
        list.map((p) => (p._id === projectId ? { ...p, progress } : p));
      setPinnedPosts((prev) => updateProgress(prev));
      setPosts((prev) => updateProgress(prev));
      toast("Progress updated!");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleEdit = (project) => {
    navigate(`/dashboard/create`, { state: { editProject: project } });
  };

  const handlePostCreated = (project) => {
    setPosts((prev) => [project, ...prev]);
  };

  const handleViewProject = (project) => {
    navigate(`/dashboard/workspace/${project._id}`, { state: { project } });
  };

  const totalLikes = [...pinnedPosts, ...posts].reduce((sum, p) => sum + (p.likes?.length || 0), 0);
  const totalMembers = [...new Set([...pinnedPosts, ...posts].flatMap((p) => p.members?.map((m) => m._id || m) || []))].length;
  const totalPosts = pinnedPosts.length + posts.length;

  return (
    <div className="my-feed-page">
      <div className="my-feed-header">
        <div className="my-feed-header-left">
          <div className="my-feed-header-title-row">
            <div className="my-feed-header-icon">
              <Sparkles size={20} />
            </div>
            <h1 className="my-feed-title">My Feed</h1>
          </div>
          
        </div>
        <div className="my-feed-header-right">
          {/* <div className="my-feed-filter-chip active">
            <Radio size={14} />
            <span>Only My Posts</span>
          </div> */}
        </div>
      </div>

      <div className="my-feed-stats">
        <div className="my-feed-stat-card">
          <FolderOpen size={18} className="my-feed-stat-icon" />
          <div className="my-feed-stat-info">
            <span className="my-feed-stat-value">{totalPosts}</span>
            <span className="my-feed-stat-label">Projects</span>
          </div>
        </div>
        <div className="my-feed-stat-card">
          <Heart size={18} className="my-feed-stat-icon" />
          <div className="my-feed-stat-info">
            <span className="my-feed-stat-value">{formatCount(totalLikes)}</span>
            <span className="my-feed-stat-label">Likes</span>
          </div>
        </div>
        <div className="my-feed-stat-card">
          <Users size={18} className="my-feed-stat-icon" />
          <div className="my-feed-stat-info">
            <span className="my-feed-stat-value">{formatCount(totalMembers)}</span>
            <span className="my-feed-stat-label">Collaborators</span>
          </div>
        </div>
      </div>

      <CreatePostCard user={user} token={token} onPostCreated={handlePostCreated} />

      {loading ? (
        <MyFeedSkeleton />
      ) : totalPosts === 0 ? (
        <div className="my-feed-empty">
          <div className="my-feed-empty-icon">
            <FolderOpen size={48} />
          </div>
          <h3 className="my-feed-empty-title">You haven't shared any updates yet</h3>
          <p className="my-feed-empty-desc">
            Create your first project to start building your developer feed.
          </p>
          <button
            onClick={() => navigate("/dashboard/create")}
            className="my-feed-empty-cta"
          >
            <Plus size={16} />
            Create your first project
          </button>
        </div>
      ) : (
        <div className="my-feed-posts">
          {pinnedPosts.length > 0 && (
            <div className="my-feed-pinned-section">
              <div className="my-feed-pinned-header">
                <Pin size={14} />
                <span>Pinned Projects ({pinnedPosts.length})</span>
              </div>
              <div className="my-feed-pinned-scroll">
                {pinnedPosts.map((project) => (
                  <div key={project._id} className="my-feed-pinned-card-wrapper">
                    <MyPostCard
                      project={project}
                      isLiked={likedIds.has(project._id)}
                      likeLoading={likeLoading === project._id}
                      commentLoading={commentLoading === project._id}
                      onLike={handleLike}
                      onComment={handleComment}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onPin={handlePin}
                      onProgressChange={handleProgressChange}
                      onViewProject={handleViewProject}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {posts.map((project) => (
            <MyPostCard
              key={project._id}
              project={project}
              isLiked={likedIds.has(project._id)}
              likeLoading={likeLoading === project._id}
              commentLoading={commentLoading === project._id}
              onLike={handleLike}
              onComment={handleComment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onProgressChange={handleProgressChange}
              onViewProject={handleViewProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
