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
  const [activities, setActivities] = useState([]);

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
    setActivities,
    addActivity,
    clearActivities,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

