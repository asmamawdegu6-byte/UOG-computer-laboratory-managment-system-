import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const stats = [
    {
      label: 'Active Bookings',
      value: 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      color: '#3498db',
      bgColor: '#ebf5fb'
    },
    {
      label: 'Past Sessions',
      value: 15,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      color: '#2ecc71',
      bgColor: '#eafaf1'
    },
    {
      label: 'Reported Faults',
      value: 1,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      color: '#e74c3c',
      bgColor: '#fdedec'
    },
    {
      label: 'Available Labs',
      value: 5,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      color: '#9b59b6',
      bgColor: '#f5eef8'
    }
  ];

  const recentActivity = [
    { id: 1, action: 'Booked Workstation', lab: 'Lab A - PC 12', date: '2026-03-24', time: '09:30 AM', status: 'Confirmed' },
    { id: 2, action: 'Downloaded Material', lab: 'Lab B', date: '2026-03-22', time: '02:15 PM', status: 'Completed' },
    { id: 3, action: 'Reported Fault', lab: 'Lab C - PC 08', date: '2026-03-20', time: '11:00 AM', status: 'Resolved' }
  ];

  const quickActions = [
    {
      label: 'Book Workstation',
      path: '/student/book',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      color: '#3498db'
    },
    {
      label: 'View Availability',
      path: '/student/availability',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      color: '#2ecc71'
    },
    {
      label: 'My Bookings',
      path: '/student/bookings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      color: '#f39c12'
    },
    {
      label: 'Download Materials',
      path: '/student/materials',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      color: '#9b59b6'
    },
    {
      label: 'Report Fault',
      path: '/student/report-fault',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      color: '#e74c3c'
    },
    {
      label: 'Booking History',
      path: '/student/history',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: '#1abc9c'
    }
  ];

  const notifications = [
    { id: 1, message: 'Your Lab A booking is confirmed for tomorrow', type: 'success', time: '2 hours ago' },
    { id: 2, message: 'New course materials available in Lab B', type: 'info', time: '5 hours ago' }
  ];

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'resolved': return 'status-resolved';
      default: return 'status-default';
    }
  };

  return (
    <DashboardLayout>
      <div className="student-dashboard">

        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Student Dashboard</h1>
            <p className="welcome-text">Welcome back! Manage your lab bookings and resources efficiently.</p>
          </div>
          <div className="header-date">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ '--card-color': stat.color, '--bg-color': stat.bgColor }}>
              <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Recent Activity */}
          <div className="dashboard-section activity-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
              <Link to="/student/history" className="view-all-link">View All →</Link>
            </div>
            <div className="activity-table-wrapper">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Lab / PC</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div className="activity-action">{activity.action}</div>
                      </td>
                      <td>{activity.lab}</td>
                      <td>
                        <div className="activity-date">{activity.date}</div>
                        <div className="activity-time">{activity.time}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(activity.status)}`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notifications */}
          <div className="dashboard-section notifications-section">
            <div className="section-header">
              <h2>Notifications</h2>
              <span className="notification-count">{notifications.length}</span>
            </div>
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div key={notification.id} className={`notification-item notification-${notification.type}`}>
                  <div className="notification-icon">
                    {notification.type === 'success' ? '✓' : 'ℹ'}
                  </div>
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section quick-actions-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path} className="quick-action-card" style={{ '--action-color': action.color }}>
                <div className="quick-action-icon" style={{ color: action.color }}>
                  {action.icon}
                </div>
                <span className="quick-action-label">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
