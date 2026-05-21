import React from 'react';
import { Zap, CheckCircle2, Clock } from 'lucide-react';

export default function ProjectCard({ project }) {
  const remainingTasks = project.totalTasks - project.completedTasks;
  const completionPercent = Math.round((project.completedTasks / project.totalTasks) * 100);

  return (
    <div className="project-card">
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">{project.name}</h3>
          <p className="card-description">{project.description}</p>
        </div>
        <div className="card-icon" style={{ backgroundColor: project.color }}>
          <Zap size={24} color="white" />
        </div>
      </div>

      <div className="card-stats">
        <div className="stat">
          <CheckCircle2 size={18} className="stat-icon completed" />
          <div className="stat-content">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{project.completedTasks}</span>
          </div>
        </div>
        <div className="stat">
          <Clock size={18} className="stat-icon pending" />
          <div className="stat-content">
            <span className="stat-label">Remaining</span>
            <span className="stat-value">{remainingTasks}</span>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Progress</span>
          <span className="progress-percent">{completionPercent}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${completionPercent}%` }}></div>
        </div>
      </div>

      <div className="card-members">
        <div className="members-label">Team</div>
        <div className="members-list">
          {project.members.map((member, idx) => (
            <img key={idx} src={member} alt="Member" className="member-avatar" />
          ))}
        </div>
      </div>
    </div>
  );
}
