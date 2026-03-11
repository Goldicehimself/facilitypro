import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Mail, MailOpen, User, Clock, Filter, Reply } from 'lucide-react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, sendReplyToUser } from '../../api/notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Messages = () => {
  const [showUnread, setShowUnread] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    ['messages', { unread: showUnread }],
    () => fetchNotifications({ page: 1, limit: 50, unread: showUnread }),
    { refetchOnWindowFocus: true }
  );

  const notifications = useMemo(() => {
    const list = data?.notifications || [];
    return list.filter((item) => item.type === 'technician_message');
  }, [data]);

  const markReadMutation = useMutation((id) => markNotificationRead(id), {
    onSuccess: () => queryClient.invalidateQueries(['messages']),
  });

  const markAllMutation = useMutation(() => markAllNotificationsRead(), {
    onSuccess: () => queryClient.invalidateQueries(['messages']),
  });

  const replyMutation = useMutation(({ userId, message }) => sendReplyToUser(userId, message), {
    onSuccess: () => {
      setReplyOpen(false);
      setReplyMessage('');
      setReplyTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Messages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Technician messages sent to admin/facility managers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowUnread((v) => !v)}>
            <Filter className="h-4 w-4 mr-2" />
            {showUnread ? 'Showing Unread' : 'Showing All'}
          </Button>
          <Button
            variant="outline"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isLoading}
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${message.read ? 'bg-slate-100 dark:bg-slate-800' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
                      {message.read ? <MailOpen className="h-5 w-5 text-slate-600" /> : <Mail className="h-5 w-5 text-emerald-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {message.title || 'Technician message'}
                        </h3>
                        {!message.read && <Badge className="bg-emerald-100 text-emerald-700">New</Badge>}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {message.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-3">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {message.metadata?.senderName || 'Technician'}
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
                  <div className="flex items-center gap-2">
                    {message.metadata?.senderId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyTarget({
                            userId: message.metadata.senderId,
                            name: message.metadata.senderName || 'Technician'
                          });
                          setReplyOpen(true);
                        }}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    )}
                    {!message.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markReadMutation.mutate(message._id || message.id)}
                        disabled={markReadMutation.isLoading}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {replyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReplyOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reply to {replyTarget?.name || 'Technician'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send an in-app reply.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                className="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <Button variant="outline" className="flex-1" onClick={() => setReplyOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  if (!replyMessage.trim() || !replyTarget?.userId) return;
                  replyMutation.mutate({ userId: replyTarget.userId, message: replyMessage.trim() });
                }}
                disabled={replyMutation.isLoading}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
