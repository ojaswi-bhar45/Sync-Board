import { Flame } from "lucide-react";

function formatCount(num) {
  if (!num) return "0";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
}

export default function TrendingCarousel({ projects, onLike, onRequest, likedIds }) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="trending-carousel-section">
      <div className="trending-carousel-header">
        <Flame size={18} className="text-orange-400" />
        <span className="trending-carousel-title">Trending</span>
        <span className="trending-carousel-subtitle">Popular projects right now</span>
      </div>
      <div className="trending-carousel-track">
        {projects.map((p) => {
          const avatarUrl = p.userId?.username
            ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.userId.username)}&backgroundColor=6366f1&textColor=ffffff`
            : null;
          const likeCount = p.likes?.length || 0;
          const viewCount = p.views || 0;

          return (
            <div
              key={p._id}
              className="trending-carousel-card"
              onClick={() => onRequest(p)}
            >
              <div className="trending-carousel-card-top">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="trending-carousel-avatar" />
                ) : (
                  <div className="trending-carousel-avatar trending-carousel-avatar-fallback">
                    {p.title?.[0]?.toUpperCase() || "P"}
                  </div>
                )}
                <div className="trending-carousel-card-info">
                  <span className="trending-carousel-card-title">{p.title}</span>
                  <span className="trending-carousel-card-author">by {p.userId?.username || "Unknown"}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onLike(p._id); }}
                  className={`trending-carousel-like ${likedIds?.has(p._id) ? "liked" : ""}`}
                >
                  <Flame size={14} />
                </button>
              </div>
              <p className="trending-carousel-card-desc">{p.description}</p>
              <div className="trending-carousel-card-footer">
                {p.techStack && p.techStack.length > 0 && (
                  <span className="trending-carousel-badge">{p.techStack[0]}</span>
                )}
                <div className="trending-carousel-stats">
                  <span>{formatCount(likeCount)} likes</span>
                  <span>·</span>
                  <span>{formatCount(viewCount)} views</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
