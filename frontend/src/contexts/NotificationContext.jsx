import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { AuthContext } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef(null);
  const initialCheckRef = useRef(null);
  const prevUnreadRef = useRef(null); // null = first load
  const knownIdsRef = useRef(new Set());

  // Toast management
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    setToasts(prev => [...prev, newToast]);

    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Show toast for a notification
  const showToastForNotification = useCallback((notification) => {
    const priorityStyles = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'info'
    };

    addToast({
      type: priorityStyles[notification.priority] || 'info',
      title: notification.title,
      message: notification.message,
      link: notification.link,
      duration: notification.priority === 'critical' ? 10000 : notification.priority === 'high' ? 8000 : 6000
    });
  }, [addToast]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(params);
      if (data.success) {
        const fetched = data.notifications || [];
        setNotifications(fetched);
        setUnreadCount(data.unreadCount || 0);

        // Show toasts for new unread notifications not yet seen
        const isFirstLoad = prevUnreadRef.current === null;
        const newUnread = fetched.filter(n => !n.isRead && !knownIdsRef.current.has(n._id));

        if (newUnread.length > 0) {
          // On first load, only show toasts for the most recent 3
          // On subsequent polls, show all new ones
          const toShow = isFirstLoad ? newUnread.slice(0, 3) : newUnread;
          toShow.forEach(n => {
            showToastForNotification(n);
            knownIdsRef.current.add(n._id);
          });
        }

        // Track all known IDs
        fetched.forEach(n => knownIdsRef.current.add(n._id));
        prevUnreadRef.current = data.unreadCount || 0;
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showToastForNotification]);

  // Fetch only unread count (lightweight) and show toasts for new ones
  const checkNewNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getUnreadCount();
      if (data.success) {
        const newCount = data.count || 0;

        // If count increased OR first check with unread items, fetch and show toasts
        if (newCount > 0 && (prevUnreadRef.current === null || newCount > prevUnreadRef.current)) {
          const result = await notificationService.getNotifications({ isRead: false, limit: 10 });
          if (result.success && result.notifications) {
            const newNotifications = result.notifications.filter(
              n => !knownIdsRef.current.has(n._id)
            );
            newNotifications.forEach(n => {
              showToastForNotification(n);
              knownIdsRef.current.add(n._id);
            });
          }
        }

        prevUnreadRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch (err) {
      console.error('Error checking new notifications:', err);
    }
  }, [isAuthenticated, showToastForNotification]);

  // Mark as read
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationService.deleteNotification(id);
      const deleted = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      knownIdsRef.current.delete(id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Clear all read
  const clearAllRead = useCallback(async () => {
    try {
      await notificationService.clearAllRead();
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (err) {
      console.error('Error clearing read notifications:', err);
    }
  }, []);

  // Main polling effect
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadRef.current = null;
      knownIdsRef.current = new Set();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (initialCheckRef.current) {
        clearTimeout(initialCheckRef.current);
        initialCheckRef.current = null;
      }
      return;
    }

    // Immediate fetch on login - shows toasts for existing unread notifications
    fetchNotifications();

    // Quick re-check after 2 seconds to catch any notifications that arrived during login
    initialCheckRef.current = setTimeout(() => {
      checkNewNotifications();
    }, 2000);

    // Poll every 5 seconds for fast notification delivery
    pollingRef.current = setInterval(() => {
      checkNewNotifications();
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (initialCheckRef.current) {
        clearTimeout(initialCheckRef.current);
        initialCheckRef.current = null;
      }
    };
  }, [isAuthenticated, user, fetchNotifications, checkNewNotifications]);

  const value = {
    notifications,
    unreadCount,
    toasts,
    loading,
    fetchNotifications,
    checkNewNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    addToast,
    removeToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
