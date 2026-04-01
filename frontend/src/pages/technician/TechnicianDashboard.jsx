import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './TechnicianDashboard.css';

const TechnicianDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([
        { label: 'Open Tickets', value: 0, icon: '🔧' },
        { label: 'In Progress', value: 0, icon: '⚙️' },
        { label: 'Resolved Today', value: 0, icon: '✅' },
        { label: 'Equipment Issues', value: 0, icon: '💻' }
    ]);
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [faultsRes, equipmentRes] = await Promise.all([
                api.get('/maintenance/faults'),
                api.get('/maintenance/equipment')
            ]);

            const faults = faultsRes.data.faults || [];
            const equipment = equipmentRes.data.equipment || [];

            // Calculate stats
            const openTickets = faults.filter(f => f.status === 'open').length;
            const inProgress = faults.filter(f => f.status === 'in-progress').length;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const resolvedToday = faults.filter(f =>
                f.status === 'resolved' &&
                new Date(f.resolvedAt) >= today
            ).length;
            const equipmentIssues = equipment.filter(e => e.status === 'maintenance' || e.status === 'broken').length;

            setStats([
                { label: 'Open Tickets', value: openTickets, icon: '🔧' },
                { label: 'In Progress', value: inProgress, icon: '⚙️' },
                { label: 'Resolved Today', value: resolvedToday, icon: '✅' },
                { label: 'Equipment Issues', value: equipmentIssues, icon: '💻' }
            ]);

            // Get recent tickets (last 5)
            const recent = faults
                .slice(0, 5)
                .map(f => ({
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
            <div className="technician-dashboard">
                <h1>Technician Dashboard</h1>
                <p className="welcome-text">Manage maintenance tickets and equipment status.</p>

                {loading ? (
                    <div className="loading">Loading dashboard data...</div>
                ) : (
                    <>
                        <div className="stats-grid">
                            {stats.map((stat, index) => (
                                <Card key={index} className="stat-card">
                                    <div className="stat-icon">{stat.icon}</div>
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </Card>
                            ))}
                        </div>

                        <Card title="Quick Actions" className="actions-card">
                            <div className="quick-actions">
                                <div className="action-card" onClick={() => navigate('/technician/tickets')}>
                                    <div className="action-icon">🎫</div>
                                    <div className="action-title">Maintenance Tickets</div>
                                    <div className="action-description">View and update fault tickets</div>
                                </div>
                                <div className="action-card" onClick={() => navigate('/technician/equipment')}>
                                    <div className="action-icon">💻</div>
                                    <div className="action-title">Equipment Status</div>
                                    <div className="action-description">Monitor equipment health</div>
                                </div>
                                <div className="action-card" onClick={() => navigate('/technician/inventory')}>
                                    <div className="action-icon">📦</div>
                                    <div className="action-title">Inventory Management</div>
                                    <div className="action-description">Manage lab inventory</div>
                                </div>
                                <div className="action-card" onClick={() => navigate('/technician/maintenance-log')}>
                                    <div className="action-icon">📋</div>
                                    <div className="action-title">Maintenance Log</div>
                                    <div className="action-description">View maintenance history</div>
                                </div>
                                <div className="action-card" onClick={() => navigate('/technician/update-repair')}>
                                    <div className="action-icon">🔧</div>
                                    <div className="action-title">Update Repair Status</div>
                                    <div className="action-description">Update repair progress</div>
                                </div>
                            </div>
                        </Card>

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
                                                    <span
                                                        className="severity-badge"
                                                        style={{ backgroundColor: getSeverityColor(ticket.severity) }}
                                                    >
                                                        {ticket.severity}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="status-badge"
                                                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                                                    >
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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TechnicianDashboard;
