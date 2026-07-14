import { useEffect, useRef } from "react";
import { Shield, ShieldOff, ArrowDown, Trash2, X } from "lucide-react";

const TEAM_ROLE_OPTIONS = [
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "fullstack", label: "Full Stack Developer" },
  { value: "uiux", label: "UI/UX Designer" },
  { value: "devops", label: "DevOps Engineer" },
  { value: "qa", label: "QA Engineer" },
  { value: "ml", label: "ML Engineer" },
  { value: "mobile", label: "Mobile Developer" },
  { value: "other", label: "Other" },
];

export default function MemberActionMenu({ member, currentUserPermission, onAction, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const isOwner = currentUserPermission === "owner";
  const targetPermission = member.permission;

  return (
    <div className="member-action-menu-overlay" onClick={onClose}>
      <div
        ref={menuRef}
        className="member-action-menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="member-action-menu-header">
          <span className="member-action-menu-title">
            {member.user?.username || "Member"}
          </span>
          <button className="member-action-menu-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="member-action-menu-body">
          {isOwner && targetPermission === "member" && (
            <button
              className="member-action-item"
              onClick={() => { onAction("promote", member); onClose(); }}
            >
              <Shield size={14} />
              <span>Make Admin</span>
            </button>
          )}

          {isOwner && targetPermission === "admin" && (
            <button
              className="member-action-item"
              onClick={() => { onAction("demote", member); onClose(); }}
            >
              <ShieldOff size={14} />
              <span>Remove Admin</span>
            </button>
          )}

          {isOwner && targetPermission !== "owner" && (
            <div className="member-action-submenu">
              <div className="member-action-submenu-label">
                <ArrowDown size={12} />
                <span>Change Role</span>
              </div>
              <div className="member-action-role-grid">
                {TEAM_ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    className={`member-action-role-item ${member.teamRole === role.value ? "active" : ""}`}
                    onClick={() => { onAction("role", member, role.value); onClose(); }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentUserPermission === "admin" && targetPermission === "member" && (
            <div className="member-action-submenu">
              <div className="member-action-submenu-label">
                <ArrowDown size={12} />
                <span>Change Role</span>
              </div>
              <div className="member-action-role-grid">
                {TEAM_ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    className={`member-action-role-item ${member.teamRole === role.value ? "active" : ""}`}
                    onClick={() => { onAction("role", member, role.value); onClose(); }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isOwner && targetPermission !== "owner" && (
            <>
              <div className="member-action-divider" />
              <button
                className="member-action-item danger"
                onClick={() => { onAction("remove", member); onClose(); }}
              >
                <Trash2 size={14} />
                <span>Remove Member</span>
              </button>
            </>
          )}

          {currentUserPermission === "admin" && targetPermission === "member" && (
            <>
              <div className="member-action-divider" />
              <button
                className="member-action-item danger"
                onClick={() => { onAction("remove", member); onClose(); }}
              >
                <Trash2 size={14} />
                <span>Remove Member</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
