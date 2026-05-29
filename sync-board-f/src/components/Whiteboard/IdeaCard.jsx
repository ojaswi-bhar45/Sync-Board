import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useDraggable } from '../../hooks/useDraggable';

export default function IdeaCard({ id, initialTop, initialLeft, badge, title, desc, progress, onUpdate }) {
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localBadge] = useState(badge);
  const [localTitle] = useState(title);
  const [localDesc] = useState(desc);
  const [localProgress] = useState(progress);

  const { position, dragHandlers } = useDraggable(
    { top: initialTop, left: initialLeft },
    (pos) => onUpdate?.(id, { top: pos.top, left: pos.left }),
  );

  const startEdit = (field, value) => {
    setEditField(field);
    setEditValue(value);
  };

  const commitEdit = () => {
    if (editField === null) return;
    const update = { [editField]: editValue };
    onUpdate?.(id, update);
    setEditField(null);
  };

  const cancelEdit = () => {
    setEditField(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <div 
      className="canvas-element idea-card" 
      style={{ top: position.top, left: position.left }}
      {...dragHandlers}
    >
      <div className="card-header">
        {editField === 'badge' ? (
          <input
            className="idea-edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            onPointerDown={(e) => e.stopPropagation()}
            style={{ width: 60, fontSize: 11, fontWeight: 600 }}
          />
        ) : (
          <span className="card-badge" onClick={() => startEdit('badge', localBadge)}>{localBadge}</span>
        )}
        <MoreHorizontal size={18} className="text-muted" style={{ cursor: 'pointer' }} />
      </div>

      {editField === 'title' ? (
        <input
          className="idea-edit-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <h3 className="idea-title" onClick={() => startEdit('title', localTitle)}>{localTitle}</h3>
      )}

      {editField === 'desc' ? (
        <textarea
          className="idea-edit-textarea"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
          autoFocus
          onPointerDown={(e) => e.stopPropagation()}
          rows={3}
        />
      ) : (
        <p className="idea-desc" onClick={() => startEdit('desc', localDesc)}>{localDesc}</p>
      )}
      
      <div className="card-footer">
        <div className="progress-bar" onClick={() => startEdit('progress', localProgress)}>
          <div className="progress-fill" style={{ width: `${localProgress}%` }}></div>
        </div>
        {editField === 'progress' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={editValue}
              onChange={(e) => setEditValue(Number(e.target.value))}
              onBlur={commitEdit}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ width: 60 }}
            />
            <span className="progress-text" style={{ minWidth: 30 }}>{editValue}%</span>
          </div>
        ) : (
          <span className="progress-text">{localProgress}%</span>
        )}
      </div>
    </div>
  );
}
