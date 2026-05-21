import React from 'react';
import StickyNote from './StickyNote';
import IdeaCard from './IdeaCard';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function Canvas({ elements, onDelete }) {
  return (
    <div className="whiteboard-area">
      {/* Dynamic Canvas Elements */}
      {elements.map(el => {
        if (el.type === 'sticky') {
          return (
            <StickyNote 
              key={el.id}
              id={el.id}
              color={el.color} 
              initialTop={el.top} 
              initialLeft={el.left} 
              rotation={el.rotation} 
              title={el.title}
              content={el.content}
              onDelete={onDelete}
            />
          );
        }
        if (el.type === 'idea') {
          return (
            <IdeaCard 
              key={el.id}
              id={el.id}
              initialTop={el.top} 
              initialLeft={el.left} 
              badge={el.badge}
              title={el.title}
              desc={el.desc}
              progress={el.progress}
            />
          );
        }
        return null;
      })}
      
      {/* Zoom Controls Overlay */}
      <div className="zoom-controls">
        <button className="tool-btn"><ZoomOut size={16}/></button>
        <span className="zoom-level">100%</span>
        <button className="tool-btn"><ZoomIn size={16}/></button>
        <div className="divider-vertical"></div>
        <button className="tool-btn"><Maximize size={16}/></button>
      </div>
    </div>
  );
}
