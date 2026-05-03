import React from 'react';
import type { Task } from '../../state/taskStore';

interface AgendaPanelProps {
  overdueTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const AgendaPanel: React.FC<AgendaPanelProps> = ({ 
  overdueTasks, 
  todayTasks, 
  upcomingTasks, 
  onTaskClick 
}) => {
  return (
    <div className="agenda-panel">
      <div className="agenda-section">
        <h3>Overdue</h3>
        {overdueTasks.length > 0 ? (
          overdueTasks.map(task => (
            <div
              key={task.id}
              className="agenda-task overdue"
              onClick={() => onTaskClick(task.id)}
            >
              {task.title}
            </div>
          ))
        ) : (
          <div className="empty-state">No overdue tasks</div>
        )}
      </div>

      <div className="agenda-section">
        <h3>Today</h3>
        {todayTasks.length > 0 ? (
          todayTasks.map(task => (
            <div
              key={task.id}
              className="agenda-task today"
              onClick={() => onTaskClick(task.id)}
            >
              {task.title}
            </div>
          ))
        ) : (
          <div className="empty-state">No tasks for today</div>
        )}
      </div>

      <div className="agenda-section">
        <h3>Upcoming</h3>
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map(task => (
            <div
              key={task.id}
              className="agenda-task upcoming"
              onClick={() => onTaskClick(task.id)}
            >
              {task.title}
            </div>
          ))
        ) : (
          <div className="empty-state">No upcoming tasks</div>
        )}
      </div>
    </div>
  );
};

export default AgendaPanel;