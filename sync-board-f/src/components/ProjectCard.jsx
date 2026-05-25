import { FileText, Edit3 } from 'lucide-react';

export default function ProjectCard({ project, onEdit, onClick }) {
  const date = new Date(project.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="project-card" onClick={() => onClick(project)}>
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">{project.title}</h3>
          <p className="card-description">{project.description}</p>
        </div>
        <div className="card-actions">
          <button className="card-edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(project); }} title="Edit project">
            <Edit3 size={16} />
          </button>
          <div className="card-icon">
            <FileText size={24} />
          </div>
        </div>
      </div>
      {project.note && (
        <p className="card-note">{project.note}</p>
      )}
      <div className="card-footer">
        <span className="card-date">{date}</span>
      </div>
    </div>
  );
}
