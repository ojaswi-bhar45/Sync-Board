import React from 'react';
import { MousePointer2, PenTool, Type, Square, Circle, StickyNote, Image as ImageIcon, Share2 } from 'lucide-react';

export default function Toolbar({ activeTool, setActiveTool, onAddSticky, isAdmin }) {
  return (
    <div className="floating-toolbar">
      <div className="tool-group">
        <button 
          className={`tool-btn ${activeTool === 'pointer' ? 'active' : ''}`}
          onClick={() => setActiveTool('pointer')}
        >
          <MousePointer2 size={18} />
        </button>
        <button 
          className={`tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
          onClick={() => setActiveTool('pen')}
        >
          <PenTool size={18} />
        </button>
        <button 
          className={`tool-btn ${activeTool === 'type' ? 'active' : ''}`}
          onClick={() => setActiveTool('type')}
        >
          <Type size={18} />
        </button>
        <div className="divider"></div>
        <button className="tool-btn"><Square size={18} /></button>
        <button className="tool-btn"><Circle size={18} /></button>
        {isAdmin && (
          <button 
            className={`tool-btn ${activeTool === 'sticky' ? 'active' : ''}`}
            onClick={() => {
              setActiveTool('sticky');
              onAddSticky();
            }}
          >
            <StickyNote size={18} />
          </button>
        )}
        <button className="tool-btn"><ImageIcon size={18} /></button>
      </div>

      <div className="collab-group">
        <div className="avatar-group">
          <div className="avatar">
            <img src="https://i.pravatar.cc/150?u=a04258114e29026702d" alt="Team member" />
          </div>
          <div className="avatar">
            <img src="https://i.pravatar.cc/150?u=a04258114e29026302d" alt="Team member" />
          </div>
          <div className="avatar" style={{ backgroundColor: 'var(--bg-panel)' }}>+3</div>
        </div>
        <button className="share-btn">
          <Share2 size={16} />
          Share
        </button>
      </div>
    </div>
  );
}
