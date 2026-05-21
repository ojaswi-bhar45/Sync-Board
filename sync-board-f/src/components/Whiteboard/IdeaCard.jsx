import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useDraggable } from '../../hooks/useDraggable';

export default function IdeaCard({ id, initialTop, initialLeft, badge, title, desc, progress }) {
  const { position, dragHandlers } = useDraggable({ top: initialTop, left: initialLeft });

  return (
    <div 
      className="canvas-element idea-card" 
      style={{ top: position.top, left: position.left }}
      {...dragHandlers}
    >
      <div className="card-header">
        <span className="card-badge">{badge}</span>
        <MoreHorizontal size={18} className="text-muted" style={{ cursor: 'pointer' }} />
      </div>
      <h3 className="idea-title">{title}</h3>
      <p className="idea-desc">{desc}</p>
      
      <div className="card-footer">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="progress-text">{progress}%</span>
      </div>
    </div>
  );
}
