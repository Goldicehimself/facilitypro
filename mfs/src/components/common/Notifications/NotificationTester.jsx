import React, { useState } from 'react';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NotificationTester = () => {
  const { addNotification, clearAll } = useNotifications();
  const [showTester, setShowTester] = useState(false);

  if (!showTester) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-40"
        onClick={() => setShowTester(true)}
      >
        Test Notifications
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80">
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between text-indigo-900 dark:text-indigo-100">
            Notification Tester
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTester(false)}
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              addNotification({
                type: 'work_order_assigned',
                title: 'Work Order Assigned',
                message: 'New work order #WO-2024-001 assigned to you',
                actionUrl: '/work-orders'
              });
            }}
          >
            Work Order Assigned
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              addNotification({
                type: 'work_order_overdue',
                title: 'Overdue Work Order',
                message: 'Work order #WO-2024-002 is now overdue',
                actionUrl: '/work-orders'
              });
            }}
          >
            Overdue Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              addNotification({
                type: 'pm_due',
                title: 'PM Maintenance Due',
                message: 'Preventive maintenance for HVAC-01 is due today',
                actionUrl: '/preventive-maintenance'
              });
            }}
          >
            PM Due
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              addNotification({
                type: 'work_order_completed',
                title: 'Work Order Completed',
                message: 'Work order #WO-2024-003 has been completed',
                actionUrl: '/work-orders'
              });
            }}
          >
            Task Completed
          </Button>
          <hr className="my-2" />
          <Button
            variant="outline"
            size="sm"
            className="w-full text-red-600"
            onClick={() => clearAll()}
          >
            Clear All
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTester;
