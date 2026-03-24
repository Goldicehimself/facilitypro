import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'work_order_assigned':
      case 'workorder_assigned':
      case 'workorder_bulk_assigned':
      case 'workorder_created':
      case 'workorder_comment':
      case 'workorder_status':
      case 'service_request_created':
      case 'service_request_assigned':
      case 'maintenance_scheduled':
      case 'leave_request_submitted':
      case 'fund_request_created':
      case 'technician_message':
      case 'admin_reply':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'certificate_uploaded':
        return <AlertCircle className="h-4 w-4 text-indigo-500" />;
      case 'work_order_overdue':
      case 'workorder_due_soon':
      case 'workorder_overdue':
      case 'leave_rejected':
      case 'fund_rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pm_due':
      case 'maintenance_due_soon':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'work_order_completed':
      case 'leave_approved':
      case 'fund_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate if actionUrl is provided
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('/preventive-maintenance/')) {
        navigate('/preventive-maintenance');
      } else {
        navigate(notification.actionUrl);
      }
      setOpen(false);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diff = Math.floor((now - notifTime) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return notifTime.toLocaleDateString();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-slate-100 transition"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => setOpen(!open)}
      >
        {unreadCount > 0 && (
          <Badge
            className="
              absolute -top-1 -right-1
              h-5 min-w-[1.25rem]
              px-1
              rounded-full
              text-[11px]
            "
            style={{ backgroundColor: 'var(--mp-brand)', color: '#ffffff' }}
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        <Bell className="h-5 w-5" />
      </Button>

      {/* Dropdown Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Content */}
          <div className="absolute top-full right-0 mt-2 w-80 z-50 bg-white dark:bg-slate-950 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-3 cursor-pointer transition-all relative
                      ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/30' : ''}
                      hover:bg-slate-100 dark:hover:bg-slate-800
                      group
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.metadata?.assignmentNote && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1 line-clamp-2">
                            Note: {notification.metadata.assignmentNote}
                          </p>
                        )}
                        {notification.metadata?.leaveReason && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1 line-clamp-2">
                            Reason: {notification.metadata.leaveReason}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          title="Dismiss notification"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => clearAll()}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Clear all notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
