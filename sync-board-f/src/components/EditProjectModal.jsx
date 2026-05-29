import { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { editDashboardProject } from '../api';

export default function EditProjectModal({ project, token, onClose, onUpdated }) {
  const [description, setDescription] = useState(project.description);
  const [note, setNote] = useState(project.note || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) return;
    setLoading(true);
    try {
      const updated = await editDashboardProject(token, project._id, { description, note });
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
          <button type="submit" className="modal-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
