import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toolbar from './Toolbar';
import Canvas from './Whiteboard/Canvas';
import ChatPanel from './ChatPanel';
import { RoadmapBoard } from './Roadmap';
import { getCanvasElements, createCanvasElement, updateCanvasElement, deleteCanvasElement, updateProjectSettings, getTasks } from '../api';
import { toast } from './Toast';
import { Loader2, X, LayoutGrid, Kanban } from 'lucide-react';

const STATUS_LABELS = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
};

export default function Workspace() {
  const { projectId } = useParams();
  const location = useLocation();
  const project = location.state?.project;
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('whiteboard');
  const [activeTool, setActiveTool] = useState('pointer');
  const [elements, setElements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLookingFor, setEditingLookingFor] = useState(false);
  const [lookingForInput, setLookingForInput] = useState("");

  const [projectStatus, setProjectStatus] = useState(project?.status || "planning");
  const [projectOpenForCollab, setProjectOpenForCollab] = useState(project?.isOpenForCollaboration !== false);
  const [projectLookingFor, setProjectLookingFor] = useState(project?.lookingFor || []);

  const isOwner = project?.userId?._id === user?._id || project?.userId === user?._id;
  const userPermission = project?.userPermission || (isOwner ? "owner" : "member");
  const isAdmin = userPermission === "owner" || userPermission === "admin";

  useEffect(() => {
    if (!projectId || !token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [canvasData, tasksData] = await Promise.all([
          getCanvasElements(token, projectId),
          getTasks(token, projectId),
        ]);
        if (!cancelled) {
          setElements(canvasData.elements || []);
          setTasks(tasksData.tasks || []);
        }
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
        <div className="workspace-header-left">
          <span className="workspace-project-name">{project.title}</span>
          {isAdmin && <span className="text-xs text-indigo-400 ml-2">({userPermission === "owner" ? "Owner" : "Admin"})</span>}
        </div>
        <div className="workspace-header-right">
          <span className={`status-badge ${projectStatus}`}>
            <span className="status-dot" />
            {STATUS_LABELS[projectStatus] || projectStatus}
          </span>
          <span
            className={`collab-badge ${projectOpenForCollab ? "open" : "closed"}`}
          >
            {projectOpenForCollab ? "👥 Open" : "🔒 Full"}
          </span>
        </div>
      </div>

      {isAdmin && (
        <div className="workspace-settings-bar">
          <div className="workspace-settings-group">
            <span className="workspace-settings-label">Status</span>
            <select
              value={projectStatus}
              onChange={(e) => {
                const newStatus = e.target.value;
                setProjectStatus(newStatus);
                updateProjectSettings(token, projectId, { status: newStatus }).catch((err) =>
                  toast(err.message, "error")
                );
              }}
              className="workspace-settings-select"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="workspace-settings-group">
            <span className="workspace-settings-label">Collaboration</span>
            <button
              className={`workspace-toggle-btn ${projectOpenForCollab ? "active" : ""}`}
              onClick={() => {
                const newVal = !projectOpenForCollab;
                setProjectOpenForCollab(newVal);
                updateProjectSettings(token, projectId, { isOpenForCollaboration: newVal }).catch((err) =>
                  toast(err.message, "error")
                );
              }}
            >
              <div className={`workspace-toggle-track ${projectOpenForCollab ? "active" : ""}`}>
                <div className="workspace-toggle-thumb" />
              </div>
              <span>{projectOpenForCollab ? "Accepting" : "Not Accepting"}</span>
            </button>
          </div>

          <div className="workspace-settings-group workspace-settings-group-roles">
            <span className="workspace-settings-label">Looking For</span>
            <div className="workspace-looking-for">
              {projectLookingFor.map((role) => (
                <span key={role} className="looking-for-tag">
                  {role}
                  <button
                    onClick={() => {
                      const updated = projectLookingFor.filter((r) => r !== role);
                      setProjectLookingFor(updated);
                      updateProjectSettings(token, projectId, { lookingFor: updated }).catch((err) =>
                        toast(err.message, "error")
                      );
                    }}
                    className="looking-for-remove"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <button
                className="looking-for-add-btn"
                onClick={() => setEditingLookingFor(true)}
              >
                + Add Role
              </button>
            </div>
            {editingLookingFor && (
              <div className="workspace-looking-for-input">
                <input
                  type="text"
                  value={lookingForInput}
                  onChange={(e) => setLookingForInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = lookingForInput.trim();
                      if (trimmed && !projectLookingFor.includes(trimmed)) {
                        const updated = [...projectLookingFor, trimmed];
                        setProjectLookingFor(updated);
                        updateProjectSettings(token, projectId, { lookingFor: updated }).catch((err) =>
                          toast(err.message, "error")
                        );
                      }
                      setLookingForInput("");
                      setEditingLookingFor(false);
                    }
                    if (e.key === "Escape") {
                      setLookingForInput("");
                      setEditingLookingFor(false);
                    }
                  }}
                  placeholder="Type role name..."
                  autoFocus
                  className="workspace-looking-for-field"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {!isAdmin && projectLookingFor.length > 0 && (
        <div className="workspace-looking-for-bar">
          <span className="workspace-looking-for-label">Looking For:</span>
          {projectLookingFor.map((role) => (
            <span key={role} className="looking-for-tag">{role}</span>
          ))}
        </div>
      )}

      <div className="workspace-tabs">
        <button
          className={`workspace-tab ${activeTab === 'whiteboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('whiteboard')}
        >
          <LayoutGrid size={16} />
          <span>Whiteboard</span>
        </button>
        <button
          className={`workspace-tab ${activeTab === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          <Kanban size={16} />
          <span>Roadmap</span>
        </button>
      </div>

      {activeTab === 'whiteboard' && (
        <>
          <Toolbar activeTool={activeTool} setActiveTool={setActiveTool} onAddSticky={handleAddSticky} isAdmin={isAdmin} />
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={36} className="feed-spinner" />
            </div>
          ) : (
            <Canvas elements={elements} onDelete={handleDelete} onUpdate={handleUpdate} />
          )}
        </>
      )}

      {activeTab === 'roadmap' && (
        loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={36} className="feed-spinner" />
          </div>
        ) : (
          <RoadmapBoard project={project} tasks={tasks} onTasksChange={() => getTasks(token, projectId).then(d => setTasks(d.tasks || []))} />
        )
      )}

      <ChatPanel projectId={projectId} projectName={project.title} isAdmin={isAdmin} />
    </>
  );
}
