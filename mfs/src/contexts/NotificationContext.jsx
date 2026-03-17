import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const normalizeNotifications = (items = []) =>
    items.map((n) => ({
      id: n._id || n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.createdAt || n.timestamp,
      read: !!n.read,
      actionUrl: n.link || n.actionUrl,
      metadata: n.metadata || {}
    }));

  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token || token.startsWith('local-')) return;

    try {
      const data = await fetchNotifications({ page: 1, limit: 20, unread: false, dueSoonDays: 7 });
      const list = normalizeNotifications(data?.notifications || []);
      const computedUnread = list.filter((item) => !item.read).length;
      const apiUnread = typeof data?.unreadCount === 'number' ? data.unreadCount : null;
      const nextUnread = apiUnread === null ? computedUnread : (apiUnread || computedUnread);
      setNotifications(list);
      setUnreadCount(nextUnread);
    } catch (error) {
      // Silently ignore to avoid noise
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token && !token.startsWith('local-')) {
        await markNotificationRead(id);
      }
    } catch (error) {
      // ignore
    }

    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token && !token.startsWith('local-')) {
        await markAllNotificationsRead();
      }
    } catch (error) {
      // ignore
    }

    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const addNotification = (data) => {
    const newNotification = {
      id: Date.now(),
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: data.actionUrl,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast based on notification type
    switch (data.type) {
      case 'work_order_assigned':
        toast.info(`New work order assigned: ${data.title}`);
        break;
      case 'work_order_overdue':
        toast.error(`Work order overdue: ${data.title}`);
        break;
      case 'pm_due':
        toast.warning(`Preventive maintenance due: ${data.title}`);
        break;
      case 'work_order_completed':
        toast.success(`Task completed: ${data.title}`);
        break;
      default:
        toast.info(data.message);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
