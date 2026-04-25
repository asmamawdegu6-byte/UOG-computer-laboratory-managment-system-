import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './TechnicianDashboard.css';

const CAMPUS_STYLES = {
    MAR: {
        primary: '#e91e63',
        secondary: '#fce4ec',
        accent: '#c2185b',
        gradient: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)'
    },
    ATF: {
        primary: '#00bcd4',
        secondary: '#e0f7fa',
        accent: '#0097a7',
        gradient: 'linear-gradient(135deg, #00bcd4 0%, #80deea 100%)'
    },
    HSC: {
        primary: '#4caf50',
        secondary: '#e8f5e9',
        accent: '#388e3c',
        gradient: 'linear-gradient(135deg, #4caf50 0%, #a5d6a7 100%)'
    },
    ATW: {
        primary: '#3949ab',
        secondary: '#e8eaf6',
        accent: '#1a237e',
        gradient: 'linear-gradient(135deg, #3949ab 0%, #5c6bc0 100%)'
    }
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
            return user.campus;
        }
    } catch (e) {
        console.error('Error getting campus code:', e);
    }
    return 'ATW';
};

const TechnicianDashboard = () => {
    const navigate = useNavigate();
    const campusCode = getCampusCode();
    const campusStyle = CAMPUS_STYLES[campusCode] || CAMPUS_STYLES.ATW;

    const [stats, setStats] = useState({
        openTickets: 0,
        inProgress: 0,
        resolvedToday: 0,
        totalEquipment: 0,
        brokenEquipment: 0,
        inventoryItems: 0,
        labCount: 0,
        totalComputers: 0,
        availableComputers: 0
    });
    const [labs, setLabs] = useState([]);
    const [recentTickets, setRecentTickets] = useState([]);
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            
            const [faultsRes, equipmentRes, labsRes, reservationsRes, inventoryRes, techStatsRes] = await Promise.all([
                api.get('/maintenance/faults'),
                api.get('/maintenance/equipment'),
                api.get(`/labs?campus=${campusCode}`),
                api.get(`/reservations?date=${today}`),
                api.get('/inventory'),
                api.get('/reports/technician-stats')
            ]);

            const faults = faultsRes.data.faults || [];
            const equipment = equipmentRes.data.equipment || [];
            const labsData = labsRes.data.labs || [];
            const reservations = reservationsRes.data.reservations || [];
            const inventory = inventoryRes.data.items || [];
            const techBookings = techStatsRes.data.recentBookings || [];

            // Calculate stats
            const openTickets = faults.filter(f => f.status === 'open').length;
            const inProgress = faults.filter(f => f.status === 'in-progress').length;
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const resolvedToday = faults.filter(f =>
                f.status === 'resolved' && f.resolvedAt && new Date(f.resolvedAt) >= todayDate
            ).length;

            // Calculate total computers
            let totalComputers = 0;
            let availableComputers = 0;
            labsData.forEach(lab => {
                const ws = lab.workstations || [];
                totalComputers += ws.length;
                availableComputers += ws.filter(w => w.status === 'available').length;
            });

            setStats({
                openTickets,
                inProgress,
                resolvedToday,
                totalEquipment: equipment.length,
                brokenEquipment: equipment.filter(e => e.status === 'broken').length,
                inventoryItems: inventory.length,
                labCount: labsData.length,
                totalComputers,
                availableComputers
            });

            setLabs(labsData);
            setTodaySchedule(reservations);
            setRecentBookings(techBookings);

            // Get recent tickets (last 5)
            const recent = faults.slice(0, 5).map(f => ({
                id: f._id,
                title: f.title,
                lab: f.lab?.name || 'N/A',
                severity: f.severity,
                status: f.status,
                reportedBy: f.reportedBy?.name || 'Unknown',
                date: new Date(f.createdAt).toLocaleDateString()
            }));
            setRecentTickets(recent);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const [recentBookings, setRecentBookings] = useState([]);

    const getSeverityColor = (severity) => {
        const colors = {
            low: '#f3f4f6',
            medium: '#fef3c7',
            high: '#fee2e2',
            critical: '#dc2626'
        };
        return colors[severity] || colors.medium;
    };

    const getStatusColor = (status) => {
        const colors = {
            open: '#fef3c7',
            'in-progress': '#dbeafe',
            resolved: '#d1fae5',
            closed: '#f3f4f6'
        };
        return colors[status] || colors.open;
    };

    return (
        <DashboardLayout>
            <div className="technician-dashboard" style={{ '--campus-primary': campusStyle.primary, '--campus-secondary': campusStyle.secondary, '--campus-gradient': campusStyle.gradient }}>
                <div className="dashboard-header-section">
                    <div className="campus-badge" style={{ background: campusStyle.secondary, color: campusStyle.accent }}>
                        Campus: {campusCode}
                    </div>
                    <h1 style={{ color: campusStyle.primary }}>Technician Dashboard</h1>
                    <p className="welcome-text" style={{ color: campusStyle.accent }}>Manage maintenance, equipment, and lab operations</p>
                </div>

                {loading ? (
                    <div className="loading">Loading dashboard data...</div>
                ) : (
                    <>
                        {/* Main Stats Grid */}
                        <div className="stats-grid">
                            <Card className="stat-card">
                                <div className="stat-icon">🎫</div>
                                <div className="stat-value">{stats.openTickets}</div>
                                <div className="stat-label">Open Tickets</div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">⚙️</div>
                                <div className="stat-value">{stats.inProgress}</div>
                                <div className="stat-label">In Progress</div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">✅</div>
                                <div className="stat-value">{stats.resolvedToday}</div>
                                <div className="stat-label">Resolved Today</div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">🖥️</div>
                                <div className="stat-value">{stats.totalComputers}</div>
                                <div className="stat-label">Total Computers</div>
                            </Card>
                        </div>

                        <div className="stats-grid">
                            <Card className="stat-card">
                                <div className="stat-icon">✓</div>
                                <div className="stat-value">{stats.availableComputers}</div>
                                <div className="stat-label">Available PCs</div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">❌</div>
                                <div className="stat-value">{stats.brokenEquipment}</div>
                                <div className="stat-label">Broken Equipment</div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">📦</div>
                                <div className="stat-value">{stats.inventoryItems}</div>
                                <div className="stat-label">Inventory Items</div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">🏢</div>
                                <div className="stat-value">{stats.labCount}</div>
                                <div className="stat-label">Labs</div>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <Card title="Main Functions" className="actions-card">
                            <div className="quick-actions-grid">
                                <div className="action-card large" onClick={() => navigate('/technician/tickets')}>
                                    <div className="action-icon">🎫</div>
                                    <div className="action-content">
                                        <div className="action-title">Maintenance Tickets</div>
                                        <div className="action-description">View, update and resolve fault tickets</div>
                                        <div className="action-badge">{stats.openTickets} open</div>
                                    </div>
                                </div>
                                <div className="action-card large" onClick={() => navigate('/technician/equipment')}>
                                    <div className="action-icon">💻</div>
                                    <div className="action-content">
                                        <div className="action-title">Equipment Status</div>
                                        <div className="action-description">Monitor and update equipment health</div>
                                        <div className="action-badge">{stats.totalEquipment} items</div>
                                    </div>
                                </div>
                                <div className="action-card large" onClick={() => navigate('/technician/update-repair')}>
                                    <div className="action-icon">🔧</div>
                                    <div className="action-content">
                                        <div className="action-title">Update Repair Status</div>
                                        <div className="action-description">Track and update repair progress</div>
                                        <div className="action-badge">{stats.inProgress} in progress</div>
                                    </div>
                                </div>
                                <div className="action-card large" onClick={() => navigate('/technician/inventory')}>
                                    <div className="action-icon">📦</div>
                                    <div className="action-content">
                                        <div className="action-title">Inventory Management</div>
                                        <div className="action-description">Manage lab equipment inventory</div>
                                        <div className="action-badge">{stats.inventoryItems} items</div>
                                    </div>
                                </div>
                                <div className="action-card large" onClick={() => navigate('/technician/computer-check')}>
                                    <div className="action-icon">🖱️</div>
                                    <div className="action-content">
                                        <div className="action-title">Computer Check</div>
                                        <div className="action-description">Manually check and update PC status</div>
                                        <div className="action-badge">View all</div>
                                    </div>
                                </div>
                                <div className="action-card large" onClick={() => navigate('/technician/availability')}>
                                    <div className="action-icon">📅</div>
                                    <div className="action-content">
                                        <div className="action-title">View Availability</div>
                                        <div className="action-description">Check lab and PC availability</div>
                                        <div className="action-badge">Today</div>
                                    </div>
                                </div>
                                <div className="action-card large" onClick={() => navigate('/technician/schedule')}>
                                    <div className="action-icon">🕐</div>
                                    <div className="action-content">
                                        <div className="action-title">View Schedule</div>
                                        <div className="action-description">View lab class schedule</div>
                                        <div className="action-badge">{todaySchedule.length} sessions</div>
                                    </div>
                                </div>
                                <div className="action-card large" onClick={() => navigate('/technician/fault-report')}>
                                    <div className="action-icon">⚠️</div>
                                    <div className="action-content">
                                        <div className="action-title">Report Fault</div>
                                        <div className="action-description">Report a new fault issue</div>
                                        <div className="action-badge">New</div>
                                    </div>
                                </div>
                                <div className="action-card large" onClick={() => window.open('https://t.me/uog_computer_lab_bot', '_blank')}>
                                    <div className="action-icon">📱</div>
                                    <div className="action-content">
                                        <div className="action-title">Telegram Bot</div>
                                        <div className="action-description">Access the lab support bot</div>
                                        <div className="action-badge">Chat</div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Recent Tickets */}
                        <Card title="Recent Maintenance Tickets" className="tickets-card">
                            {recentTickets.length === 0 ? (
                                <div className="empty-state">No recent tickets</div>
                            ) : (
                                <table className="tickets-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Lab</th>
                                            <th>Severity</th>
                                            <th>Status</th>
                                            <th>Reported By</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTickets.map((ticket) => (
                                            <tr key={ticket.id}>
                                                <td>{ticket.title}</td>
                                                <td>{ticket.lab}</td>
                                                <td>
                                                    <span className="severity-badge" style={{ backgroundColor: getSeverityColor(ticket.severity) }}>
                                                        {ticket.severity}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="status-badge" style={{ backgroundColor: getStatusColor(ticket.status) }}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td>{ticket.reportedBy}</td>
                                                <td>{ticket.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </Card>

                        {/* Recent Approved Student Bookings */}
                        <Card title="Active Approved Student Bookings" className="bookings-card">
                            {recentBookings.length === 0 ? (
                                <div className="empty-state">No student bookings confirmed for today</div>
                            ) : (
                                <table className="tickets-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Lab / Room</th>
                                            <th>PC #</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentBookings.filter(b => b.status === 'confirmed').map((booking) => (
                                            <tr key={booking._id}>
                                                <td>{booking.user?.name}</td>
                                                <td>{booking.lab?.name} - {booking.workstation?.roomName || 'Main'}</td>
                                                <td>{booking.workstation?.workstationNumber || 'N/A'}</td>
                                                <td>{booking.startTime} - {booking.endTime}</td>
                                                <td>
                                                    <span className="status-badge" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </Card>

                        {/* Today's Schedule */}
                        <Card title="Today's Lab Schedule" className="schedule-card">
                            {todaySchedule.length === 0 ? (
                                <div className="empty-state">No classes scheduled for today</div>
                            ) : (
                                <div className="schedule-list">
                                    {todaySchedule.map((session, idx) => (
                                        <div key={idx} className="schedule-item">
                                            <div className="schedule-time">{session.startTime} - {session.endTime}</div>
                                            <div className="schedule-info">
                                                <div className="schedule-course">{session.courseName}</div>
                                                <div className="schedule-lab">{session.lab?.name}</div>
                                            </div>
                                            <div className="schedule-students">{session.numberOfStudents} students</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TechnicianDashboard;