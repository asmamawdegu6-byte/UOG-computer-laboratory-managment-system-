import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { reportService } from '../../services/reportService';
import Card from '../../components/ui/Card';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await reportService.getDashboard();
            setDashboardData(data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const stats = dashboardData ? [
        {
            label: 'Total Users',
            value: dashboardData.stats?.totalUsers || 0,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            color: '#3498db',
            bgColor: '#ebf5fb'
        },
        {
            label: 'Total Bookings',
            value: dashboardData.stats?.totalBookings || 0,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
            color: '#f39c12',
            bgColor: '#fef5e7'
        },
        {
            label: "Today's Bookings",
            value: dashboardData.stats?.todayBookings || 0,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            ),
            color: '#9b59b6',
            bgColor: '#f5eef8'
        },
        {
            label: 'Pending Faults',
            value: dashboardData.stats?.pendingFaults || 0,
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
            label: 'Total Equipment',
            value: dashboardData.stats?.totalEquipment || 0,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
            ),
            color: '#1abc9c',
            bgColor: '#e8f8f5'
        },
        {
            label: 'Maintenance Equipment',
            value: dashboardData.stats?.maintenanceEquipment || 0,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
            ),
            color: '#e67e22',
            bgColor: '#fef5e7'
        }
    ] : [];

    const quickActions = [
        {
            label: 'User Management',
            path: '/admin/users',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            color: '#3498db'
        },
        {
            label: 'Lab Management',
            path: '/admin/labs',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
            color: '#2ecc71'
        },
        {
            label: 'Booking Management',
            path: '/admin/bookings',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
            color: '#f39c12'
        },
        {
            label: 'Reports & Analytics',
            path: '/admin/reports',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
            ),
            color: '#9b59b6'
        },
        {
            label: 'Workstation Management',
            path: '/admin/workstations',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
            ),
            color: '#1abc9c'
        },
        {
            label: 'Conflict Detection',
            path: '/admin/conflicts',
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
            label: 'Fault Management',
            path: '/admin/faults',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            ),
            color: '#f97316'
        },
        {
            label: 'System Settings',
            path: '/admin/settings',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            ),
            color: '#95a5a6'
        }
    ];

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="admin-dashboard">
                {/* Header Section */}
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>Admin Dashboard</h1>
                        <p className="welcome-text">System Overview & Management Control Center</p>
                    </div>
                    <div className="header-date">
                        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>

                {error && (
                    <div className="error-message" style={{ marginBottom: '1rem' }}>
                        {error}
                        <button onClick={fetchDashboardData} style={{ marginLeft: '1rem', cursor: 'pointer' }}>Retry</button>
                    </div>
                )}

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
                    {/* Recent Bookings */}
                    <div className="dashboard-section activity-section">
                        <div className="section-header">
                            <h2>Recent Bookings</h2>
                            <Link to="/admin/bookings" className="view-all-link">View All &rarr;</Link>
                        </div>
                        <div className="activity-table-wrapper">
                            {dashboardData?.recentActivity?.bookings?.length > 0 ? (
                                <table className="activity-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Lab</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.recentActivity.bookings.map((booking) => (
                                            <tr key={booking._id}>
                                                <td>
                                                    <div className="activity-action">{booking.user?.name || 'Unknown'}</div>
                                                </td>
                                                <td>{booking.lab?.name || 'N/A'}</td>
                                                <td>
                                                    <div className="activity-date">{new Date(booking.date).toLocaleDateString()}</div>
                                                    <div className="activity-time">{booking.startTime} - {booking.endTime}</div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${booking.status === 'confirmed' ? 'status-confirmed' : booking.status === 'pending' ? 'status-pending' : 'status-default'}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No recent bookings.</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Faults */}
                    <div className="dashboard-section notifications-section">
                        <div className="section-header">
                            <h2>Recent Faults</h2>
                            <Link to="/admin/faults" className="view-all-link">View All &rarr;</Link>
                        </div>
                        <div className="notifications-list">
                            {dashboardData?.recentActivity?.faults?.length > 0 ? (
                                dashboardData.recentActivity.faults.map((fault) => (
                                    <div key={fault._id} className={`notification-item ${fault.status === 'open' ? 'notification-warning' : fault.status === 'resolved' ? 'notification-success' : 'notification-info'}`}>
                                        <div className="notification-icon">
                                            {fault.status === 'open' ? '\u26A0' : fault.status === 'resolved' ? '\u2713' : '\u2139'}
                                        </div>
                                        <div className="notification-content">
                                            <p><strong>{fault.title}</strong></p>
                                            <p>{fault.lab?.name || 'N/A'} - {fault.status}</p>
                                            <span className="notification-time">{new Date(fault.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No recent faults.</p>
                            )}
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

export default AdminDashboard;
