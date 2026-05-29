/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import ProjectCard from "../components/ProjectCard";
import RequestModal from "../components/RequestModal";
import { toast } from "../components/Toast";
import {
  getFeedProjects,
  toggleLike,
  addComment,
  sendJoinRequest,
} from "../api";
import CollaborationRequestsView from "../components/CollaborationRequestsView";
import TeamsView from "../components/TeamsView";
import { updateJoinRequest } from "../api";
import {
  Loader2, FolderOpen, Search, Plus, Sparkles,
  SlidersHorizontal, Home, Compass, Bell, MessageSquare, Handshake,
  Hash, Users, Flame, Eye,
} from "lucide-react";

const PAGE_LIMIT = 12;
const TRENDING_LIMIT = 8;
const SEARCH_DEBOUNCE = 350;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "trending", label: "Trending" },
  { key: "recent", label: "Recent" },
  { key: "ai", label: "AI" },
  { key: "webdev", label: "Web Dev" },
  { key: "opensource", label: "Open Source" },
];

const TRENDING_TAGS = [
  { tag: "react", count: 342 },
  { tag: "javascript", count: 285 },
  { tag: "nodejs", count: 198 },
  { tag: "python", count: 156 },
  { tag: "nextjs", count: 134 },
  { tag: "typescript", count: 112 },
  { tag: "tailwind", count: 89 },
  { tag: "mongodb", count: 76 },
];

function filterParams(activeFilter) {
  const params = {};
  if (activeFilter === "trending") params.sort = "trending";
  else if (activeFilter === "ai") { params.tag = "ai"; params.sort = "recent"; }
  else if (activeFilter === "webdev") { params.tag = "webdev"; params.sort = "recent"; }
  else params.sort = "recent";
  return params;
}

function FeedLeftNav({ user, activeView, onFeedNav }) {
  const navigate = useNavigate();
  const links = [
    { icon: Home, view: "feed", label: "Home" },
    { icon: Users, view: "teams", label: "My Teams" },
    { icon: Bell, view: "notifications", label: "Notifications" },
    { icon: Handshake, view: "collaboration", label: "Collaboration" },
  ];

  const handleClick = (view) => {
    if (view === "collaboration" || view === "teams") {
      onFeedNav?.(view);
    } else {
      navigate("/dashboard/feed");
    }
  };

  return (
    <nav className="feed-left-nav">
      <div className="feed-left-nav-inner">
        <div className="feed-left-nav-links">
          {links.map(({ icon: Icon, view, label }) => (
            <button
              key={view}
              onClick={() => handleClick(view)}
              className={`feed-left-nav-btn ${activeView === view ? "active" : ""}`}
              title={label}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate("/dashboard/profile")}
          className="feed-left-nav-avatar"
          title="Profile"
        >
          <div className="feed-left-avatar-ring">
            <span className="feed-left-avatar-text">
              {(user?.username || "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="feed-left-online-dot" />
        </button>
      </div>
    </nav>
  );
}

function FeedRightPanel() {
  const [following, setFollowing] = useState(new Set());

  const toggleFollow = (name) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <aside className="feed-right-panel">
      <div className="widget-card">
        <div className="widget-header">
          <Flame size={16} className="text-orange-400" />
          <span className="widget-title">Trending Tags</span>
        </div>
        <div className="widget-divider" />
        <div className="widget-tags">
          {TRENDING_TAGS.map(({ tag, count }) => (
            <button key={tag} className="trending-tag">
              <Hash size={12} className="trending-tag-hash" />
              <span className="trending-tag-name">{tag}</span>
              <span className="trending-tag-count">{count}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user } = useAuth();
  const { startChat } = useChat();
  const [feedView, setFeedView] = useState("feed");

  const initialView = searchParams.get('view');
  useEffect(() => {
    if (initialView === "teams" || initialView === "collaboration") {
      setFeedView(initialView);
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const [teamsRefreshKey, setTeamsRefreshKey] = useState(0);
  const [projects, setProjects] = useState([]);
  const [trendingProjects, setTrendingProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [likeLoading, setLikeLoading] = useState(null);
  const [commentLoading, setCommentLoading] = useState(null);
  const [reqModal, setReqModal] = useState({ open: false, project: null });
  const [reqLoading, setReqLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const sentinelRef = useRef(null);
  const searchTimer = useRef(null);

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

  const buildSavedSet = useCallback(() => {
    try {
      const raw = localStorage.getItem("savedProjects");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }, []);

  const persistSaved = (set) => {
    localStorage.setItem("savedProjects", JSON.stringify([...set]));
  };

  const fetchProjects = useCallback(async (filter, search, pageNum = 1) => {
    const params = { page: pageNum, limit: PAGE_LIMIT, ...filterParams(filter) };
    if (search) params.search = search;
    const data = await getFeedProjects(params);
    return data;
  }, []);

  const loadInitialProjects = useCallback(async (filter, search) => {
    setLoading(true);
    try {
      const data = await fetchProjects(filter, search);
      setProjects(data.projects);
      setPage(1);
      setHasMore(data.hasMore);
      setLikedIds(buildLikedSet(data.projects));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, buildLikedSet]);

  const fetchTrending = useCallback(async () => {
    try {
      const data = await getFeedProjects({ page: 1, limit: TRENDING_LIMIT, sort: "trending" });
      setTrendingProjects(data.projects);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadInitialProjects("all", "");
    fetchTrending();
    setSavedIds(buildSavedSet());
  }, []);

  useEffect(() => {
    loadInitialProjects(activeFilter, searchQuery);
  }, [activeFilter, searchQuery]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(val);
    }, SEARCH_DEBOUNCE);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = { page: nextPage, limit: PAGE_LIMIT, ...filterParams(activeFilter) };
      if (searchQuery) params.search = searchQuery;
      const data = await getFeedProjects(params);
      setProjects((prev) => {
        const existingIds = new Set(prev.map((p) => p._id));
        const newProjects = data.projects.filter((p) => !existingIds.has(p._id));
        return [...prev, ...newProjects];
      });
      setPage(nextPage);
      setHasMore(data.hasMore);
      setLikedIds((prev) => {
        const next = new Set(prev);
        data.projects.forEach((p) => {
          const userId = extractUserId();
          if (userId && p.likes?.some((l) => l.toString() === userId || l._id?.toString() === userId)) {
            next.add(p._id);
          }
        });
        return next;
      });
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, page, activeFilter, searchQuery, extractUserId]);

  useEffect(() => {
    if (loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, hasMore, loadingMore, loadMore]);

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
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? {
                ...p,
                likes: wasLiked
                  ? p.likes.filter((l) => l.toString() !== userId)
                  : [...p.likes, userId],
              }
            : p,
        ),
      );
      setTrendingProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? {
                ...p,
                likes: wasLiked
                  ? p.likes.filter((l) => l.toString() !== userId)
                  : [...p.likes, userId],
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

  const handleSave = (projectId) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      persistSaved(next);
      return next;
    });
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

  const handleViewProject = (project) => {
    navigate(`/dashboard/workspace/${project._id}`, { state: { project } });
  };

  const handleFeedNav = (view) => {
    setFeedView(view);
  };

  const handleProjectsChanged = useCallback(() => {
    loadInitialProjects(activeFilter, searchQuery);
    setTeamsRefreshKey((k) => k + 1);
  }, [loadInitialProjects, activeFilter, searchQuery]);

  const showTrending = trendingProjects.length > 0 && activeFilter === "all" && !searchQuery;

  return (
    <>
      <div className="feed-3col-layout">
        <FeedLeftNav user={user} activeView={feedView} onFeedNav={handleFeedNav} />

        <div className="feed-center">
          {feedView === "collaboration" ? (
            <CollaborationRequestsView
              onProjectsChanged={handleProjectsChanged}
            />
          ) : feedView === "teams" ? (
            <TeamsView
              refreshKey={teamsRefreshKey}
            />
          ) : (
            <div className="feed-center-scroll">
              <div className="feed-header">
                <div className="feed-header-left">
                  <h1 className="feed-title">
                    Project Feed
                    <Sparkles size={22} className="feed-title-icon" />
                  </h1>
                  <p className="feed-subtitle">Discover and collaborate on amazing projects</p>
                </div>
                <div className="feed-header-right">
                  <div className="feed-search-wrapper">
                    <div className="feed-search">
                      <Search size={16} className="feed-search-icon" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchInput}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/dashboard/create")}
                    className="new-post-btn"
                  >
                    <Plus size={18} />
                    <span className="new-post-btn-text">New Post</span>
                  </button>
                  <button className="feed-filter-btn" title="Filters">
                    <SlidersHorizontal size={18} />
                  </button>
                </div>
              </div>

              <div className="feed-tabs">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`feed-tab ${activeFilter === f.key ? "active" : ""}`}
                  >
                    {f.label}
                    {activeFilter === f.key && <div className="feed-tab-glow" />}
                  </button>
                ))}
              </div>

              {showTrending && (
                <div className="feed-trending-section">
                  <div className="feed-trending-header">
                    <Flame size={16} className="text-orange-400" />
                    <span className="feed-trending-title">Trending</span>
                    <span className="feed-trending-subtitle">Popular projects right now</span>
                  </div>
                  <div className="trending-scroll">
                    {trendingProjects.map((p) => (
                      <ProjectCard
                        key={p._id}
                        project={p}
                        compact
                        isLiked={likedIds.has(p._id)}
                        onLike={handleLike}
                        onRequest={(project) => setReqModal({ open: true, project })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="feed-loading">
                  <Loader2 size={36} className="feed-spinner" />
                  <p className="feed-loading-text">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="feed-empty">
                  <div className="feed-empty-icon">
                    <FolderOpen size={32} className="text-indigo-400" />
                  </div>
                  <h3 className="feed-empty-title">No projects found</h3>
                  <p className="feed-empty-desc">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "Be the first to create a project and find collaborators"}
                  </p>
                  <button
                    onClick={() => navigate("/dashboard/create")}
                    className="gradient-btn inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Create your first project
                  </button>
                </div>
              ) : (
                <>
                  <div className="feed-cards">
                    {projects.map((project, index) => (
                      <div
                        key={project._id}
                        className="feed-card-wrapper"
                        style={{ animationDelay: `${Math.min(index % PAGE_LIMIT, 6) * 40}ms` }}
                      >
                        <ProjectCard
                          project={project}
                          isLiked={likedIds.has(project._id)}
                          isSaved={savedIds.has(project._id)}
                          onLike={handleLike}
                          onSave={handleSave}
                          onComment={handleComment}
                          onRequest={(p) => setReqModal({ open: true, project: p })}
                          onViewProject={handleViewProject}
                          likeLoading={likeLoading === project._id}
                          commentLoading={commentLoading === project._id}
                          showThumbnail={index % 3 === 1}
                        />
                      </div>
                    ))}
                  </div>

                  <div ref={sentinelRef} className="feed-sentinel">
                    {loadingMore ? (
                      <div className="feed-sentinel-inner">
                        <Loader2 size={20} className="feed-spinner-sm" />
                        <span>Loading more projects...</span>
                      </div>
                    ) : hasMore ? (
                      <span className="feed-sentinel-text">Scroll for more</span>
                    ) : (
                      <span className="feed-sentinel-text">You've reached the end</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <FeedRightPanel />
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
