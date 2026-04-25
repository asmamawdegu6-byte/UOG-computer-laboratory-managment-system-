import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { reportService } from '../../services/reportService';
import './TechnicianManageBooking.css';

const CAMPUS_STYLES = {
    MAR: { primary: '#e91e63', secondary: '#fce4ec', accent: '#c2185b', gradient: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)' },
    ATF: { primary: '#00bcd4', secondary: '#e0f7fa', accent: '#0097a7', gradient: 'linear-gradient(135deg, #00bcd4 0%, #80deea 100%)' },
    HSC: { primary: '#4caf50', secondary: '#e8f5e9', accent: '#388e3c', gradient: 'linear-gradient(135deg, #4caf50 0%, #a5d6a7 100%)' },
    ATW: { primary: '#3949ab', secondary: '#e8eaf6', accent: '#1a237e', gradient: 'linear-gradient(135deg, #3949ab 0%, #5c6bc0 100%)' }
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

const TechnicianManageBooking = () => {
    const navigate = useNavigate();
    const campusCode = getCampusCode();
    const campusStyle = CAMPUS_STYLES[campusCode] || CAMPUS_STYLES.ATW;

    const [stats, setStats] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState('confirmed');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [filterDate, filterStatus]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            const [statsRes, bookingsRes] = await Promise.all([
                reportService.getTechnicianStats(),
                api.get('/bookings', { params: { 
                    date: filterDate, 
                    status: filterStatus !== 'all' ? filterStatus : undefined,
                    limit: 50 
                } })
            ]);

            setStats(statsRes.stats || null);
            setRecentBookings(bookingsRes.data.bookings || []);
        } catch (err) {
            console.error('Error fetching manage booking data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const bookingStats = stats?.bookings || {};
    const computerStats = stats?.computers || {};
    const equipmentStats = stats?.equipment || {};
    const faultStats = stats?.faults || {};

    const handleExport = async (type) => {
        try {
            setExporting(true);
            if (type === 'csv') {
                await reportService.exportCSV('bookings', { date: filterDate, status: filterStatus, search: searchTerm });
            } else {
                await reportService.exportPDF('bookings', { date: filterDate, status: filterStatus, search: searchTerm });
            }
        } catch (err) {
            console.error('Export failed:', err);
            setError('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const handleSendStatusReport = async () => {
        try {
            setExporting(true);
            await reportService.generateAndSendReport({
                title: `Daily Computer Status Report - ${campusCode}`,
                type: 'fault',
                targetRole: 'admin',
                message: `Lab Management Summary for Today:
- Workstations: ${computerStats.available} Available, ${computerStats.maintenance} Maintenance, ${computerStats.broken} Broken.
- Fault Reports: ${faultStats.open || 0} Open Tickets, ${faultStats.inProgress || 0} In Progress.
- Student Usage: ${bookingStats.activeNow || 0} Students currently in labs.`,
                includeStats: true,
                priority: (computerStats.broken > 5 || faultStats.open > 3) ? 'high' : 'normal'
            });
            alert('Status report sent to administration successfully!');
        } catch (err) {
            setError('Failed to send status report');
        } finally {
            setExporting(false);
        }
    };

    const filteredBookings = recentBookings.filter(b => {
        const name = (b.user?.name || '').toLowerCase();
        const id = (b.user?.studentId || '').toLowerCase();
        const email = (b.user?.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || id.includes(search) || email.includes(search);
    });

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            confirmed: '#10b981',
            cancelled: '#ef4444',
            completed: '#3b82f6',
            'no-show': '#6b7280'
        };
        return colors[status] || '#6b7280';
    };

    const getPercentage = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="technician-manage-booking">
                    <div className="loading-spinner">Loading dashboard data...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="technician-manage-booking" style={{ '--campus-primary': campusStyle.primary, '--campus-gradient': campusStyle.gradient }}>
                <div className="page-header-section">
                    <div className="campus-badge" style={{ background: campusStyle.secondary, color: campusStyle.accent }}>
                        Campus: {campusCode}
                    </div>
                    <h1 style={{ color: campusStyle.primary }}>Manage Booking</h1>
                    <p className="page-description">Student usage, computer status &amp; equipment overview</p>
                </div>

                {/* Filters and Export Bar */}
                <div className="management-toolbar">
                    <div className="filter-group">
                        <div className="input-with-label">
                            <label>Usage Date</label>
                            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                        </div>
                        <div className="input-with-label">
                            <label>Booking Status</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">All Statuses</option>
                                <option value="confirmed">Confirmed (Approved)</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="input-with-label">
                            <label>Search Student</label>
                            <input type="text" placeholder="Name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                        </div>
                    </div>
                    <div className="action-group">
                        <button className="btn-report" onClick={handleSendStatusReport} disabled={exporting}>
                            {exporting ? '...' : '📩 Send Status to Admin'}
                        </button>
                        <button className="btn-export csv" onClick={() => handleExport('csv')} disabled={exporting}>
                            {exporting ? '...' : '📄 Export CSV'}
                        </button>
                        <button className="btn-export pdf" onClick={() => handleExport('pdf')} disabled={exporting}>
                            {exporting ? '...' : '📕 Export PDF'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        {error}
                        <button onClick={fetchData} className="retry-btn">Retry</button>
                    </div>
                )}

                {/* Booking & Fault Stats */}
                <div className="stats-section">
                    <h2 className="section-title">Summary Overview</h2>
                    <div className="stats-grid">
                        <Card className="stat-card booking-today">
                            <div className="stat-icon">📅</div>
                            <div className="stat-value">{bookingStats.today || 0}</div>
                            <div className="stat-label">Today&apos;s Bookings</div>
                        </Card>
                        <Card className="stat-card booking-active">
                            <div className="stat-icon">▶️</div>
                            <div className="stat-value">{bookingStats.activeNow || 0}</div>
                            <div className="stat-label">Active Now</div>
                        </Card>
                        <Card className="stat-card fault-summary">
                            <div className="stat-icon">⚠️</div>
                            <div className="stat-value">{faultStats.open || 0}</div>
                            <div className="stat-label">Open Faults</div>
                        </Card>
                        <Card className="stat-card fault-progress">
                            <div className="stat-icon">🔧</div>
                            <div className="stat-value">{faultStats.inProgress || 0}</div>
                            <div className="stat-label">In Progress</div>
                        </Card>
                    </div>
                </div>

                {/* Computer / Workstation Status */}
                <div className="stats-section">
                    <h2 className="section-title">Computer Status</h2>
                    <div className="stats-grid">
                        <Card className="stat-card computer-total">
                            <div className="stat-icon">🖥️</div>
                            <div className="stat-value">{computerStats.total || 0}</div>
                            <div className="stat-label">Total Computers</div>
                        </Card>
                        <Card className="stat-card computer-available">
                            <div className="stat-icon">✅</div>
                            <div className="stat-value">{computerStats.available || 0}</div>
                            <div className="stat-label">Available</div>
                        </Card>
                        <Card className="stat-card computer-maintenance">
                            <div className="stat-icon">🔧</div>
                            <div className="stat-value">{computerStats.maintenance || 0}</div>
                            <div className="stat-label">Maintenance</div>
                        </Card>
                        <Card className="stat-card computer-broken">
                            <div className="stat-icon">❌</div>
                            <div className="stat-value">{computerStats.broken || 0}</div>
                            <div className="stat-label">Broken</div>
                        </Card>
                    </div>

                    {/* Health Progress Bars */}
                    <div className="progress-section">
                        <div className="progress-item">
                            <span className="progress-label">Available Capacity</span>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill available" style={{ width: `${getPercentage(computerStats.available, computerStats.total)}%` }}></div>
                            </div>
                            <span className="progress-percent">{getPercentage(computerStats.available, computerStats.total)}%</span>
                        </div>
                        <div className="progress-item">
                            <span className="progress-label">Under Maintenance</span>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill maintenance" style={{ width: `${getPercentage(computerStats.maintenance, computerStats.total)}%` }}></div>
                            </div>
                            <span className="progress-percent">{getPercentage(computerStats.maintenance, computerStats.total)}%</span>
                        </div>
                    </div>
                </div>

                {/* Equipment Overview */}
                <div className="stats-section">
                    <h2 className="section-title">Equipment Health</h2>
                    <div className="stats-grid compact">
                        <Card className="stat-card">
                            <div className="stat-value">{equipmentStats.total || 0}</div>
                            <div className="stat-label">Total Items</div>
                        </Card>
                        <Card className="stat-card">
                            <div className="stat-value">{equipmentStats.broken || 0}</div>
                            <div className="stat-label">Broken Equipment</div>
                        </Card>
                    </div>
                </div>

                {/* Recent Bookings Table */}
                <Card title={`Student Bookings for ${new Date(filterDate).toLocaleDateString()}`} className="recent-bookings-card">
                    {filteredBookings.length === 0 ? (
                        <div className="empty-state">No bookings found for the selected filters</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="bookings-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Student ID</th>
                                        <th>Lab</th>
                                        <th>Room</th>
                                        <th>PC #</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Purpose</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((b) => (
                                        <tr key={b._id}>
                                            <td>{b.user?.name || 'Unknown'}</td>
                                            <td>{b.user?.studentId || 'N/A'}</td>
                                            <td>{b.lab?.name || 'N/A'}</td>
                                            <td>{b.workstation?.roomName || 'N/A'}</td>
                                            <td>{b.workstation?.workstationNumber || 'N/A'}</td>
                                            <td>{new Date(b.date).toLocaleDateString()}</td>
                                            <td>{b.startTime} - {b.endTime}</td>
                                            <td>{b.purpose || 'N/A'}</td>
                                            <td>
                                                <span className="status-pill" style={{ backgroundColor: getStatusColor(b.status), color: '#fff' }}>
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Quick Actions */}
                <div className="stats-section">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="quick-actions-grid">
                        <div className="action-card" onClick={() => navigate('/technician/tickets')}>
                            <div className="action-icon">🎫</div>
                            <div className="action-title">Maintenance Request Register</div>
                            <div className="action-desc">Manage maintenance tickets</div>
                        </div>
                        <div className="action-card" onClick={() => navigate('/technician/computer-check')}>
                            <div className="action-icon">🖱️</div>
                            <div className="action-title">PC Check</div>
                            <div className="action-desc">Manual status updates</div>
                        </div>
                        <div className="action-card" onClick={() => navigate('/technician/inventory')}>
                            <div className="action-icon">📦</div>
                            <div className="action-title">Inventory</div>
                            <div className="action-desc">Update hardware records</div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TechnicianManageBooking;
