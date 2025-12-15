import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types/notification';
import { useAuth } from '@/components/auth-provider';
import { getSocket, initializeSocket } from '../services/socketService';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isLoading } = useAuth();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => n.status === 'unread').length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const notification = notifications.find(n => n._id === id);
    if (notification && notification.status === 'read') return;

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read/all', {
        method: 'PUT',
        credentials: 'include',
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
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
  }, [notifications]);

  // Initial fetch and WebSocket listener
  useEffect(() => {
    if (!isLoading && user) {
      fetchNotifications();
      
      initializeSocket();
      const socket = getSocket();

      const handleNewNotification = (newNotification: Notification) => {
        setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
        setUnreadCount(prevCount => prevCount + 1);
      };

      socket.on('new_notification', handleNewNotification);

      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [fetchNotifications, isLoading, user]);

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