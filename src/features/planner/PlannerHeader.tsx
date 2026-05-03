import React from 'react';
import type { Task } from '../../state/taskStore';

interface PlannerHeaderProps {
  todayTasks: Task[];
  onQuickAdd: (title: string, dueDate?: string, time?: string) => void;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ todayTasks, onQuickAdd }) => {
  return (
    <div className="planner-header">
      <div className="header-content">
        <h1>Planner</h1>
        <div className="today-summary">
          <span className="date">Today</span>
          <span className="task-count">{todayTasks.length} tasks</span>
        </div>
        <button className="quick-add-button" onClick={() => onQuickAdd('New Task')}>
          + Add Task
        </button>
      </div>
    </div>
  );
};

export default PlannerHeader;