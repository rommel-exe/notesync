import React from 'react';
import type { Task } from '../../state/taskStore';

interface MonthViewProps {
  tasks: Task[];
  today: Date;
  onTaskClick: (taskId: string) => void;
  onTaskDragStart: (taskId: string) => void;
  draggedTaskId: string | null;
}

const MonthView: React.FC<MonthViewProps> = ({
  tasks,
  today,
  onTaskClick,
  onTaskDragStart,
  draggedTaskId,
}) => {
  // Generate calendar for the current month
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const daysInMonth = lastDay.getDate();
  
  // We'll show 6 weeks (42 days) to cover the month
  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - startingDay + 1;
    const date = new Date(year, month, dayNumber);
    const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    return {
      date,
      isCurrentMonth,
      isToday: isCurrentMonth && 
                dayNumber === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear(),
    };
  });

  // Group tasks by date (only for current month)
  const tasksByDate: Record<string, Task[]> = {};
  tasks.forEach(task => {
    if (!task.scheduledAt) return;
    const taskDate = new Date(task.scheduledAt);
    if (
      taskDate.getFullYear() === year &&
      taskDate.getMonth() === month
    ) {
      const dateString = taskDate.toDateString();
      if (!tasksByDate[dateString]) {
        tasksByDate[dateString] = [];
      }
      tasksByDate[dateString].push(task);
    }
  });

  return (
    <div className="month-view">
      <div className="month-header">
        <h2>
          {today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
      </div>
      <div className="month-grid">
        {/* Weekday headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
        {/* Days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={`month-day${!day.isCurrentMonth ? ' other-month' : ''}${
              day.isToday ? ' today' : ''
            }`}
          >
            <div className="day-number">{day.date.getDate()}</div>
            <div className="day-tasks">
              {tasksByDate[day.date.toDateString()].map((task) => (
                <div
                  key={task.id}
                  className={`task-indicator${task.id === draggedTaskId ? ' dragging' : ''}`}
                  onClick={() => onTaskClick(task.id)}
                  onDragStart={() => onTaskDragStart(task.id)}
                  draggable
                >
                  {/* We can show a dot or just a bar for now */}
                  <div className="task-dot" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;