import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toolbar from './Toolbar';
import Canvas from './Whiteboard/Canvas';
import ChatPanel from './ChatPanel';
import { getCanvasElements, createCanvasElement, updateCanvasElement, deleteCanvasElement } from '../api';
import { toast } from './Toast';
import { Loader2 } from 'lucide-react';

export default function Workspace({ project }) {
  const { token, user } = useAuth();
  const [activeTool, setActiveTool] = useState('pointer');
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = project?.userId?._id === user?._id || project?.userId === user?._id;

  useEffect(() => {
    if (!project?._id || !token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getCanvasElements(token, project._id);
        if (!cancelled) setElements(data.elements || []);
      } catch (err) {
        if (!cancelled) toast(err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [project?._id, token]);

  const handleDelete = async (id) => {
    if (!token || !project?._id) return;
    try {
      await deleteCanvasElement(token, project._id, id);
      setElements(prev => prev.filter(el => el._id !== id));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleUpdate = async (id, data) => {
    if (!token || !project?._id) return;
    setElements(prev => prev.map(el => (el._id === id ? { ...el, ...data } : el)));
    try {
      await updateCanvasElement(token, project._id, id, data);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleAddSticky = async () => {
    if (!token || !project?._id) return;
    try {
      const colors = ['yellow', 'blue', 'pink', 'green'];
      const data = await createCanvasElement(token, project._id, {
        type: 'sticky',
        color: colors[Math.floor(Math.random() * colors.length)],
        top: 100 + Math.random() * 300,
        left: 100 + Math.random() * 500,
        rotation: (Math.random() - 0.5) * 6,
        title: 'New Note',
        content: '',
      });
      setElements(prev => [...prev, data.element]);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (!project) {
    return (
      <div className="main-content flex items-center justify-center">
        <p className="text-gray-500">Select a project to view its workspace.</p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="workspace-header">
        <span className="workspace-project-name">{project.title}</span>
        {isAdmin && <span className="text-xs text-indigo-400 ml-2">(Admin)</span>}
      </div>
      <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} onAddSticky={handleAddSticky} isAdmin={isAdmin} />
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 size={36} className="feed-spinner" />
        </div>
      ) : (
        <Canvas elements={elements} onDelete={handleDelete} onUpdate={handleUpdate} />
      )}
      <ChatPanel projectId={project._id} projectName={project.title} isAdmin={isAdmin} />
    </div>
  );
}
