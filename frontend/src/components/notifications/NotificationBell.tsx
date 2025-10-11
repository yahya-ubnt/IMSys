import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Notification } from '@/types/notification';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import NotificationItem from './NotificationItem';
import Link from 'next/link';

const NotificationBell = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => n.status === 'unread').length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5000);
    return () => clearInterval(intervalId);
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    const notification = notifications.find(n => n._id === id);
    if (notification && notification.status === 'read') return;

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, status: 'read' } : n));
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(notifications.filter(n => n._id !== id));
        const deletedNotification = notifications.find(n => n._id === id);
        if (deletedNotification && deletedNotification.status === 'unread') {
          setUnreadCount(prev => prev - 1);
        }
      }
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/notifications/read/all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, status: 'read' })));
        setUnreadCount(0); // All are read
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" style={{ color: 'var(--muted-foreground)' }}>
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0 bg-zinc-900">
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <h3 className="text-md font-semibold">Notifications ({unreadCount})</h3>
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs text-blue-400 hover:underline">
            Mark all as read
          </Button>
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-center text-gray-400">No notifications.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onItemClick={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        <DropdownMenuSeparator className="bg-zinc-800" />
        <div className="p-2 text-center">
          <Link href="/notifications" className="text-sm text-blue-400 hover:underline">
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
