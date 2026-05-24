import { FileText } from 'lucide-react';

export default function ProjectCard({ project }) {
  const date = new Date(project.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="project-card">
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">{project.title}</h3>
          <p className="card-description">{project.description}</p>
        </div>
        <div className="card-icon">
          <FileText size={24} />
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
