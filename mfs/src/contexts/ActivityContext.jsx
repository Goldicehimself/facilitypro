import React, { createContext, useState, useContext } from 'react';

const ActivityContext = createContext(null);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return context;
};

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'work_order',
      action: 'created',
      title: 'Work Order WO-2024-001 Created',
      description: 'HVAC System Maintenance',
      timestamp: new Date(Date.now() - 5 * 60000),
      icon: '📋',
      user: 'John Doe',
      status: 'pending',
    },
    {
      id: 2,
      type: 'task_completed',
      action: 'completed',
      title: 'PM Task Completed',
      description: 'Filter Replacement - Building A',
      timestamp: new Date(Date.now() - 15 * 60000),
      icon: '✅',
      user: 'Sarah Smith',
      status: 'completed',
    },
    {
      id: 3,
      type: 'inspection',
      action: 'updated',
      title: 'Inspection Report Updated',
      description: 'Electrical Panel Inspection',
      timestamp: new Date(Date.now() - 30 * 60000),
      icon: '🔍',
      user: 'Mike Johnson',
      status: 'in_progress',
    },
    {
      id: 4,
      type: 'asset',
      action: 'created',
      title: 'New Asset Added',
      description: 'Boiler Unit - Building C',
      timestamp: new Date(Date.now() - 45 * 60000),
      icon: '⚙️',
      user: 'Emma Wilson',
      status: 'active',
    },
  ]);

  const addActivity = (activityData) => {
    const newActivity = {
      id: Date.now(),
      timestamp: new Date(),
      icon: getActivityIcon(activityData.type),
      ...activityData,
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  const getActivityIcon = (type) => {
    const icons = {
      work_order: '📋',
      task_completed: '✅',
      inspection: '🔍',
      asset: '⚙️',
      pm_scheduled: '📅',
      report_generated: '📊',
      user_action: '👤',
      system: '🔧',
      alert: '⚠️',
    };
    return icons[type] || '📌';
  };

  const clearActivities = () => {
    setActivities([]);
  };

  const value = {
    activities,
    addActivity,
    clearActivities,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};
