/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CompactProjectCard from "../components/CompactProjectCard";
import FeedRightPanel from "../components/FeedRightPanel";
import RequestModal from "../components/RequestModal";
import { toast } from "../components/Toast";
import {
  getFeedProjects,
  toggleLike,
  sendJoinRequest,
} from "../api";
import CollaborationRequestsView from "../components/CollaborationRequestsView";
import TeamsView from "../components/TeamsView";
import {
  Loader2, FolderOpen, Search, Plus, Sparkles,
  Home, Handshake, Users,
} from "lucide-react";

const PAGE_LIMIT = 12;
const SEARCH_DEBOUNCE = 350;

function filterParams() {
  return { sort: "recent" };
}

function FeedLeftNav({ user, activeView, onFeedNav }) {
  const navigate = useNavigate();
  const links = [
    { icon: Home, view: "feed", label: "Home" },
    { icon: Users, view: "teams", label: "My Teams" },
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

export default function Feed() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user } = useAuth();
  const [feedView, setFeedView] = useState("feed");

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === "teams" || view === "collaboration") {
      setFeedView(view);
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [teamsRefreshKey, setTeamsRefreshKey] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [likeLoading, setLikeLoading] = useState(null);
  const [reqModal, setReqModal] = useState({ open: false, project: null });
  const [reqLoading, setReqLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [openForCollaborationOnly, setOpenForCollaborationOnly] = useState(false);
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

  const fetchProjects = useCallback(async (search, pageNum = 1, openOnly = false) => {
    const params = { page: pageNum, limit: PAGE_LIMIT, ...filterParams() };
    if (search) params.search = search;
    if (openOnly) params.open = "true";
    const data = await getFeedProjects(params);
    return data;
  }, []);

  const loadInitialProjects = useCallback(async (search, openOnly = false) => {
    setLoading(true);
    try {
      const data = await fetchProjects(search, 1, openOnly);
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

  const focusSearchInput = useCallback(() => {
    const input = document.querySelector('.feed-search input');
    input?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target;
        const tag = (t && t.tagName ? t.tagName.toLowerCase() : '');
        const isTyping = tag === 'input' || tag === 'textarea' || (t && t.isContentEditable);
        if (!isTyping) {
          e.preventDefault();
          focusSearchInput();
        }
      }

      if (e.key === 'Escape') {
        if (document.activeElement && document.activeElement === document.querySelector('.feed-search input')) {
          e.preventDefault();
          setSearchInput('');
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusSearchInput]);

  useEffect(() => {
    loadInitialProjects("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    loadInitialProjects(searchQuery, openForCollaborationOnly);
  }, [searchQuery, openForCollaborationOnly, loadInitialProjects]);

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
      const params = { page: nextPage, limit: PAGE_LIMIT, ...filterParams() };
      if (searchQuery) params.search = searchQuery;
      if (openForCollaborationOnly) params.open = "true";
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
  }, [loadingMore, hasMore, loading, page, searchQuery, openForCollaborationOnly, extractUserId]);

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
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLikeLoading(null);
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

  const handleFeedNav = (view) => {
    setFeedView(view);
  };

  const handleProjectsChanged = useCallback(() => {
    loadInitialProjects(searchQuery);
    setTeamsRefreshKey((k) => k + 1);
  }, [loadInitialProjects, searchQuery]);

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

                </div>
              </div>

              <div className="feed-collab-filter">
                <label className="feed-collab-toggle-label">
                  <input
                    type="checkbox"
                    checked={openForCollaborationOnly}
                    onChange={(e) => setOpenForCollaborationOnly(e.target.checked)}
                    className="feed-collab-checkbox"
                  />
                  <span className="feed-collab-toggle-text">Only show projects accepting collaborators</span>
                </label>
              </div>

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
                        <CompactProjectCard
                          project={project}
                          isLiked={likedIds.has(project._id)}
                          onLike={handleLike}
                          likeLoading={likeLoading === project._id}
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

        {feedView === "feed" && <FeedRightPanel />}
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
