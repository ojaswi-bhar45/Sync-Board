import { Flame, Hash, Hash as Rocket, Users, ExternalLink } from "lucide-react";
import { useState } from "react";

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

const SUGGESTED_USERS = [
  { name: "Sarah Chen", username: "@sarahchen", projects: 12, initials: "SC" },
  { name: "Marcus Rivera", username: "@mrivera", projects: 8, initials: "MR" },
  { name: "Aiko Tanaka", username: "@atanaka", projects: 15, initials: "AT" },
];

function WhoToFollowCard() {
  const [following, setFollowing] = useState({});

  const toggleFollow = (username) => {
    setFollowing((prev) => ({ ...prev, [username]: !prev[username] }));
  };

  return (
    <div className="widget-card">
      <div className="widget-header">
        <Users size={16} className="text-indigo-400" />
        <span className="widget-title">Who to Follow</span>
      </div>
      <div className="widget-divider" />
      <div className="who-to-follow-list">
        {SUGGESTED_USERS.map((user) => (
          <div key={user.username} className="who-to-follow-row">
            <div className="who-to-follow-avatar">
              <span>{user.initials}</span>
            </div>
            <div className="who-to-follow-info">
              <span className="who-to-follow-name">{user.name}</span>
              <span className="who-to-follow-username">{user.username}</span>
            </div>
            <button
              className={`follow-btn ${following[user.username] ? "following" : ""}`}
              onClick={() => toggleFollow(user.username)}
            >
              {following[user.username] ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollaborationBanner() {
  return (
    <div className="collab-banner-card">
      <div className="collab-banner-icon">
        <Rocket size={28} className="text-indigo-300" />
      </div>
      <h3 className="collab-banner-title">Build Together</h3>
      <p className="collab-banner-desc">
        Find collaborators who share your vision and build something amazing.
      </p>
      <button className="collab-banner-cta">
        Find Collaborators
        <ExternalLink size={14} />
      </button>
    </div>
  );
}

export default function FeedRightPanel() {
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
      <WhoToFollowCard />
      <CollaborationBanner />
    </aside>
  );
}
