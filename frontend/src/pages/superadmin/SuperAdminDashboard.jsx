import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import { reportService } from '../../services/reportService';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState({
        totalCampuses: 4,
        globalUsers: 0,
        systemHealth: 'Optimal',
        activeAdmins: 0
    });

    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const data = await reportService.getDashboard();
                setStats(prev => ({
                    ...prev,
                    globalUsers: data.stats?.totalUsers || 0,
                    activeAdmins: data.userRoles?.find(r => r._id === 'admin')?.count || 0
                }));
            } catch (err) {
                console.error('Failed to fetch global stats');
            }
        };
        fetchGlobalStats();
    }, []);

    const quickActions = [
        { label: 'Campus Management', path: '/superadmin/campuses', icon: '🏢', color: '#1a237e' },
        { label: 'Role Management', path: '/admin/users', icon: '🔑', color: '#4a148c' },
        { label: 'Audit Logs', path: '/superadmin/audit', icon: '📜', color: '#004d40' },
        { label: 'System Config', path: '/superadmin/config', icon: '⚙️', color: '#bf360c' }
    ];

    return (
        <DashboardLayout>
            <div className="superadmin-dashboard">
                <div className="dashboard-header">
                    <h1>Super Admin Control Center</h1>
                    <p>Global System Oversight & Infrastructure Management</p>
                </div>

                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-label">University Campuses</div>
                        <div className="stat-value">4</div>
                        <div className="stat-sub">Maraki, Tewodros, Fasil, GC</div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-label">Global User Base</div>
                        <div className="stat-value">{stats.globalUsers}</div>
                        <div className="stat-sub">Across all campuses</div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-label">System Admins</div>
                        <div className="stat-value">{stats.activeAdmins}</div>
                        <div className="stat-sub">Privileged Access Users</div>
                    </Card>
                    <Card className="stat-card">
                        <div className="stat-label">System Status</div>
                        <div className="stat-value" style={{ color: '#2e7d32' }}>{stats.systemHealth}</div>
                        <div className="stat-sub">All services operational</div>
                    </Card>
                </div>

                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                    {quickActions.map(action => (
                        <Link key={action.label} to={action.path} className="action-tile" style={{ borderTop: `4px solid ${action.color}` }}>
                            <span className="action-icon">{action.icon}</span>
                            <span className="action-label">{action.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="dashboard-sections">
                    <Card title="Campus Performance Overview">
                        <div className="campus-list">
                            {['Maraki', 'Atse Tewodros', 'Atse Fasil', 'Health Science College (GC)'].map(campus => (
                                <div key={campus} className="campus-row">
                                    <span>{campus}</span>
                                    <span className="status-dot online">Active</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SuperAdminDashboard;