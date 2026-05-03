import React, { useState, useMemo } from 'react';
import { useTaskStore } from '../../state/taskStore';

// Components (to be created)
import LeftSidebar from './LeftSidebar';
import MainViews from './MainViews';
import RightSidebar from './RightSidebar';
import PlannerHeader from './PlannerHeader';

const PlannerPage: React.FC = () => {
  const { tasks, updateTask, createTask, deleteTask } = useTaskStore((state) => ({
    tasks: state.tasks,
    updateTask: state.updateTask,
    createTask: state.createTask,
    deleteTask: state.deleteTask,
  }));

  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Derived data using taskStore selectors
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const todayTasks = useMemo(() => {
    // Using the store's selector for today tasks
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    
    return tasks.filter(task => {
      // Skip completed/archived tasks
      if (task.status === 'done' || task.status === 'archived') {
        return false;
      }
      
      const relevantDate = task.scheduledAt ?? task.dueDate;
      return relevantDate !== undefined && relevantDate >= start && relevantDate <= end;
    });
  }, [tasks, today]);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => !task.scheduledAt && task.status !== 'done' && task.status !== 'archived');
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      return due < todayStart && task.status !== 'done' && task.status !== 'archived';
    });
  }, [tasks, today]);

  const upcomingTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
      return due > todayEnd && task.status !== 'done' && task.status !== 'archived';
    });
  }, [tasks, today]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDropOnDate = (date: Date) => {
    if (draggedTaskId) {
      updateTask(draggedTaskId, { scheduledAt: date.getTime() });
      setDraggedTaskId(null);
    }
  };

  const handleQuickAdd = (title: string, dueDate?: string) => {
    // Natural language quick add - basic implementation
    const scheduledAt = dueDate ? new Date(dueDate).getTime() : undefined;
    createTask({
      title,
      scheduledAt,
      // TODO: parse time from natural language
    });
  };

  return (
    <div className="planner-page">
      <PlannerHeader 
        todayTasks={todayTasks}
        onQuickAdd={handleQuickAdd}
      />
      <div className="planner-body">
        <LeftSidebar
          today={today}
          todayTasks={todayTasks}
          unscheduledTasks={unscheduledTasks}
          overdueTasks={overdueTasks}
          onTaskClick={handleTaskClick}
          onTaskDragStart={handleTaskDragStart}
          onTaskDragEnd={handleTaskDragEnd}
        />
        <MainViews
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tasks={tasks}
          today={today}
          onTaskClick={handleTaskClick}
          onTaskDragStart={handleTaskDragStart}
          onTaskDrop={handleDropOnDate}
          draggedTaskId={draggedTaskId}
        />
        <RightSidebar
          selectedTaskId={selectedTaskId}
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          overdueTasks={overdueTasks}
          todayTasks={todayTasks}
          upcomingTasks={upcomingTasks}
        />
      </div>
    </div>
  );
};

export default PlannerPage;