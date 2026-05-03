import React from 'react';
import type { Task } from '../../state/taskStore';

interface WeekViewProps {
  tasks: Task[];
  today: Date;
  onTaskClick: (taskId: string) => void;
  onTaskDragStart: (taskId: string) => void;
  onTaskDrop: (date: Date) => void;
  draggedTaskId: string | null;
}

const WeekView: React.FC<WeekViewProps> = ({
  tasks,
  today,
  onTaskClick,
  onTaskDragStart,
  onTaskDrop,
  draggedTaskId,
}) => {
  // Calculate the week starting from Sunday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  // Group tasks by day
  const tasksByDay: Record<string, Task[]> = {};
  days.forEach(day => {
    const dayString = day.toDateString();
    tasksByDay[dayString] = tasks.filter(task => {
      if (!task.scheduledAt) return false;
      const taskDate = new Date(task.scheduledAt);
      return taskDate.toDateString() === dayString;
    });
  });

  return (
    <div className="week-view">
      <div className="week-header">
        {days.map(day => (
          <div key={day.toDateString()} className="week-day-header">
            <div className="day-name">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
            <div className="day-number">{day.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="week-grid">
        {days.map((day) => (
          <div key={day.toDateString()} className="week-day-column">
            <div
              className="day-tasks"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTaskId) {
                  // Drop task at the start of this day
                  onTaskDrop(day);
                }
              }}
            >
              {tasksByDay[day.toDateString()].map(task => (
                <div
                  key={task.id}
                  className={`task-block${task.id === draggedTaskId ? ' dragging' : ''}`}
                  onClick={() => onTaskClick(task.id)}
                  onDragStart={() => onTaskDragStart(task.id)}
                  draggable
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;