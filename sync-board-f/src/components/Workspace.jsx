import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toolbar from './Toolbar';
import Canvas from './Whiteboard/Canvas';
import ChatPanel from './ChatPanel';
import { getCanvasElements, createCanvasElement, updateCanvasElement, deleteCanvasElement } from '../api';
import { toast } from './Toast';
import { Loader2 } from 'lucide-react';

export default function Workspace() {
  const { projectId } = useParams();
  const location = useLocation();
  const project = location.state?.project;
  const { token, user } = useAuth();
  const [activeTool, setActiveTool] = useState('pointer');
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = project?.userId?._id === user?._id || project?.userId === user?._id;

  useEffect(() => {
    if (!projectId || !token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getCanvasElements(token, projectId);
        if (!cancelled) setElements(data.elements || []);
      } catch (err) {
        if (!cancelled) toast(err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [projectId, token]);

  const handleDelete = async (id) => {
    if (!token || !projectId) return;
    try {
      await deleteCanvasElement(token, projectId, id);
      setElements(prev => prev.filter(el => el._id !== id));
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleUpdate = async (id, data) => {
    if (!token || !projectId) return;
    setElements(prev => prev.map(el => (el._id === id ? { ...el, ...data } : el)));
    try {
      await updateCanvasElement(token, projectId, id, data);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleAddSticky = async () => {
    if (!token || !projectId) return;
    try {
      const colors = ['yellow', 'blue', 'pink', 'green'];
      const data = await createCanvasElement(token, projectId, {
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
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a project to view its workspace.</p>
      </div>
    );
  }

  return (
    <>
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
      <ChatPanel projectId={projectId} projectName={project.title} isAdmin={isAdmin} />
    </>
  );
}
