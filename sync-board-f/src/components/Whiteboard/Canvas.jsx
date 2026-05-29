import { useState } from 'react';
import StickyNote from './StickyNote';
import IdeaCard from './IdeaCard';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function Canvas({ elements, onDelete, onUpdate }) {
  const [scale, setScale] = useState(1);

  const zoomIn = () => setScale(s => Math.min(2, +(s + 0.1).toFixed(2)));
  const zoomOut = () => setScale(s => Math.max(0.25, +(s - 0.1).toFixed(2)));
  const resetZoom = () => setScale(1);

  return (
    <div className="whiteboard-area">
      <div
        className="whiteboard-canvas"
        style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
      >
        {elements.map(el => {
          const elementId = el._id || el.id;
          if (el.type === 'sticky') {
            return (
              <StickyNote 
                key={elementId}
                id={elementId}
                color={el.color} 
                initialTop={el.top} 
                initialLeft={el.left} 
                rotation={el.rotation} 
                title={el.title}
                content={el.content}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            );
          }
          if (el.type === 'idea') {
            return (
              <IdeaCard 
                key={elementId}
                id={elementId}
                initialTop={el.top} 
                initialLeft={el.left} 
                badge={el.badge}
                title={el.title}
                desc={el.desc}
                progress={el.progress}
                onUpdate={onUpdate}
              />
            );
          }
          return null;
        })}
      </div>
      
      {/* Zoom Controls Overlay */}
      <div className="zoom-controls">
        <button className="tool-btn" onClick={zoomOut}><ZoomOut size={16}/></button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        <button className="tool-btn" onClick={zoomIn}><ZoomIn size={16}/></button>
        <div className="divider-vertical"></div>
        <button className="tool-btn" onClick={resetZoom}><Maximize size={16}/></button>
      </div>
    </div>
  );
}
