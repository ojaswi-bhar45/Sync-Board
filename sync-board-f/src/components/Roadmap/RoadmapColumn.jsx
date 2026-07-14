import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import RoadmapTaskCard from './RoadmapTaskCard';

export default function RoadmapColumn({ status, label, tasks, onAddTask, onClickTask, isOwner }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className={`roadmap-column ${isOver ? 'drag-over' : ''}`}>
      <div className="roadmap-column-header">
        <div className="column-header-left">
          <span className="column-title">{label}</span>
          <span className="column-count">{tasks.length}</span>
        </div>
        {isOwner && (
          <button
            className="column-add-btn"
            onClick={() => onAddTask(status)}
            title="Add task"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <div ref={setNodeRef} className="roadmap-column-body">
        {tasks.map((task) => (
          <RoadmapTaskCard
            key={task._id}
            task={task}
            onClick={onClickTask}
            isOwner={isOwner}
          />
        ))}
        {tasks.length === 0 && (
          <div className="column-empty">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
