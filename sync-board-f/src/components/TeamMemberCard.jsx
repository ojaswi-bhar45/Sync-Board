import { MoreVertical } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PERMISSION_CONFIG = {
  owner: { icon: "\uD83D\uDC51", label: "Owner", className: "perm-owner" },
  admin: { icon: "\uD83D\uDEE0\uFE0F", label: "Admin", className: "perm-admin" },
  member: { icon: "\uD83D\uDC64", label: "Member", className: "perm-member" },
};

const TEAM_ROLE_LABELS = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  uiux: "UI/UX Designer",
  devops: "DevOps Engineer",
  qa: "QA Engineer",
  ml: "ML Engineer",
  mobile: "Mobile Developer",
  other: "Other",
};

export default function TeamMemberCard({ member, currentUserPermission, onAction }) {
  const { user: currentUser } = useAuth();
  const { user, permission, teamRole, joinedAt } = member;
  const perm = PERMISSION_CONFIG[permission] || PERMISSION_CONFIG.member;
  const roleLabel = TEAM_ROLE_LABELS[teamRole] || "Other";
  const isCurrentUser = currentUser && user?._id === currentUser._id;

  const canShowMenu =
    (currentUserPermission === "owner" && permission !== "owner") ||
    (currentUserPermission === "admin" && permission === "member");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="team-member-card">
      <div className="team-member-left">
        <div className={`team-member-avatar ${perm.className}`}>
          {(user?.username || "U")[0].toUpperCase()}
        </div>
        <div className="team-member-info">
          <div className="team-member-name">
            {isCurrentUser && <span className="team-member-you">(You)</span>}
            {user?.username || "Unknown"}
          </div>
          <div className="team-member-meta">
            <span className={`team-permission-badge ${perm.className}`}>
              {perm.icon} {perm.label}
            </span>
            <span className="team-role-badge">
              {roleLabel}
            </span>
            {joinedAt && (
              <span className="team-join-date">
                Joined {formatDate(joinedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {canShowMenu && (
        <div className="team-member-menu-wrapper">
          <button
            className="team-member-menu-trigger"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("menu", member);
            }}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
