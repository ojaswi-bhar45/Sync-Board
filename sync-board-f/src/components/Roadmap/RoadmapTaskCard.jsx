import { useDraggable } from '@dnd-kit/core';
import { Calendar } from 'lucide-react';

const PRIORITY_CONFIG = {
  urgent: { color: '#ef4444', label: 'Urgent' },
  high: { color: '#fb923c', label: 'High' },
  medium: { color: '#facc15', label: 'Medium' },
  low: { color: '#4ade80', label: 'Low' },
};

export default function RoadmapTaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  });

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      ref={setNodeRef}
      className={`roadmap-task-card ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
      onClick={() => onClick(task)}
    >
      <div className="task-card-header">
        <span
          className="priority-badge"
          style={{ backgroundColor: PRIORITY_CONFIG[task.priority]?.color + '20', color: PRIORITY_CONFIG[task.priority]?.color }}
        >
          {PRIORITY_CONFIG[task.priority]?.label}
        </span>
      </div>

      <h4 className="task-card-title">{task.title}</h4>

      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      {task.labels?.length > 0 && (
        <div className="task-card-labels">
          {task.labels.map((label) => (
            <span key={label} className="label-chip">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="task-card-footer">
        {task.dueDate && (
          <span className={`task-card-due ${isOverdue ? 'overdue' : ''}`}>
            <Calendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.assignedTo && (
          <span className="task-card-assignee">
            <div className="assignee-avatar">
              {task.assignedTo.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </span>
        )}
      </div>
    </div>
  );
}
