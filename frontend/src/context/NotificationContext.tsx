import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '@/types/notification';
import { useAuth } from '@/components/auth-provider';
import { getSocket } from '../services/socketService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    console.log('NotificationContext: fetchNotifications called', { token });
    if (!token) {
      console.log('NotificationContext: fetchNotifications skipped, no token');
      return;
    }
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
  }, [token]);

  const markAsRead = useCallback(async (id: string) => {
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
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, [token, notifications]);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/notifications/read/all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  }, [token]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        const deletedNotification = notifications.find(n => n._id === id);
        if (deletedNotification && deletedNotification.status === 'unread') {
          setUnreadCount(prev => prev - 1);
        }
      }
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  }, [token, notifications]);

  // Initial fetch and WebSocket listener
  useEffect(() => {
    console.log('NotificationContext: useEffect running', { token, fetchNotificationsRef: fetchNotifications });
    if (token) {
      fetchNotifications();

      const socket = getSocket();

      const handleNewNotification = (newNotification: Notification) => {
        console.log('NotificationContext: New notification received via WebSocket', newNotification);
        setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
        setUnreadCount(prevCount => prevCount + 1);
      };

      socket.on('new_notification', handleNewNotification);

      return () => {
        console.log('NotificationContext: useEffect cleanup');
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [token, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};