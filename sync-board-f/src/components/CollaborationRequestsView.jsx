import { useState, useEffect } from "react";
import { Loader2, UserCheck, UserX, Send, Check, X, Clock, ArrowUpRight } from "lucide-react";
import { toast } from "../components/Toast";
import { getIncomingRequests, getMyRequests } from "../api";

export default function CollaborationRequestsView({ token, onUpdateJoinRequest, onNavigate, onProjectsChanged }) {
  const [activeTab, setActiveTab] = useState("incoming");
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      const [incResult, outResult] = await Promise.allSettled([
        getIncomingRequests(token),
        getMyRequests(token),
      ]);

      if (!cancelled) {
        if (incResult.status === "fulfilled") {
          setIncoming(incResult.value.incoming || []);
        } else {
          console.error("Failed to fetch incoming requests:", incResult.reason);
        }

        if (outResult.status === "fulfilled") {
          setOutgoing(outResult.value.outgoing || []);
        } else {
          console.error("Failed to fetch outgoing requests:", outResult.reason);
        }

        setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [token]);

  const handleAction = async (projectId, requestId, action) => {
    setActionLoading(requestId);
    try {
      await onUpdateJoinRequest(token, projectId, requestId, action);
      if (action === "accepted") {
        toast("Collaborator accepted!");
        onProjectsChanged?.();
      } else {
        toast("Request rejected");
      }
      setIncoming((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusPill = (status) => {
    const cls = status === "pending" ? "pill-pending" : status === "accepted" ? "pill-accepted" : "pill-rejected";
    return <span className={`collab-pill ${cls}`}>{status}</span>;
  };

  if (!token) {
    return (
      <div className="feed-center-scroll">
        <div className="feed-empty" style={{ marginTop: 80 }}>
          <h3 className="feed-empty-title">Please log in</h3>
          <p className="feed-empty-desc">Sign in to view your collaboration requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-center-scroll">
      <div className="collab-header">
        <h1 className="feed-title">
          Collaboration Requests
        </h1>
        {/* <p className="feed-subtitle">Manage incoming requests and track your sent applications</p> */}
      </div>

      <div className="collab-tabs">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`collab-tab ${activeTab === "incoming" ? "active" : ""}`}
        >
          Incoming
          {incoming.length > 0 && <span className="collab-badge">{incoming.length}</span>}
          {activeTab === "incoming" && <div className="collab-tab-glow" />}
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`collab-tab ${activeTab === "outgoing" ? "active" : ""}`}
        >
          Sent Requests
          {activeTab === "outgoing" && <div className="collab-tab-glow" />}
        </button>
      </div>

      {loading ? (
        <div className="feed-loading">
          <Loader2 size={36} className="feed-spinner" />
          <p className="feed-loading-text">Loading requests...</p>
        </div>
      ) : activeTab === "incoming" ? (
        incoming.length === 0 ? (
          <div className="feed-empty" style={{ marginTop: 40 }}>
            <div className="feed-empty-icon">
              <UserCheck size={32} className="text-indigo-400" />
            </div>
            <h3 className="feed-empty-title">No pending requests</h3>
            <p className="feed-empty-desc">When someone requests to join your project, it will appear here.</p>
          </div>
        ) : (
          <div className="collab-list">
            {incoming.map((req) => (
              <div key={req.requestId} className="collab-card">
                <div className="collab-card-top">
                  <div className="collab-card-user">
                    <div className="collab-avatar">
                      {(req.user?.username || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="collab-username">{req.user?.username || "Unknown"}</span>
                      <span className="collab-project-label">wants to join</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate?.("workspace", { _id: req.projectId })}
                    className="collab-view-project"
                    title="View project"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="collab-card-project">
                  <span className="collab-card-project-title">{req.projectTitle}</span>
                  <span className={`status-badge ${req.projectStatus}`}>
                    <span className="status-dot" />
                    {req.projectStatus}
                  </span>
                </div>

                {req.note && (
                  <div className="collab-card-note">
                    <Send size={12} className="collab-note-icon" />
                    <p>"{req.note}"</p>
                  </div>
                )}

                <div className="collab-card-meta">
                  <Clock size={12} />
                  <span>{formatDate(req.createdAt)}</span>
                </div>

                <div className="collab-card-actions">
                  <button
                    onClick={() => handleAction(req.projectId, req.requestId, "accepted")}
                    disabled={actionLoading === req.requestId}
                    className="collab-accept-btn"
                  >
                    {actionLoading === req.requestId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(req.projectId, req.requestId, "rejected")}
                    disabled={actionLoading === req.requestId}
                    className="collab-reject-btn"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        outgoing.length === 0 ? (
          <div className="feed-empty" style={{ marginTop: 40 }}>
            <div className="feed-empty-icon">
              <Send size={32} className="text-indigo-400" />
            </div>
            <h3 className="feed-empty-title">No requests sent yet</h3>
            <p className="feed-empty-desc">Click the handshake icon on any project to send a collaboration request.</p>
          </div>
        ) : (
          <div className="collab-list">
            {outgoing.map((req) => (
              <div key={req.requestId} className="collab-card">
                <div className="collab-card-top">
                  <div className="collab-card-user">
                    <div className="collab-avatar">
                      {(req.owner?.username || "P")[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="collab-username">{req.projectTitle}</span>
                      <span className="collab-project-label">by {req.owner?.username || "Unknown"}</span>
                    </div>
                  </div>
                  {statusPill(req.status)}
                </div>

                {req.note && (
                  <div className="collab-card-note">
                    <Send size={12} className="collab-note-icon" />
                    <p>"{req.note}"</p>
                  </div>
                )}

                <div className="collab-card-meta">
                  <Clock size={12} />
                  <span>Requested {formatDate(req.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
