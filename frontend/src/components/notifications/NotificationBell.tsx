import { Bell } from 'lucide-react';
import { useState } from 'react'; // Remove useEffect, useRef
import { Notification } from '@/types/notification';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import NotificationItem from './NotificationItem';
import Link from 'next/link';
import { useNotifications } from '../../context/NotificationContext'; // Import useNotifications

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(); // Consume from context

  // Remove fetchNotifications, useEffect, and hasFetched ref

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
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-blue-400 hover:underline">
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
                onItemClick={markAsRead}
                onDelete={deleteNotification}
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
