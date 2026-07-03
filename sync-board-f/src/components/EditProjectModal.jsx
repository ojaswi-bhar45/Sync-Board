import { useState } from 'react';
import { X, FileText, ToggleRight, ToggleLeft } from 'lucide-react';
import { editDashboardProject } from '../api';

const AVAILABLE_ROLES = [
  "Frontend Developer", "Backend Developer", "UI/UX Designer",
  "DevOps Engineer", "Mobile Developer", "Designer",
];

export default function EditProjectModal({ project, token, onClose, onUpdated }) {
  const [description, setDescription] = useState(project.description);
  const [note, setNote] = useState(project.note || '');
  const [status, setStatus] = useState(project.status || "planning");
  const [isOpenForCollaboration, setIsOpenForCollaboration] = useState(project.isOpenForCollaboration !== false);
  const [lookingFor, setLookingFor] = useState(project.lookingFor || []);
  const [lookingForInput, setLookingForInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) return;
    setLoading(true);
    try {
      const updated = await editDashboardProject(token, project._id, { description, note, status, isOpenForCollaboration, lookingFor });
      if (updated._id) {
        onUpdated(updated);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Project</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="edit-project-title">
          <FileText size={18} />
          <span>{project.title}</span>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Project description"
              rows={3}
            />
          </label>
          <label>
            Note <span className="optional">(optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional notes"
              rows={2}
            />
          </label>

          <div className="form-divider" />

          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="modal-select">
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label className="toggle-label">
            <span>Open for Collaboration</span>
            <div
              className="toggle-switch"
              onClick={() => setIsOpenForCollaboration(!isOpenForCollaboration)}
            >
              {isOpenForCollaboration ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </div>
          </label>

          <label>
            Looking For
            <div className="looking-for-chips">
              {AVAILABLE_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`chip ${lookingFor.includes(role) ? "active" : ""}`}
                  onClick={() =>
                    setLookingFor((prev) =>
                      prev.includes(role)
                        ? prev.filter((r) => r !== role)
                        : [...prev, role]
                    )
                  }
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="looking-for-custom">
              <input
                type="text"
                value={lookingForInput}
                onChange={(e) => setLookingForInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = lookingForInput.trim();
                    if (trimmed && !lookingFor.includes(trimmed))
                      setLookingFor((prev) => [...prev, trimmed]);
                    setLookingForInput("");
                  }
                }}
                placeholder="Or type a custom role..."
              />
            </div>
          </label>

          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
