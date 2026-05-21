import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDraggable } from '../../hooks/useDraggable';

export default function StickyNote({ id, color = 'yellow', initialTop, initialLeft, rotation, title, content, onDelete }) {
  const { position, dragHandlers } = useDraggable({ top: initialTop, left: initialLeft });
  const [text, setText] = useState(content);

  return (
    <div 
      className={`canvas-element sticky-note ${color}`} 
      style={{ top: position.top, left: position.left, transform: `rotate(${rotation}deg)` }}
      {...dragHandlers}
    >
      <div className="sticky-header">
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{title}</span>
        <X size={14} style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onDelete(id); }} />
      </div>
      <textarea 
        className="sticky-content"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()} // don't drag when clicking textarea
      />
    </div>
  );
}
