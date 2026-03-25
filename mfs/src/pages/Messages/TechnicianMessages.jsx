import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Mail, MailOpen, User, Clock, Filter } from 'lucide-react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TechnicianMessages = () => {
  const [showUnread, setShowUnread] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    ['tech-messages', { unread: showUnread }],
    () => fetchNotifications({ page: 1, limit: 50, unread: showUnread }),
    { refetchOnWindowFocus: true }
  );

  const notifications = useMemo(() => {
    const list = data?.notifications || [];
    return list.filter((item) => item.type === 'admin_reply');
  }, [data]);

  const markReadMutation = useMutation((id) => markNotificationRead(id), {
    onSuccess: () => queryClient.invalidateQueries(['tech-messages']),
  });

  const markAllMutation = useMutation(() => markAllNotificationsRead(), {
    onSuccess: () => queryClient.invalidateQueries(['tech-messages']),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Messages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Replies from admins and facility managers.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={() => setShowUnread((v) => !v)} className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            {showUnread ? 'Showing Unread' : 'Showing All'}
          </Button>
          <Button
            variant="outline"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isLoading}
            className="w-full sm:w-auto"
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="border">
          <CardContent className="p-6 text-slate-500 dark:text-slate-400">Loading messages...</CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="border">
          <CardContent className="p-6 text-slate-500 dark:text-slate-400">No messages yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((message) => (
            <Card key={message._id || message.id} className="border">
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${message.read ? 'bg-slate-100 dark:bg-slate-800' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
                      {message.read ? <MailOpen className="h-5 w-5 text-slate-600" /> : <Mail className="h-5 w-5 text-emerald-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {message.title || 'Reply from admin'}
                        </h3>
                        {!message.read && <Badge className="bg-emerald-100 text-emerald-700">New</Badge>}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {message.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-3">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {message.metadata?.senderName || 'Admin'}
                        </span>
                        {message.metadata?.senderEmail && (
                          <span className="inline-flex items-center gap-1">
                            {message.metadata.senderEmail}
                          </span>
                        )}
                        {message.metadata?.senderPhone && (
                          <span className="inline-flex items-center gap-1">
                            {message.metadata.senderPhone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(message.createdAt || message.timestamp || Date.now()).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!message.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markReadMutation.mutate(message._id || message.id)}
                      disabled={markReadMutation.isLoading}
                      className="w-full sm:w-auto"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianMessages;
