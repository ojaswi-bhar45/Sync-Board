import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import ProjectCard from './ProjectCard';
import NewProjectModal from './NewProjectModal';
import EditProjectModal from './EditProjectModal';
import { getMyProjects } from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getMyProjects(token);
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (project) => {
    setProjects((prev) => [project, ...prev]);
  };

  const handleUpdated = (updated) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p)),
    );
  };

  return (
    <div className="dashboard-container p-4 sm:p-6 lg:p-8 pb-24">
      <div className="dashboard-user-section">
        <img
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'U'}`}
          alt="User"
          className="dashboard-avatar"
        />
        <div className="dashboard-user-info">
          <h2 className="dashboard-user-name">{user?.username || 'User'}</h2>
          <p className="dashboard-user-email">{user?.email || ''}</p>
        </div>
      </div>

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Projects</h1>
          <p className="dashboard-subtitle">
            {loading
              ? 'Loading...'
              : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="new-project-btn" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="dashboard-empty">
          <p>No projects yet. Create your first project!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} onEdit={setEditingProject} onClick={(p) => navigate(`/dashboard/workspace/${p._id}`, { state: { project: p } })} />
          ))}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          token={token}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          token={token}
          onClose={() => setEditingProject(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
