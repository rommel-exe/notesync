import React from 'react';
import type { Task } from '../../state/taskStore';

interface DayViewProps {
  tasks: Task[];
  today: Date;
  onTaskClick: (taskId: string) => void;
  onTaskDragStart: (taskId: string) => void;
  onTaskDrop: (date: Date) => void;
  draggedTaskId: string | null;
}

const DayView: React.FC<DayViewProps> = ({
  tasks,
  today,
  onTaskClick,
  onTaskDragStart,
  onTaskDrop,
  draggedTaskId,
}) => {
  // Filter tasks for today
  const dayTasks = tasks.filter(task => {
    if (!task.scheduledAt) return false;
    const taskDate = new Date(task.scheduledAt);
    return taskDate.toDateString() === today.toDateString();
  });

  return (
    <div className="day-view">
      <div className="day-header">
        <h2>{today.toDateString()}</h2>
      </div>
      <div className="timeline">
        {/* Timeline hours from 6AM to 9PM */}
        {Array.from({ length: 15 }, (_, i) => i + 6).map(hour => {
          const hourStart = new Date(today);
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date(hourStart);
          hourEnd.setHours(hour + 1, 0, 0, 0);
          
          return (
            <div key={hour} className="timeline-hour">
              <div className="hour-label">{hour}:00</div>
              <div 
                className="hour-slot"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTaskId) {
                    // Drop task at the start of this hour
                    onTaskDrop(hourStart);
                  }
                }}
              >
                {/* Tasks for this hour */}
                {dayTasks
                  .filter(task => {
                    const taskHour = new Date(task.scheduledAt!).getHours();
                    return taskHour === hour;
                  })
                  .map(task => (
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
          );
        })}
        {/* Current time indicator */}
        <div className="current-time-indicator" />
      </div>
    </div>
  );
};

export default DayView;