import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, Phone, MapPin, Link as LinkIcon,
  Save, Loader2, ExternalLink, Sparkles, Calendar,
  CheckCircle2, Circle,
} from "lucide-react";
import { getProfile, updateProfile } from "../api";
import { toast } from "./Toast";

const PROFILE_FIELDS = [
  { key: "username", label: "Username", icon: User, editable: true },
  { key: "email", label: "Email", icon: Mail, editable: false },
  { key: "contactNumber", label: "Contact Number", icon: Phone, editable: true },
  { key: "address", label: "Address", icon: MapPin, editable: true },
  { key: "linkedInProfile", label: "LinkedIn", icon: LinkIcon, editable: true, external: true },
  { key: "githubProfile", label: "GitHub", icon: LinkIcon, editable: true, external: true },
];

function Skeleton() {
  return (
    <div className="profile-page">
      <div className="profile-cover-skeleton" />
      <div className="profile-content">
        <div className="profile-avatar-skeleton" />
        <div className="skeleton-line" style={{ width: "180px", marginTop: "3rem" }} />
        <div className="skeleton-line" style={{ width: "120px" }} />
        <div className="profile-stats-row">
          {[1, 2, 3].map((i) => (
            <div key={i} className="profile-stat-skeleton" />
          ))}
        </div>
        <div className="profile-fields-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="profile-field-skeleton" />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompletenessBar({ score }) {
  const label =
    score === 100
      ? "Complete!"
      : score >= 75
        ? "Almost done"
        : score >= 50
          ? "Halfway there"
          : "Just getting started";

  const Icon = score === 100 ? Sparkles : CheckCircle2;

  return (
    <div className="profile-completeness">
      <div className="completeness-header">
        <span className="completeness-label">
          <Icon size={14} />
          {label}
        </span>
        <span className="completeness-score">{score}%</span>
      </div>
      <div className="completeness-bar">
        <div className="completeness-track">
          <div className="completeness-fill" style={{ width: `${score}%` }} />
          <div className="completeness-dot" style={{ left: `calc(${score}% - 6px)` }} />
        </div>
        <div className="completeness-milestones">
          <span className={score >= 25 ? "passed" : ""} />
          <span className={score >= 50 ? "passed" : ""} />
          <span className={score >= 75 ? "passed" : ""} />
          <span className={score >= 100 ? "passed" : ""} />
        </div>
      </div>
      <div className="completeness-status">
        <Calendar size={12} />
        <span>{PROFILE_FIELDS.filter((f) => f.editable).length} editable fields</span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { token, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile(token);
        if (data.user) setProfile(data.user);
      } catch (err) {
        toast(err.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const completeness = (() => {
    if (!profile) return { score: 0, filled: 0, total: PROFILE_FIELDS.length };
    const filled = PROFILE_FIELDS.filter((f) => {
      const val = profile[f.key];
      return val !== null && val !== undefined && val.toString().trim() !== "";
    }).length;
    return {
      score: Math.round((filled / PROFILE_FIELDS.length) * 100),
      filled,
      total: PROFILE_FIELDS.length,
    };
  })();

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await updateProfile(token, {
        username: profile.username,
        contactNumber: profile.contactNumber,
        address: profile.address,
        linkedInProfile: profile.linkedInProfile,
        githubProfile: profile.githubProfile,
      });
      if (data.user) {
        toast("Profile updated successfully!", "success");
        setProfile(data.user);
        updateUser(data.user);
      } else {
        toast(data.message || "Failed to update profile", "error");
      }
    } catch {
      toast("Unable to connect to server", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton />;

  const memberSince = profile?.Timestamp
    ? new Date(profile.Timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="profile-page">
      <div className="profile-cover" />

      <div className="profile-content">
        <div className="profile-avatar-ring">
          <div className="profile-avatar">
            {(profile?.username || "U")[0].toUpperCase()}
          </div>
        </div>

        <div className="profile-heading">
          <h1>{profile?.username || "User"}</h1>
          <p>{profile?.email || ""}</p>
        </div>

        <div className="profile-stats-row">
          <div className="profile-stat-card">
            <div className="profile-stat-icon"><User size={14} /></div>
            <div className="profile-stat-value">{completeness.score}%</div>
            <div className="profile-stat-label">Complete</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon"><CheckCircle2 size={14} /></div>
            <div className="profile-stat-value">{completeness.filled}/{completeness.total}</div>
            <div className="profile-stat-label">Fields Done</div>
          </div>
          {memberSince && (
            <div className="profile-stat-card">
              <div className="profile-stat-icon"><Calendar size={14} /></div>
              <div className="profile-stat-value" style={{ fontSize: "0.7rem", fontWeight: 500 }}>{memberSince}</div>
              <div className="profile-stat-label">Joined</div>
            </div>
          )}
        </div>

        <CompletenessBar score={completeness.score} />

        <div className="profile-fields-grid">
          {PROFILE_FIELDS.map((field) => {
            const Icon = field.icon;
            const value = profile?.[field.key] || "";
            const isFilled = value.toString().trim() !== "";
            const isUrl = field.external && isFilled;

            return (
              <div
                key={field.key}
                className={`profile-field-card ${isFilled ? "filled" : "empty"}`}
              >
                <label className="profile-field-label">
                  <Icon size={15} />
                  <span>{field.label}</span>
                  {isFilled ? (
                    <CheckCircle2 size={12} className="field-dot filled-dot" />
                  ) : (
                    <Circle size={12} className="field-dot empty-dot" />
                  )}
                </label>
                {field.editable ? (
                  <div className="profile-field-input-wrap">
                    <input
                      type="text"
                      className="profile-field-input"
                      value={value}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                    />
                    {isUrl && (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-field-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="profile-field-value">{value}</div>
                )}
              </div>
            );
          })}
        </div>

        <button
          className="profile-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
