import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CheckCircle, Layers, TrendingUp } from 'lucide-react';
import { toast } from '../Toast';
import { createTask, updateTask, updateTaskStatus, deleteTask } from '../../api';
import { useAuth } from '../../context/AuthContext';
import RoadmapColumn from './RoadmapColumn';
import RoadmapTaskCard from './RoadmapTaskCard';
import CreateTaskModal from './CreateTaskModal';
import EditTaskModal from './EditTaskModal';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'Todo' },
  { id: 'progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

export default function RoadmapBoard({ project, tasks, onTasksChange }) {
  const { token, user } = useAuth();
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const [activeTask, setActiveTask] = useState(null);
  const [createModal, setCreateModal] = useState({ open: false, status: 'backlog' });
  const [editModal, setEditModal] = useState({ open: false, task: null });

  const isOwner = project?.userId === user?._id || project?.userId?._id === user?._id;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    setLocalTasks(tasks || []);
  }, [tasks]);

  const getTasksByStatus = useCallback(
    (status) => localTasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    [localTasks]
  );

  const stats = {
    total: localTasks.length,
    done: localTasks.filter((t) => t.status === 'done').length,
    percentage: localTasks.length > 0 ? Math.round((localTasks.filter((t) => t.status === 'done').length / localTasks.length) * 100) : 0,
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = localTasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;
    const task = localTasks.find((t) => t._id === taskId);

    if (!task || task.status === newStatus) return;

    // Optimistic update
    const previousTasks = [...localTasks];
    const targetTasks = localTasks.filter((t) => t.status === newStatus && t._id !== taskId);
    const newOrder = targetTasks.length;

    setLocalTasks((prev) =>
      prev.map((t) =>
        t._id === taskId ? { ...t, status: newStatus, order: newOrder } : t
      )
    );

    try {
      await updateTaskStatus(token, taskId, { status: newStatus, order: newOrder });
    } catch (err) {
      // Rollback
      setLocalTasks(previousTasks);
      toast.error('Failed to move task');
    }
  };

  const handleCreateTask = async (data) => {
    try {
      const response = await createTask(token, { ...data, projectId: project._id });
      const newTask = response.task;
      setLocalTasks((prev) => [...prev, newTask]);
      onTasksChange?.();
      toast.success('Task created');
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
      throw err;
    }
  };

  const handleEditTask = async (taskId, data) => {
    try {
      const response = await updateTask(token, taskId, data);
      const updated = response.task;
      setLocalTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      onTasksChange?.();
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update task');
      throw err;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(token, taskId);
      setLocalTasks((prev) => prev.filter((t) => t._id !== taskId));
      onTasksChange?.();
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete task');
      throw err;
    }
  };

  const members = [
    project.userId,
    ...(project.members || []),
  ].filter(Boolean);

  return (
    <div className="roadmap-board">
      <div className="roadmap-header">
        <div className="roadmap-stats">
          <div className="stat-item">
            <Layers size={16} />
            <span>{stats.total} Total</span>
          </div>
          <div className="stat-item">
            <CheckCircle size={16} />
            <span>{stats.done} Done</span>
          </div>
          <div className="stat-item">
            <TrendingUp size={16} />
            <span>{stats.percentage}% Complete</span>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="roadmap-columns">
          {COLUMNS.map((col) => (
            <RoadmapColumn
              key={col.id}
              status={col.id}
              label={col.label}
              tasks={getTasksByStatus(col.id)}
              onAddTask={(status) => setCreateModal({ open: true, status })}
              onClickTask={(task) => setEditModal({ open: true, task })}
              isOwner={isOwner}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <RoadmapTaskCard task={activeTask} onClick={() => {}} isOwner={isOwner} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskModal
        isOpen={createModal.open}
        onClose={() => setCreateModal({ open: false, status: 'backlog' })}
        onSubmit={handleCreateTask}
        members={members}
        defaultStatus={createModal.status}
      />

      <EditTaskModal
        task={editModal.task}
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, task: null })}
        onSubmit={handleEditTask}
        onDelete={handleDeleteTask}
        members={members}
        isOwner={isOwner}
      />
    </div>
  );
}
