import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ChatPanel from './components/ChatPanel';
import Canvas from './components/Whiteboard/Canvas';
import Dashboard from './components/Dashboard';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeTool, setActiveTool] = useState('pointer');
  const [activeView, setActiveView] = useState('canvas');

  const [elements, setElements] = useState([
    { id: 1, type: 'sticky', color: 'yellow', top: 150, left: 200, rotation: -2, title: 'Design Phase', content: 'Update the hero section typography to match the new brand guidelines. Use Inter for headers.' },
    { id: 2, type: 'sticky', color: 'pink', top: 380, left: 160, rotation: 1, title: 'Urgent', content: 'Fix the responsive layout on mobile devices! The menu is overlapping.' },
    { id: 3, type: 'sticky', color: 'blue', top: 220, left: 460, rotation: 3, title: 'Ideas', content: 'Add dark mode toggle? Users are requesting it.' },
    { id: 4, type: 'idea', badge: 'Feature Request', top: 180, left: 720, title: 'Real-time Collaboration', desc: 'Implement WebSockets to allow multiple users to edit the whiteboard simultaneously without conflicts.', progress: 65 }
  ]);

  const handleAddSticky = () => {
    const colors = ['yellow', 'pink', 'blue', 'green'];
    const newSticky = {
      id: Date.now(),
      type: 'sticky',
      color: colors[Math.floor(Math.random() * colors.length)],
      top: window.innerHeight / 2 - 100 + Math.random() * 50,
      left: window.innerWidth / 2 - 100 + Math.random() * 50,
      rotation: Math.floor(Math.random() * 10) - 5,
      title: 'New Note',
      content: ''
    };
    setElements([...elements, newSticky]);
    setActiveTool('pointer');
  };

  const handleDeleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  return (
    <div className="app-container">
      <Sidebar toggleTheme={toggleTheme} theme={theme} onNavigate={setActiveView} activeView={activeView} />
      <main className="main-content">
        {activeView === 'dashboard' ? (
          <Dashboard />
        ) : (
          <>
            <Toolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              onAddSticky={handleAddSticky}
            />
            <Canvas elements={elements} onDelete={handleDeleteElement} />
            <ChatPanel />
          </>
        )}
      </main>
    </div>
  );
}
