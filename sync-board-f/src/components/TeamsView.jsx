import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import {
  Loader2,
  Users,
  ArrowUpRight,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Search,
} from "lucide-react";
import { toast } from "../components/Toast";
import {
  getMyTeams,
  getTeamMembers,
  promoteMember,
  demoteMember,
  removeMember,
  updateMemberRole,
  inviteMember,
} from "../api";
import TeamMemberCard from "./TeamMemberCard";
import MemberActionMenu from "./MemberActionMenu";

export default function TeamsView({ refreshKey }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { startChat } = useChat();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState({});
  const [membersLoading, setMembersLoading] = useState(null);
  const [menuMember, setMenuMember] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(null);
  const [inviteInput, setInviteInput] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchTeams = async () => {
      setLoading(true);
      try {
        const res = await getMyTeams(token);
        if (!cancelled) {
          setTeams(res.teams || []);
        }
      } catch (err) {
        if (!cancelled) toast(err.message, "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTeams();
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  const fetchMembers = useCallback(async (projectId) => {
    if (!token) return;
    setMembersLoading(projectId);
    try {
      const res = await getTeamMembers(token, projectId);
      setTeamMembers((prev) => ({ ...prev, [projectId]: res.members || [] }));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setMembersLoading(null);
    }
  }, [token]);

  const toggleExpand = useCallback((projectId) => {
    setExpandedTeam((prev) => {
      const next = prev === projectId ? null : projectId;
      if (next && !teamMembers[next]) {
        fetchMembers(next);
      }
      return next;
    });
  }, [teamMembers, fetchMembers]);

  const handleAction = useCallback(async (action, member, extra) => {
    if (!expandedTeam || !token) return;
    setActionLoading(member.user?._id);

    try {
      if (action === "promote") {
        await promoteMember(token, expandedTeam, member.user._id);
        toast("Member promoted to admin");
        await fetchMembers(expandedTeam);
      } else if (action === "demote") {
        await demoteMember(token, expandedTeam, member.user._id);
        toast("Admin demoted to member");
        await fetchMembers(expandedTeam);
      } else if (action === "role") {
        await updateMemberRole(token, expandedTeam, member.user._id, extra);
        toast("Role updated");
        await fetchMembers(expandedTeam);
      } else if (action === "remove") {
        await removeMember(token, expandedTeam, member.user._id);
        toast("Member removed");
        await fetchMembers(expandedTeam);
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  }, [token, expandedTeam, fetchMembers]);

  const handleInvite = useCallback(async (projectId) => {
    if (!inviteInput.trim() || !token) return;
    setActionLoading("invite");
    try {
      await inviteMember(token, projectId, inviteInput.trim());
      toast("Member invited");
      setInviteInput("");
      setInviteOpen(null);
      await fetchMembers(projectId);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  }, [token, inviteInput, fetchMembers]);

  if (!token) {
    return (
      <div className="feed-center-scroll">
        <div className="feed-empty" style={{ marginTop: 80 }}>
          <h3 className="feed-empty-title">Please log in</h3>
          <p className="feed-empty-desc">Sign in to view your teams.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-center-scroll">
      <div className="collab-header">
        <h1 className="feed-title">My Teams</h1>
        <p className="feed-subtitle">Projects you own or collaborate on</p>
      </div>

      {loading ? (
        <div className="feed-loading">
          <Loader2 size={36} className="feed-spinner" />
          <p className="feed-loading-text">Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="feed-empty" style={{ marginTop: 40 }}>
          <div className="feed-empty-icon">
            <Users size={32} className="text-indigo-400" />
          </div>
          <h3 className="feed-empty-title">No teams yet</h3>
          <p className="feed-empty-desc">
            Once your collaboration requests are accepted, your teams will appear here.
          </p>
        </div>
      ) : (
        <div className="teams-list">
          {teams.map((project) => {
            const isExpanded = expandedTeam === project._id;
            const members = teamMembers[project._id] || [];
            const canManage = project.userPermission === "owner" || project.userPermission === "admin";

            return (
              <div key={project._id} className="teams-project-card">
                <div
                  className="teams-project-header"
                  onClick={() => toggleExpand(project._id)}
                >
                  <div className="teams-project-left">
                    <div className="teams-expand-icon">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    <div className="collab-avatar">
                      {(project.userId?.username || "P")[0].toUpperCase()}
                    </div>
                    <div className="teams-project-info">
                      <span className="teams-project-title">{project.title}</span>
                      <span className="teams-project-meta">
                        by {project.userId?.username || "Unknown"}
                        {" \u00B7 "}
                        {members.length > 0 ? members.length : (project.members?.length || 0) + 1} member
                        {((members.length > 0 ? members.length : (project.members?.length || 0) + 1) !== 1) ? "s" : ""}
                        {" \u00B7 "}
                        <span className={`teams-permission-chip ${project.userPermission}`}>
                          {project.userPermission === "owner" ? "\uD83D\uDC51 Owner" : project.userPermission === "admin" ? "\uD83D\uDEE0\uFE0F Admin" : "\uD83D\uDC64 Member"}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="teams-project-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startChat(project._id, project.title);
                      }}
                      className="collab-view-project"
                      title="Team Chat"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/workspace/${project._id}`, { state: { project } });
                      }}
                      className="collab-view-project"
                      title="View workspace"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="teams-project-body">
                    {membersLoading === project._id ? (
                      <div className="teams-members-loading">
                        <Loader2 size={20} className="feed-spinner" />
                      </div>
                    ) : (
                      <>
                        <div className="teams-members-list">
                          {members.map((m) => (
                            <TeamMemberCard
                              key={m.user?._id || "owner"}
                              member={m}
                              currentUserPermission={project.userPermission}
                              onAction={(action, member) => {
                                if (action === "menu") setMenuMember({ member, projectId: project._id });
                              }}
                            />
                          ))}
                        </div>

                        {canManage && (
                          <div className="teams-invite-section">
                            {inviteOpen === project._id ? (
                              <div className="teams-invite-form">
                                <div className="teams-invite-input-wrapper">
                                  <Search size={14} className="teams-invite-icon" />
                                  <input
                                    type="text"
                                    className="teams-invite-input"
                                    placeholder="Username or email..."
                                    value={inviteInput}
                                    onChange={(e) => setInviteInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleInvite(project._id);
                                      if (e.key === "Escape") { setInviteOpen(null); setInviteInput(""); }
                                    }}
                                    autoFocus
                                  />
                                </div>
                                <button
                                  className="teams-invite-submit"
                                  onClick={() => handleInvite(project._id)}
                                  disabled={!inviteInput.trim() || actionLoading === "invite"}
                                >
                                  {actionLoading === "invite" ? <Loader2 size={14} className="animate-spin" /> : "Invite"}
                                </button>
                                <button
                                  className="teams-invite-cancel"
                                  onClick={() => { setInviteOpen(null); setInviteInput(""); }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className="teams-invite-btn"
                                onClick={() => setInviteOpen(project._id)}
                              >
                                <UserPlus size={14} />
                                <span>Invite Member</span>
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {menuMember && (
        <MemberActionMenu
          member={menuMember.member}
          currentUserPermission={teams.find((t) => t._id === menuMember.projectId)?.userPermission}
          onAction={handleAction}
          onClose={() => setMenuMember(null)}
        />
      )}
    </div>
  );
}
