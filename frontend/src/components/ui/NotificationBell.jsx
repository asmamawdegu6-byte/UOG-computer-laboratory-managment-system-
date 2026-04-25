import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications({ limit: 1000 });
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleClearRead = async (e) => {
    e.stopPropagation();
    await clearAllRead();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setIsOpen(false);
  };

  const getPriorityClass = (priority) => {
    const classes = {
      critical: 'notif-priority-critical',
      high: 'notif-priority-high',
      medium: 'notif-priority-medium',
      low: 'notif-priority-low'
    };
    return classes[priority] || classes.medium;
  };

  const getTypeIcon = (type) => {
    const icons = {
      fault_reported: '🔧',
      fault_assigned: '📋',
      fault_updated: '🔄',
      fault_resolved: '✅',
      booking_created: '📅',
      booking_confirmed: '✓',
      booking_cancelled: '❌',
      booking_reminder: '⏰',
      report: '📊',
      maintenance_reminder: '🔧',
      maintenance_overdue: '⚠️',
      system_alert: '⚠️',
      general: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const displayNotifications = notifications.slice(0, 10);

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell-btn" onClick={handleToggle} aria-label="Notifications">
        <svg className="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button className="notif-action-btn" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="notification-dropdown-body">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : displayNotifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              displayNotifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'notification-unread' : ''} ${getPriorityClass(notification.priority)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-icon">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-item-title">{notification.title}</div>
                    <div className="notification-item-message">{notification.message}</div>
                    <div className="notification-item-time">{formatTime(notification.createdAt)}</div>
                  </div>
                  <div className="notification-item-actions">
                    {!notification.isRead && (
                      <span className="notification-unread-dot"></span>
                    )}
                    <button
                      className="notification-delete-btn"
                      onClick={(e) => handleDelete(e, notification._id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-dropdown-footer">
            <button className="notification-view-all-btn" onClick={handleViewAll}>
              View All Notifications
            </button>
            {notifications.some(n => n.isRead) && (
              <button className="notification-clear-read-btn" onClick={handleClearRead}>
                Clear Read
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
