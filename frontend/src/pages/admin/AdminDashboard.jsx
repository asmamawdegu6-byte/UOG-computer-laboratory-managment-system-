import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { reportService } from '../../services/reportService';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import './AdminDashboard.css';

const CAMPUS_STYLES = {
    MAR: {
        primary: '#e91e63',
        secondary: '#fce4ec',
        accent: '#c2185b',
        gradient: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)',
        bgGradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)'
    },
    ATF: {
        primary: '#00bcd4',
        secondary: '#e0f7fa',
        accent: '#0097a7',
        gradient: 'linear-gradient(135deg, #00bcd4 0%, #80deea 100%)',
        bgGradient: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)'
    },
    HSC: {
        primary: '#4caf50',
        secondary: '#e8f5e9',
        accent: '#388e3c',
        gradient: 'linear-gradient(135deg, #4caf50 0%, #a5d6a7 100%)',
        bgGradient: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
    },
    ATW: {
        primary: '#3949ab',
        secondary: '#e8eaf6',
        accent: '#1a237e',
        gradient: 'linear-gradient(135deg, #3949ab 0%, #5c6bc0 100%)',
        bgGradient: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)'
    }
};

const CAMPUS_NAME_TO_CODE = {
    'Maraki': 'MAR',
    'Atse Tewodros': 'ATW',
    'Atse Fasil': 'ATF',
    'Health Science College (GC)': 'HSC',
    'Health Science College': 'HSC'
};

const getCampusCode = () => {
    try {
        const stored = localStorage.getItem('selectedCampus');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.code;
        }
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.campusCode) {
                return user.campusCode;
            }
            if (user.campus) {
                return CAMPUS_NAME_TO_CODE[user.campus] || user.campus;
            }
        }
    } catch (e) {
        console.error('Error getting campus code:', e);
    }
    return 'ATW';
};

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dashboardData, setDashboardData] = useState(null);
    const [labs, setLabs] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const campusCode = getCampusCode();
    const campusStyle = CAMPUS_STYLES[campusCode] || CAMPUS_STYLES.ATW;
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
        fetchLabsForOverview();
        fetchReservationsForOverview();
        fetchConflictsForDashboard();
    }, []);

    // Detect conflicts for the dashboard
    const fetchConflictsForDashboard = async () => {
        try {
            const [bookingsRes, reservationsRes] = await Promise.all([
                api.get('/bookings', { params: { limit: 1000 } }),
                api.get('/reservations', { params: { limit: 1000 } })
            ]);
            const bookingsList = bookingsRes.data.bookings || [];
            const reservationsList = reservationsRes.data.reservations || [];
            
            // Detect conflicts using the same logic as ConflictDetection page
            const conflicts = detectConflicts(bookingsList, reservationsList);
            setConflicts(conflicts);
        } catch (err) {
            console.error('Error fetching conflicts:', err);
        }
    };

    // Conflict detection algorithm
    const detectConflicts = (bookingsList, reservationsList) => {
        const conflictsList = [];
        
        // 1. Workstation Double Booking Detection
        const wsGrouped = {};
        bookingsList.forEach(booking => {
            if (['cancelled', 'completed', 'no-show'].includes(booking.status)) return;
            const wsId = booking.workstation?.workstationId || 'unknown';
            const labId = booking.lab?._id || 'unknown';
            const dateKey = new Date(booking.date).toISOString().split('T')[0];
            const key = `${labId}-${wsId}-${dateKey}`;
            if (!wsGrouped[key]) wsGrouped[key] = [];
            wsGrouped[key].push(booking);
        });

        Object.entries(wsGrouped).forEach(([key, groupBookings]) => {
            if (groupBookings.length < 2) return;
            for (let i = 0; i < groupBookings.length; i++) {
                for (let j = i + 1; j < groupBookings.length; j++) {
                    const a = groupBookings[i];
                    const b = groupBookings[j];
                    if (a.startTime < b.endTime && b.startTime < a.endTime) {
                        conflictsList.push({
                            id: `ws-${a._id}-${b._id}`,
                            type: 'Double Booking',
                            lab: a.lab?.name || 'N/A',
                            workstation: a.workstation?.workstationNumber || 'N/A',
                            date: new Date(a.date).toISOString().split('T')[0],
                            time: `${a.startTime} - ${a.endTime} overlaps ${b.startTime} - ${b.endTime}`,
                            severity: 'high'
                        });
                    }
                }
            }
        });

        // 2. Reservation vs Booking Conflict
        const approvedReservations = reservationsList.filter(r => r.status === 'approved');
        bookingsList.forEach(booking => {
            if (['cancelled', 'completed', 'no-show'].includes(booking.status)) return;
            const bookingDate = new Date(booking.date).toISOString().split('T')[0];
            const bookingLabId = booking.lab?._id?.toString();

            approvedReservations.forEach(reservation => {
                const reservationDate = new Date(reservation.date).toISOString().split('T')[0];
                const reservationLabId = reservation.lab?._id?.toString();

                if (bookingLabId === reservationLabId && bookingDate === reservationDate) {
                    if (booking.startTime < reservation.endTime && reservation.startTime < booking.endTime) {
                        const conflictId = `res-${booking._id}-${reservation._id}`;
                        if (!conflictsList.find(c => c.id === conflictId)) {
                            conflictsList.push({
                                id: conflictId,
                                type: 'Booking vs Reservation',
                                lab: booking.lab?.name || 'N/A',
                                workstation: booking.workstation?.workstationNumber || 'Any',
                                date: bookingDate,
                                time: `Booking ${booking.startTime}-${booking.endTime} vs Reservation ${reservation.startTime}-${reservation.endTime}`,
                                severity: 'critical'
                            });
                        }
                    }
                }
            });
        });

        // 3. Lab Overbooking (two reservations at same time)
        const resGrouped = {};
        approvedReservations.forEach(res => {
            const labId = res.lab?._id?.toString() || 'unknown';
            const dateKey = new Date(res.date).toISOString().split('T')[0];
            const key = `${labId}-${dateKey}`;
            if (!resGrouped[key]) resGrouped[key] = [];
            resGrouped[key].push(res);
        });

        Object.entries(resGrouped).forEach(([key, groupRes]) => {
            if (groupRes.length < 2) return;
            for (let i = 0; i < groupRes.length; i++) {
                for (let j = i + 1; j < groupRes.length; j++) {
                    const a = groupRes[i];
                    const b = groupRes[j];
                    if (a.startTime < b.endTime && b.startTime < a.endTime) {
                        conflictsList.push({
                            id: `lab-${a._id}-${b._id}`,
                            type: 'Lab Overbooked',
                            lab: a.lab?.name || 'N/A',
                            workstation: 'Entire Lab',
                            date: new Date(a.date).toISOString().split('T')[0],
                            time: `${a.courseCode}: ${a.startTime}-${a.endTime} overlaps ${b.courseCode}: ${b.startTime}-${b.endTime}`,
                            severity: 'critical'
                        });
                    }
                }
            }
        });

        return conflictsList;
    };

    // Fetch labs for availability overview - admin sees only their campus
    const fetchLabsForOverview = async () => {
        try {
            // Get admin's campus from user profile (more reliable than selectedCampus)
            const userStr = localStorage.getItem('user');
            let campusName = 'Atse Tewodros'; // default fallback

            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.campus) {
                    campusName = user.campus;
                } else if (user.campusCode) {
                    // Convert code to name if needed
                    const codeToName = {
                        'MAR': 'Maraki',
                        'ATW': 'Atse Tewodros',
                        'ATF': 'Atse Fasil',
                        'HSC': 'Health Science College (GC)'
                    };
                    campusName = codeToName[user.campusCode] || 'Atse Tewodros';
                }
            }

            const response = await fetch(`/api/labs?campus=${encodeURIComponent(campusName)}&all=true`);
            const data = await response.json();
            setLabs(data.labs || []);
        } catch (err) {
            console.error('Error fetching labs:', err);
        }
    };

    // Fetch approved reservations for today
    const fetchReservationsForOverview = async () => {
        try {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            console.log('Fetching reservations for date:', todayStr);
            
            const response = await api.get('/reservations', {
                params: {
                    status: 'approved'
                }
            });
            
            console.log('All approved reservations:', response.data);
            
            // Filter to today's reservations on client side
            const todayISO = todayStr;
            const todayReservations = (response.data.reservations || []).filter(r => {
                const resDate = new Date(r.date).toISOString().split('T')[0];
                return resDate === todayISO;
            });
            
            console.log("Today's reservations:", todayReservations.length);
            setReservations(todayReservations);
        } catch (err) {
            console.error('Error fetching reservations:', err);
        }
    };

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
            color: campusStyle.primary
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
            color: campusStyle.accent
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
        },
        {
            label: 'Telegram Bot',
            path: 'https://t.me/uog_computer_lab_bot',
            external: true,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
            ),
            color: '#0088cc'
        }
    ];

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="admin-dashboard">
                {/* Header Section */}
                <div className="dashboard-header" style={{ '--campus-primary': campusStyle.primary, '--campus-secondary': campusStyle.secondary, '--campus-gradient': campusStyle.gradient }}>
                    <div className="header-content">
                        <div className="campus-badge" style={{ background: campusStyle.bgGradient, color: campusStyle.accent }}>
                            Campus: {campusCode}
                        </div>
                        <h1 style={{ color: campusStyle.primary }}>Admin Dashboard</h1>
                        <p className="welcome-text" style={{ color: campusStyle.accent }}>System Overview & Management Control Center</p>
                    </div>
                    <div className="header-date" style={{ background: campusStyle.gradient }}>
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

                {/* Conflict Summary */}
                {conflicts.length > 0 && (
                    <div className="dashboard-section" style={{ backgroundColor: '#fef2f2', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                        <div className="section-header">
                            <h2 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                Conflicts Detected: {conflicts.length}
                            </h2>
                            <Link to="/admin/conflicts" className="view-all-link">View All Conflicts →</Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                            {conflicts.slice(0, 3).map((conflict, index) => (
                                <div key={index} style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '6px', borderLeft: `4px solid ${conflict.severity === 'critical' ? '#dc2626' : '#f59e0b'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#1f2937' }}>{conflict.type}</span>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: conflict.severity === 'critical' ? '#fef2f2' : '#fef3c7', color: conflict.severity === 'critical' ? '#dc2626' : '#d97706' }}>
                                            {conflict.severity}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        <div>{conflict.lab}</div>
                                        <div>{conflict.date} | {conflict.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="dashboard-grid">
                    {/* Recent Bookings */}
                    <div className="dashboard-section activity-section">
                        <div className="section-header">
                            <h2>Recent Bookings</h2>
                            <Link to="/admin/bookings" className="view-all-link">View All →</Link>
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
                            <Link to="/admin/faults" className="view-all-link">View All →</Link>
                        </div>
                        <div className="notifications-list">
                            {dashboardData?.recentActivity?.faults?.length > 0 ? (
                                dashboardData.recentActivity.faults.map((fault) => (
                                    <div key={fault._id} className={`notification-item ${fault.status === 'open' ? 'notification-warning' : fault.status === 'resolved' ? 'notification-success' : 'notification-info'}`}>
                                        <div className="notification-icon">
                                            {fault.status === 'open' ? '⚠' : fault.status === 'resolved' ? '✓' : 'ℹ'}
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

                {/* Today's Lab Reservations */}
                <div className="dashboard-section activity-section">
                    <div className="section-header">
                        <h2>Today's Lab Reservations</h2>
                        <Link to="/admin/reservations" className="view-all-link">View All →</Link>
                    </div>
                    <div className="activity-table-wrapper">
                        {reservations.length > 0 ? (
                            <table className="activity-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Teacher</th>
                                        <th>Lab</th>
                                        <th>Room</th>
                                        <th>Time</th>
                                        <th>Students</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.slice(0, 5).map((reservation) => (
                                        <tr key={reservation._id}>
                                            <td>
                                                <div className="activity-action">{reservation.courseName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{reservation.courseCode}</div>
                                            </td>
                                            <td>{reservation.teacher?.name || 'N/A'}</td>
                                            <td>{reservation.lab?.name || 'N/A'}</td>
                                            <td>{reservation.roomName || 'N/A'}</td>
                                            <td>
                                                <div className="activity-time">{reservation.startTime} - {reservation.endTime}</div>
                                            </td>
                                            <td>{reservation.numberOfStudents}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No lab reservations for today.</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-section quick-actions-section">
                    <div className="section-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="quick-actions-grid">
                        {quickActions.map((action, index) => (
                            action.external ? (
                                <button
                                    key={index}
                                    onClick={() => window.open(action.path, '_blank')}
                                    className="quick-action-card"
                                    style={{ '--action-color': action.color }}
                                >
                                    <div className="quick-action-icon" style={{ color: action.color }}>
                                        {action.icon}
                                    </div>
                                    <span className="quick-action-label">{action.label}</span>
                                </button>
                            ) : (
                                <Link key={index} to={action.path} className="quick-action-card" style={{ '--action-color': action.color }}>
                                    <div className="quick-action-icon" style={{ color: action.color }}>
                                        {action.icon}
                                    </div>
                                    <span className="quick-action-label">{action.label}</span>
                                </Link>
                            )
                        ))}
                    </div>
                </div>

                {/* Lab Availability Overview */}
                <div className="dashboard-section lab-availability-section">
                    <div className="section-header">
                        <h2>Lab Availability Overview</h2>
                        <Link to="/admin/computer-status" className="view-all-link">View All →</Link>
                    </div>
                    <div className="lab-availability-grid">
                        {labs.length > 0 ? (
                            labs.slice(0, 6).map((lab) => {
                                const totalWorkstations = lab.rooms?.reduce((sum, room) => sum + (room.workstations?.length || 0), 0) || 0;
                                const availableWorkstations = lab.rooms?.reduce((sum, room) => {
                                    return sum + (room.workstations?.filter(ws => ws.status === 'available').length || 0);
                                }, 0) || 0;
                                const percentage = totalWorkstations > 0 ? Math.round((availableWorkstations / totalWorkstations) * 100) : 0;

                                return (
                                    <div key={lab._id} className="lab-availability-card" style={{ borderLeftColor: campusStyle.primary }} onClick={() => navigate(`/admin/computer-status?lab=${lab._id}`)}>
                                        <div className="lab-info">
                                            <h4>{lab.name}</h4>
                                            <p>{lab.rooms?.length || 0} rooms</p>
                                        </div>
                                        <div className="lab-progress">
                                            <div className="progress-bar-wrapper">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        background: percentage > 50 ? '#10b981' : percentage > 25 ? '#f59e0b' : '#ef4444'
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="lab-stats">
                                                <span className="available-count">{availableWorkstations} available</span>
                                                <span className="total-count">/ {totalWorkstations} total</span>
                                            </div>
                                        </div>
                                        <div className="lab-action-hint">
                                            <span>View computers →</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No labs available.</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
