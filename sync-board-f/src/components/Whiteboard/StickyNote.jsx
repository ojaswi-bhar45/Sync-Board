import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useDraggable } from '../../hooks/useDraggable';

export default function StickyNote({ id, color = 'yellow', initialTop, initialLeft, rotation, title, content, onDelete, onUpdate }) {
  const [noteTitle, setNoteTitle] = useState(title);
  const [noteContent, setNoteContent] = useState(content);
  const titleRef = useRef(null);

  const { position, dragHandlers } = useDraggable(
    { top: initialTop, left: initialLeft },
    (pos) => onUpdate?.(id, { top: pos.top, left: pos.left }),
  );

  const handleTitleBlur = () => {
    if (noteTitle !== title) onUpdate?.(id, { title: noteTitle });
  };

  const handleContentBlur = () => {
    if (noteContent !== content) onUpdate?.(id, { content: noteContent });
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleRef.current?.blur();
    }
  };

  return (
    <div 
      className={`canvas-element sticky-note ${color}`} 
      style={{ top: position.top, left: position.left, transform: `rotate(${rotation}deg)` }}
      {...dragHandlers}
    >
      <div className="sticky-header">
        <input
          ref={titleRef}
          className="sticky-title-input"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <X size={14} style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onDelete(id); }} />
      </div>
      <textarea 
        className="sticky-content"
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        onBlur={handleContentBlur}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
