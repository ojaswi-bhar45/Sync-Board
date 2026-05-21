import React from 'react';
import ProjectCard from './ProjectCard';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const projects = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Modernize the company website with new branding',
      color: '#6366f1',
      completedTasks: 8,
      totalTasks: 12,
      members: [
        'https://i.pravatar.cc/150?u=a042581f4e29026024d',
        'https://i.pravatar.cc/150?u=b042581f4e29026024e',
        'https://i.pravatar.cc/150?u=c042581f4e29026024f'
      ]
    },
    {
      id: 2,
      name: 'Mobile App Launch',
      description: 'Build and launch new mobile application',
      color: '#ec4899',
      completedTasks: 15,
      totalTasks: 20,
      members: [
        'https://i.pravatar.cc/150?u=d042581f4e29026024g',
        'https://i.pravatar.cc/150?u=e042581f4e29026024h'
      ]
    },
    {
      id: 3,
      name: 'API Integration',
      description: 'Integrate third-party payment and analytics APIs',
      color: '#f59e0b',
      completedTasks: 12,
      totalTasks: 15,
      members: [
        'https://i.pravatar.cc/150?u=f042581f4e29026024i',
        'https://i.pravatar.cc/150?u=g042581f4e29026024j',
        'https://i.pravatar.cc/150?u=h042581f4e29026024k'
      ]
    },
    {
      id: 4,
      name: 'Cloud Migration',
      description: 'Move infrastructure to cloud platform',
      color: '#10b981',
      completedTasks: 18,
      totalTasks: 25,
      members: [
        'https://i.pravatar.cc/150?u=i042581f4e29026024l',
        'https://i.pravatar.cc/150?u=j042581f4e29026024m'
      ]
    },
    {
      id: 5,
      name: 'Analytics Dashboard',
      description: 'Create real-time analytics and reporting dashboard',
      color: '#8b5cf6',
      completedTasks: 6,
      totalTasks: 18,
      members: [
        'https://i.pravatar.cc/150?u=k042581f4e29026024n',
        'https://i.pravatar.cc/150?u=l042581f4e29026024o',
        'https://i.pravatar.cc/150?u=m042581f4e29026024p'
      ]
    },
    {
      id: 6,
      name: 'Security Audit',
      description: 'Complete security audit and implement fixes',
      color: '#ef4444',
      completedTasks: 10,
      totalTasks: 14,
      members: [
        'https://i.pravatar.cc/150?u=n042581f4e29026024q'
      ]
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Projects Dashboard</h1>
        <p className="dashboard-subtitle">Track all your projects and their progress</p>
        <button className="new-project-btn">
          <Plus size={20} />
          New Project
        </button>
      </div>

      <div className="projects-grid">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
