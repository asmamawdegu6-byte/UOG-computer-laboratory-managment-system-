import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = { page, limit: 20 };
    if (filter === 'unread') params.isRead = false;
    else if (filter === 'read') params.isRead = true;
    fetchNotifications(params);
  }, [filter, page, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getPriorityClass = (priority) => {
    const classes = {
      critical: 'notif-page-priority-critical',
      high: 'notif-page-priority-high',
      medium: 'notif-page-priority-medium',
      low: 'notif-page-priority-low'
    };
    return classes[priority] || '';
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
      system_alert: '⚠️',
      general: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  };

  const getTypeLabel = (type) => {
    const labels = {
      fault_reported: 'Fault Reported',
      fault_assigned: 'Fault Assigned',
      fault_updated: 'Fault Updated',
      fault_resolved: 'Fault Resolved',
      booking_created: 'Booking Created',
      booking_confirmed: 'Booking Confirmed',
      booking_cancelled: 'Booking Cancelled',
      booking_reminder: 'Booking Reminder',
      system_alert: 'System Alert',
      general: 'General'
    };
    return labels[type] || 'Notification';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredNotifications = notifications;

  return (
    <DashboardLayout>
      <div className="notifications-page">
        <div className="notifications-page-header">
          <div>
            <h1>Notifications</h1>
            <p className="page-description">View and manage all your notifications</p>
          </div>
          <div className="notifications-page-actions">
            <button className="np-action-btn" onClick={markAllAsRead}>
              Mark All Read
            </button>
            <button className="np-action-btn secondary" onClick={clearAllRead}>
              Clear Read
            </button>
          </div>
        </div>

        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => { setFilter('all'); setPage(1); }}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => { setFilter('unread'); setPage(1); }}
          >
            Unread
          </button>
          <button
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => { setFilter('read'); setPage(1); }}
          >
            Read
          </button>
        </div>

        <div className="notifications-list">
          {loading ? (
            <div className="notifications-loading">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notifications-empty">
              <div className="empty-icon">🔔</div>
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification._id}
                className={`notification-page-item ${!notification.isRead ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="npi-icon">{getTypeIcon(notification.type)}</div>
                <div className="npi-content">
                  <div className="npi-header">
                    <span className="npi-title">{notification.title}</span>
                    <span className="npi-type-badge">{getTypeLabel(notification.type)}</span>
                  </div>
                  <div className="npi-message">{notification.message}</div>
                  <div className="npi-meta">
                    <span className="npi-time">{formatDate(notification.createdAt)}</span>
                    {notification.sender && (
                      <span className="npi-sender">From: {notification.sender.name}</span>
                    )}
                    {notification.link && (
                      <span className="npi-link-indicator">Has link →</span>
                    )}
                  </div>
                </div>
                <div className="npi-actions">
                  {!notification.isRead && <span className="npi-unread-dot"></span>}
                  <button
                    className="npi-delete-btn"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
