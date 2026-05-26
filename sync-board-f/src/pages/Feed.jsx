import { useState, useEffect, useCallback, useRef } from "react";
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
import {
  Loader2, FolderOpen, Search, Plus, Sparkles,
  SlidersHorizontal, ArrowUpDown,
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

function filterParams(activeFilter, sortBy) {
  const params = {};
  if (activeFilter === "trending" || sortBy === "trending") params.sort = "trending";
  if (activeFilter === "ai") { params.tag = "ai"; params.sort = "recent"; }
  else if (activeFilter === "webdev") { params.tag = "webdev"; params.sort = "recent"; }
  else if (!params.sort) params.sort = "recent";
  return params;
}

export default function Feed({ onNavigate }) {
  const { token } = useAuth();
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

  // Fetch main projects
  const fetchProjects = useCallback(async (filter, search, pageNum = 1) => {
    const isInitial = pageNum === 1;
    if (isInitial) setLoading(true);
    try {
      const params = { page: pageNum, limit: PAGE_LIMIT, ...filterParams(filter) };
      if (search) params.search = search;
      const data = await getFeedProjects(params);
      if (isInitial) {
        setProjects(data.projects);
        setPage(1);
        setHasMore(data.hasMore);
        setLikedIds(buildLikedSet(data.projects));
      } else {
        return data;
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [buildLikedSet]);

  // Fetch trending projects (only on mount)
  const fetchTrending = useCallback(async () => {
    try {
      const data = await getFeedProjects({ page: 1, limit: TRENDING_LIMIT, sort: "trending" });
      setTrendingProjects(data.projects);
    } catch {
      // silently fail
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProjects("all", "");
    fetchTrending();
    setSavedIds(buildSavedSet());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filter or search changes
  useEffect(() => {
    fetchProjects(activeFilter, searchQuery);
  }, [activeFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(val);
    }, SEARCH_DEBOUNCE);
  };

  // Infinite scroll: fetch next page
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

  // IntersectionObserver for infinite scroll
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

  const showTrending = trendingProjects.length > 0 && activeFilter === "all" && !searchQuery;

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* ─── Header: Title + Search + Filter ─── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
                Project Feed
                <Sparkles size={20} className="text-indigo-400" />
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Discover and collaborate on amazing projects
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="feed-search flex-1 sm:w-64">
                <Search size={16} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchInput}
                  onChange={handleSearchChange}
                />
              </div>
              <button className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:text-gray-300 transition-all">
                <SlidersHorizontal size={16} />
              </button>
              <button className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:text-gray-300 transition-all">
                <ArrowUpDown size={16} />
              </button>
            </div>
          </div>

          {/* ─── Filter Tabs ─── */}
          <div className="flex gap-1 mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`filter-tab ${activeFilter === f.key ? "active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ─── Trending Section ─── */}
          {showTrending && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-white">🔥 Trending</span>
                <span className="text-xs text-gray-500">Popular projects right now</span>
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

          {/* ─── Main Grid ─── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="text-indigo-400 animate-spin mb-4" />
              <p className="text-gray-500 text-sm">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state-glow flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
                <FolderOpen size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">No projects found</h3>
              <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Be the first to create a project and find collaborators"}
              </p>
              <button
                onClick={() => onNavigate("create")}
                className="gradient-btn inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create your first project
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {projects.map((project, index) => (
                  <div
                    key={project._id}
                    className="animate-[fadeIn_0.3s_ease-out_both]"
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
                      likeLoading={likeLoading === project._id}
                      commentLoading={commentLoading === project._id}
                    />
                  </div>
                ))}
              </div>

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="flex items-center justify-center py-8">
                {loadingMore ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={22} className="text-indigo-400 animate-spin" />
                    <span className="text-sm text-gray-500">Loading more projects...</span>
                  </div>
                ) : hasMore ? (
                  <span className="text-sm text-gray-600">Scroll for more</span>
                ) : (
                  <span className="text-sm text-gray-600">You've reached the end</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Floating CTA ─── */}
      <button
        onClick={() => onNavigate("create")}
        className="floating-cta hidden sm:flex"
        title="Create Project"
      >
        <Plus size={24} />
      </button>

      <RequestModal
        isOpen={reqModal.open}
        onClose={() => setReqModal({ open: false, project: null })}
        onSubmit={handleRequest}
        loading={reqLoading}
      />
    </>
  );
}
