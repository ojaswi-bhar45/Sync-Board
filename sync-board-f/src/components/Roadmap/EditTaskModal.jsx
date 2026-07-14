import { useState, useEffect } from 'react';
import { X, Tag, Calendar, User, Trash2 } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#4ade80' },
  { value: 'medium', label: 'Medium', color: '#facc15' },
  { value: 'high', label: 'High', color: '#fb923c' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

export default function EditTaskModal({ task, isOpen, onClose, onSubmit, onDelete, members, isOwner }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [labels, setLabels] = useState([]);
  const [labelInput, setLabelInput] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setLabels(task.labels || []);
      setAssignedTo(task.assignedTo?._id || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleAddLabel = (e) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault();
      if (!labels.includes(labelInput.trim())) {
        setLabels([...labels, labelInput.trim()]);
      }
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (label) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit(task._id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        labels,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setLoading(true);
    try {
      await onDelete(task._id);
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Task</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} /> Due Date
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <User size={14} /> Assign To
            </label>
            <select
              className="form-select"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.username || m.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Tag size={14} /> Labels
            </label>
            <div className="tag-input-wrapper">
              <input
                type="text"
                className="form-input"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleAddLabel}
                placeholder="Type and press Enter..."
              />
            </div>
            {labels.length > 0 && (
              <div className="tag-list">
                {labels.map((label) => (
                  <span key={label} className="tag-chip">
                    {label}
                    <button type="button" onClick={() => handleRemoveLabel(label)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            {isOwner && (
              <button
                type="button"
                className="btn btn-ghost btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <div className="modal-footer-right">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              {isOwner && (
                <button type="submit" className="btn btn-gradient" disabled={!title.trim() || loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
