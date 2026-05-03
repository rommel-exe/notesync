import React from 'react';

interface PlannerTabsProps {
  activeTab: 'day' | 'week' | 'month';
  setActiveTab: (tab: 'day' | 'week' | 'month') => void;
}

const PlannerTabs: React.FC<PlannerTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="planner-tabs">
      <button
        className={activeTab === 'day' ? 'active' : ''}
        onClick={() => setActiveTab('day')}
      >
        Day
      </button>
      <button
        className={activeTab === 'week' ? 'active' : ''}
        onClick={() => setActiveTab('week')}
      >
        Week
      </button>
      <button
        className={activeTab === 'month' ? 'active' : ''}
        onClick={() => setActiveTab('month')}
      >
        Month
      </button>
    </div>
  );
};

export default PlannerTabs;