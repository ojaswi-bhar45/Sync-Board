import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Save,
  CheckCircle,
  Circle,
} from "lucide-react";
import { API } from "../api";

const PROFILE_FIELDS = [
  { key: "username", label: "Username", icon: User, editable: true },
  { key: "email", label: "Email", icon: Mail, editable: false },
  {
    key: "contactNumber",
    label: "Contact Number",
    icon: Phone,
    editable: true,
  },
  { key: "address", label: "Address", icon: MapPin, editable: true },
  {
    key: "linkedInProfile",
    label: "LinkedIn Profile",
    icon: LinkIcon,
    editable: true,
  },
  {
    key: "githubProfile",
    label: "Github Profile",
    icon: LinkIcon,
    editable: true,
  },
];

export default function Profile() {
  const { token, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.user) setProfile(data.user);
      } catch (err) {
        console.error(err);
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
    setMessage("");
    setMessageType("");
    try {
      const res = await fetch(`${API}/edit-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: profile.username,
          contactNumber: profile.contactNumber,
          address: profile.address,
          linkedInProfile: profile.linkedInProfile,
          githubProfile: profile.githubProfile,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setMessage("Profile updated successfully!");
        setMessageType("success");
        setProfile(data.user);
        updateUser(data.user);
      } else {
        setMessage(data.message || "Failed to update profile");
        setMessageType("error");
      }
    } catch {
      setMessage("Unable to connect to server");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
    <div className="profile-container p-4 sm:p-6 lg:p-8 pb-24 sm:pb-24 lg:pb-8">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header flex-col sm:flex-row items-center sm:items-center">
        <div className="profile-avatar-large">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || "U"}`}
            alt="User"
          />
        </div>
        <div className="profile-header-info">
          <h1 className="profile-title text-center sm:text-left">{profile?.username || "User"}</h1>
          <p className="profile-email-display">{profile?.email || ""}</p>
        </div>
      </div>

      <div className="profile-completeness">
        <div className="completeness-header">
          <span className="completeness-label">Profile Completeness</span>
          <span className="completeness-score">{completeness.score}%</span>
        </div>
        <div className="completeness-bar">
          <div
            className="completeness-fill"
            style={{ width: `${completeness.score}%` }}
          ></div>
        </div>
        <div className="completeness-status">
          <CheckCircle size={16} />
          <span>
            {completeness.filled} of {completeness.total} fields completed
          </span>
        </div>
      </div>

      {message && (
        <div className={`profile-message ${messageType}`}>{message}</div>
      )}

      <div className="profile-fields">
        {PROFILE_FIELDS.map((field) => {
          const Icon = field.icon;
          const value = profile?.[field.key] || "";
          const isFilled = value.toString().trim() !== "";
          return (
            <div
              key={field.key}
              className={`profile-field ${isFilled ? "filled" : "empty"}`}
            >
              <label className="profile-field-label">
                <Icon size={18} />
                <span>{field.label}</span>
                {isFilled ? (
                  <CheckCircle size={14} className="field-check" />
                ) : (
                  <Circle size={14} className="field-circle" />
                )}
              </label>
              {field.editable ? (
                <input
                  type="text"
                  className="profile-field-input"
                  value={value}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={`Enter your ${field.label.toLowerCase()}`}
                />
              ) : (
                <div className="profile-field-value">{value}</div>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="profile-save-btn max-w-sm lg:max-w-md mx-auto lg:mx-0"
        onClick={handleSave}
        disabled={saving}
      >
        <Save size={20} />
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
