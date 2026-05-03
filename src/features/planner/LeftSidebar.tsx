import React from 'react';
import type { Task } from '../../state/taskStore';

interface LeftSidebarProps {
  today: Date;
  todayTasks: Task[];
  unscheduledTasks: Task[];
  onTaskClick: (taskId: string) => void;
  onTaskDragStart: (taskId: string) => void;
  onTaskDragEnd: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  today,
  todayTasks,
  unscheduledTasks,
  onTaskClick,
  onTaskDragStart,
  onTaskDragEnd,
}) => {
  return (
    <div className="left-sidebar">
      <div className="sidebar-section">
        {/* Today Panel */}
        <div className="today-panel">
          <h2>Today</h2>
          <div className="today-date">{today.toDateString()}</div>
          <div className="today-tasks">
            {todayTasks.map(task => (
              <div
                key={task.id}
                className="today-task"
                onClick={() => onTaskClick(task.id)}
                onDragStart={() => onTaskDragStart(task.id)}
                onDragEnd={onTaskDragEnd}
                draggable
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        {/* Unscheduled Tasks */}
        <h2>Unscheduled</h2>
        <div className="unscheduled-list">
          {unscheduledTasks.map(task => (
            <div
              key={task.id}
              className="unscheduled-task"
              onClick={() => onTaskClick(task.id)}
              onDragStart={() => onTaskDragStart(task.id)}
              onDragEnd={onTaskDragEnd}
              draggable
            >
              {task.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;