import React, { useState } from 'react';
import type { Task } from '../../state/taskStore';

interface TaskInspectorProps {
  task: Task;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, "id">>) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
}

const TaskInspector: React.FC<TaskInspectorProps> = ({ 
  task, 
  onUpdateTask, 
  onDeleteTask,
  onTaskClick 
}) => {
  const [editingTitle, setEditingTitle] = useState(task.title);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdateTask(task.id, { title: editingTitle });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingTitle(task.title);
    setIsEditing(false);
  };

  return (
    <div className="task-inspector">
      <div className="inspector-header">
        <h3>Task Details</h3>
        <button className="close-button" onClick={() => onTaskClick(null)}>
          ×
        </button>
      </div>
      <div className="inspector-body">
        {isEditing ? (
          <>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              autoFocus
              className="task-title-input"
            />
            <div className="inspector-actions">
              <button onClick={handleSave} className="save-button">
                Save
              </button>
              <button onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="task-title">{task.title}</div>
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          </>
        )}
        <div className="task-meta">
          <div>
            <strong>Priority:</strong> {task.priority || 'Medium'}
          </div>
          <div>
            <strong>Due:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
          </div>
          <div>
            <strong>Status:</strong> {task.status || 'Todo'}
          </div>
        </div>
        {task.description && (
          <div className="task-description">
            <strong>Description:</strong>
            <p>{task.description}</p>
          </div>
        )}
        <div className="inspector-footer">
          <button 
            onClick={() => onDeleteTask(task.id)}
            className="delete-button"
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskInspector;