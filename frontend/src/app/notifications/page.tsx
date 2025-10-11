
"use client";

import { useEffect, useState } from 'react';
import { Notification } from '@/types/notification';
import { useAuth } from '@/components/auth-provider';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, Info } from 'lucide-react';
import { Topbar } from "@/components/topbar"; // Import Topbar

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

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
              onClick={handleMarkAllAsRead}
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
              <div className="space-y-2 p-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
