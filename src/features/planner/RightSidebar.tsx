import React from 'react';
import AgendaPanel from './RightSidebar/AgendaPanel';
import TaskInspector from './RightSidebar/TaskInspector';
import type { Task } from '../../state/taskStore';

interface RightSidebarProps {
  selectedTaskId: string | null;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, "id">>) => void;
  onDeleteTask: (taskId: string) => void;
  overdueTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedTaskId,
  tasks,
  onTaskClick,
  onUpdateTask,
  onDeleteTask,
  overdueTasks,
  todayTasks,
  upcomingTasks,
}) => {
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;

  return (
    <div className="right-sidebar">
      <AgendaPanel
        overdueTasks={overdueTasks}
        todayTasks={todayTasks}
        upcomingTasks={upcomingTasks}
        onTaskClick={onTaskClick}
      />
      {selectedTask && (
        <TaskInspector
          task={selectedTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onTaskClick={onTaskClick}
        />
      )}
    </div>
  );
};

export default RightSidebar;