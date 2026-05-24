import { useState } from 'react';
import Toolbar from './Toolbar';
import Canvas from './Whiteboard/Canvas';
import ChatPanel from './ChatPanel';

export default function Workspace() {
  const [activeTool, setActiveTool] = useState('pointer');
  const [elements, setElements] = useState([
    {
      id: 1,
      type: 'sticky',
      color: 'yellow',
      top: 80,
      left: 120,
      rotation: -2,
      title: 'Ideas',
      content: 'Brainstorm new features for the next sprint...'
    },
    {
      id: 2,
      type: 'idea',
      top: 320,
      left: 500,
      badge: 'UX',
      title: 'User Onboarding',
      desc: 'Design a smooth first-time experience with guided tooltips and progressive disclosure.',
      progress: 65
    },
    {
      id: 3,
      type: 'sticky',
      color: 'blue',
      top: 150,
      left: 700,
      rotation: 1,
      title: 'To Do',
      content: 'Review color palette and typography choices'
    }
  ]);

  const handleDelete = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
  };

  const handleAddSticky = () => {
    const colors = ['yellow', 'blue', 'pink', 'green'];
    const newEl = {
      id: Date.now(),
      type: 'sticky',
      color: colors[Math.floor(Math.random() * colors.length)],
      top: 100 + Math.random() * 300,
      left: 100 + Math.random() * 500,
      rotation: (Math.random() - 0.5) * 6,
      title: 'New Note',
      content: ''
    };
    setElements(prev => [...prev, newEl]);
  };

  return (
    <div className="main-content">
      <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} onAddSticky={handleAddSticky} />
      <Canvas elements={elements} onDelete={handleDelete} />
      <ChatPanel />
    </div>
  );
}
