import { useState } from 'react';
import { X, Users, ToggleRight, ToggleLeft } from 'lucide-react';
import { createDashboardProject } from '../api';

export default function NewProjectModal({ token, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState("planning");
  const [isOpenForCollaboration, setIsOpenForCollaboration] = useState(true);
  const [lookingFor, setLookingFor] = useState([]);
  const [lookingForInput, setLookingForInput] = useState("");
  const [loading, setLoading] = useState(false);

  const AVAILABLE_ROLES = [
    "Frontend Developer", "Backend Developer", "UI/UX Designer",
    "DevOps Engineer", "Mobile Developer", "Designer",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    setLoading(true);
    try {
      const project = await createDashboardProject(token, { title, description, note, status, isOpenForCollaboration, lookingFor });
      onCreated(project);
      onClose();
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
          <h2>New Project</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Project title"
            />
          </label>
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
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}
