import React from 'react';
import DayView from './MainViews/DayView';
import WeekView from './MainViews/WeekView';
import MonthView from './MainViews/MonthView';
import PlannerTabs from './PlannerTabs';
import type { Task } from '../../state/taskStore';

interface MainViewsProps {
  activeTab: 'day' | 'week' | 'month';
  setActiveTab: (tab: 'day' | 'week' | 'month') => void;
  tasks: Task[];
  today: Date;
  onTaskClick: (taskId: string) => void;
  onTaskDragStart: (taskId: string) => void;
  draggedTaskId: string | null;
}

const MainViews: React.FC<MainViewsProps> = ({
  activeTab,
  setActiveTab,
  tasks,
  today,
  onTaskClick,
  onTaskDragStart,
  draggedTaskId,
}) => {
  return (
    <div className="main-views">
      <PlannerTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {activeTab === 'day' && (
        <DayView
          tasks={tasks}
          today={today}
          onTaskClick={onTaskClick}
          onTaskDragStart={onTaskDragStart}
          draggedTaskId={draggedTaskId}
        />
      )}
      {activeTab === 'week' && (
        <WeekView
          tasks={tasks}
          today={today}
          onTaskClick={onTaskClick}
          onTaskDragStart={onTaskDragStart}
          draggedTaskId={draggedTaskId}
        />
      )}
      {activeTab === 'month' && (
        <MonthView
          tasks={tasks}
          today={today}
          onTaskClick={onTaskClick}
          onTaskDragStart={onTaskDragStart}
          draggedTaskId={draggedTaskId}
        />
      )}
    </div>
  );
};

export default MainViews;