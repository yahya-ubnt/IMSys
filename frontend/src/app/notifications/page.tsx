
"use client";

import { useEffect, useMemo } from 'react';
import { Notification } from '@/types/notification';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Topbar } from "@/components/topbar"; // Import Topbar
import { isToday, isYesterday, startOfDay } from 'date-fns'; // Import date-fns functions
import { useNotifications } from '../../context/NotificationContext'; // Import useNotifications

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications(); // Consume from context

  // Remove fetchNotifications and useEffect related to fetching

  // Call fetchNotifications once on mount for this page
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);


  const groupedNotifications = useMemo(() => {
    const groups: { today: Notification[]; yesterday: Notification[]; older: Notification[] } = {
      today: [],
      yesterday: [],
      older: [],
    };

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      if (isToday(notificationDate)) {
        groups.today.push(notification);
      } else if (isYesterday(notificationDate)) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Notifications</h1>
            <p className="text-sm text-zinc-400">Stay updated with all your system notifications.</p>
          </div>
          {notifications.length > 0 && (
            <Button
              onClick={markAllAsRead}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg rounded-xl">
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center">
                <Info className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-lg font-semibold">No new notifications</p>
                <p className="text-sm">Check back later for updates.</p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {groupedNotifications.today.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold text-zinc-300">Today</h2>
                    <div className="space-y-2">
                      {groupedNotifications.today.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          onItemClick={markAsRead}
                          onDelete={deleteNotification}
                        />
                      ))}
                    </div>
                  </>
                )}

                {groupedNotifications.yesterday.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold text-zinc-300 mt-4">Yesterday</h2>
                    <div className="space-y-2">
                      {groupedNotifications.yesterday.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          onItemClick={markAsRead}
                          onDelete={deleteNotification}
                        />
                      ))}
                    </div>
                  </>
                )}

                {groupedNotifications.older.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold text-zinc-300 mt-4">Older</h2>
                    <div className="space-y-2">
                      {groupedNotifications.older.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          onItemClick={markAsRead}
                          onDelete={deleteNotification}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
