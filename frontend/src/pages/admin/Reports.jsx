import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { reportService } from '../../services/reportService';
import api from '../../services/api';
import './Reports.css';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dashboardData, setDashboardData] = useState(null);
    const [bookingReports, setBookingReports] = useState(null);
    const [equipmentReports, setEquipmentReports] = useState(null);
    const [maintenanceReports, setMaintenanceReports] = useState(null);
    const [allReceivedReports, setAllReceivedReports] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedReport, setSelectedReport] = useState('overview');
    const [targetGroup, setTargetGroup] = useState('student');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [submittingReport, setSubmittingReport] = useState(false);
    const [staffPerformance, setStaffPerformance] = useState(null);
    const [maintenanceReminders, setMaintenanceReminders] = useState(null);
    const [performanceRole, setPerformanceRole] = useState('teacher');
    const [reportFormData, setReportFormData] = useState({
        title: '',
        type: 'general',
        message: '',
        includeStats: true,
        priority: 'normal'
    });

    const getDateRange = useCallback((period) => {
        const end = new Date();
        const start = new Date();
        switch (period) {
            case 'week': start.setDate(start.getDate() - 7); break;
            case 'month': start.setMonth(start.getMonth() - 1); break;
            case 'quarter': start.setMonth(start.getMonth() - 3); break;
            case 'year': start.setFullYear(start.getFullYear() - 1); break;
            default: start.setMonth(start.getMonth() - 1);
        }
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    }, []);

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const dateRange = getDateRange(selectedPeriod);

            const [dashboard, bookings, equipment, maintenance, faults, performance, reminders] = await Promise.allSettled([
                reportService.getDashboard(),
                reportService.getBookingReports(dateRange),
                reportService.getEquipmentReports(),
                reportService.getMaintenanceReports(dateRange),
                api.get('/maintenance/faults'),
                reportService.getStaffPerformance({ role: performanceRole }),
                reportService.getMaintenanceReminders()
            ]);

            if (dashboard.status === 'fulfilled') setDashboardData(dashboard.value);
            if (bookings.status === 'fulfilled') setBookingReports(bookings.value);
            if (equipment.status === 'fulfilled') setEquipmentReports(equipment.value);
            if (maintenance.status === 'fulfilled') setMaintenanceReports(maintenance.value);
            if (faults.status === 'fulfilled') setAllReceivedReports(faults.value.data.faults || []);
            if (performance.status === 'fulfilled') setStaffPerformance(performance.value.performance);
            if (reminders.status === 'fulfilled') setMaintenanceReminders(reminders.value.reminders);

            if (dashboard.status === 'rejected' && bookings.status === 'rejected') {
                setError('Failed to load report data');
            }
        } catch (err) {
            console.error('Error fetching report data:', err);
            setError('Failed to load report data');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, getDateRange, performanceRole]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handleExport = async (format) => {
        try {
            const dateRange = getDateRange(selectedPeriod);
            const reportType = selectedReport === 'overview' ? 'bookings' : selectedReport === 'incoming' ? 'faults' : selectedReport;

            if (format === 'csv') {
                await reportService.exportCSV(reportType, dateRange);
            } else if (format === 'pdf') {
                await reportService.exportPDF(reportType, dateRange);
            }
        } catch (err) {
            console.error(`Export ${format} error:`, err);
            setError(`Failed to export ${format.toUpperCase()}. Please try again.`);
        }
    };

    const handleGenerateGroupReport = () => {
        setShowGenerateModal(true);
    };

    const handleReportInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setReportFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        setSubmittingReport(true);
        try {
            const result = await reportService.generateAndSendReport({
                title: reportFormData.title,
                type: reportFormData.type,
                message: reportFormData.message,
                includeStats: reportFormData.includeStats,
                priority: reportFormData.priority,
                targetRole: targetGroup
            });

            alert(`Successfully generated and sent "${reportFormData.title}" report to ${result.recipientCount || 'all'} ${targetGroup}(s).`);
            setShowGenerateModal(false);
            setReportFormData({ title: '', type: 'general', message: '', includeStats: true, priority: 'normal' });
        } catch (err) {
            console.error('Generate report error:', err);
            setError('Failed to generate and send report. Please try again.');
        } finally {
            setSubmittingReport(false);
        }
    };

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="reports">
                <div className="page-header">
                    <div className="header-content">
                        <h1>Reports & Analytics</h1>
                        <p>View system reports and analytics</p>
                    </div>
                    <div className="header-actions">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="period-select"
                        >
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="quarter">Last Quarter</option>
                            <option value="year">Last Year</option>
                        </select>
                        <div className="role-report-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={targetGroup}
                                onChange={(e) => setTargetGroup(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="student">Student Reports</option>
                                <option value="teacher">Teacher Reports</option>
                                <option value="technician">Technician Reports</option>
                                <option value="superadmin">Super Admin Reports</option>
                            </select>
                            <Button variant="primary" onClick={handleGenerateGroupReport}>Generate & Send</Button>
                        </div>
                        <Button variant="secondary" onClick={() => handleExport('pdf')}>Export PDF</Button>
                        <Button variant="secondary" onClick={() => handleExport('csv')}>Export CSV</Button>
                    </div>
                </div>

                {error && (
                    <div className="error-message" style={{ marginBottom: '1rem' }}>
                        {error}
                        <button onClick={fetchReportData} style={{ marginLeft: '1rem', cursor: 'pointer' }}>Retry</button>
                    </div>
                )}

                <div className="report-tabs">
                    <button className={`tab ${selectedReport === 'overview' ? 'active' : ''}`} onClick={() => setSelectedReport('overview')}>Overview</button>
                    <button className={`tab ${selectedReport === 'bookings' ? 'active' : ''}`} onClick={() => setSelectedReport('bookings')}>Bookings</button>
                    <button className={`tab ${selectedReport === 'users' ? 'active' : ''}`} onClick={() => setSelectedReport('users')}>Users</button>
                    <button className={`tab ${selectedReport === 'equipment' ? 'active' : ''}`} onClick={() => setSelectedReport('equipment')}>Equipment</button>
                    <button className={`tab ${selectedReport === 'incoming' ? 'active' : ''}`} onClick={() => setSelectedReport('incoming')}>Received Reports</button>
                    <button className={`tab ${selectedReport === 'staff' ? 'active' : ''}`} onClick={() => setSelectedReport('staff')}>Staff Performance</button>
                    <button className={`tab ${selectedReport === 'reminders' ? 'active' : ''}`} onClick={() => setSelectedReport('reminders')}>Maintenance Reminders</button>
                </div>

                {selectedReport === 'overview' && dashboardData && (
                    <div className="report-content">
                        <div className="stats-grid">
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F4C5}'}</div>
                                <div className="stat-content">
                                    <h3>Total Bookings</h3>
                                    <p className="stat-value">{dashboardData.stats?.totalBookings || 0}</p>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F465}'}</div>
                                <div className="stat-content">
                                    <h3>Active Users</h3>
                                    <p className="stat-value">{dashboardData.stats?.totalUsers || 0}</p>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F4C8}'}</div>
                                <div className="stat-content">
                                    <h3>Pending Faults</h3>
                                    <p className="stat-value">{dashboardData.stats?.pendingFaults || 0}</p>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F4BB}'}</div>
                                <div className="stat-content">
                                    <h3>Total Equipment</h3>
                                    <p className="stat-value">{dashboardData.stats?.totalEquipment || 0}</p>
                                </div>
                            </Card>
                        </div>

                        <div className="charts-row">
                            <Card className="chart-card">
                                <h3>Bookings Trend (Last 7 Days)</h3>
                                <div className="bar-chart">
                                    {dashboardData.trends?.bookings?.map((item, index) => (
                                        <div key={index} className="bar-item">
                                            <div className="bar-label">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                            <div className="bar-container">
                                                <div className="bar-fill" style={{ width: `${Math.max((item.count / Math.max(...(dashboardData.trends?.bookings?.map(b => b.count) || [1]))) * 100, 5)}%` }} />
                                            </div>
                                            <div className="bar-value">{item.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="chart-card">
                                <h3>Users by Role</h3>
                                <div className="pie-chart">
                                    {dashboardData.userRoles?.map((item, index) => {
                                        const total = dashboardData.userRoles.reduce((sum, r) => sum + r.count, 0);
                                        return (
                                            <div key={index} className="pie-item">
                                                <div className="pie-label">{item._id}</div>
                                                <div className="pie-bar">
                                                    <div className="pie-fill" style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
                                                </div>
                                                <div className="pie-value">{item.count}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {selectedReport === 'bookings' && (
                    <div className="report-content">
                        <div className="stats-grid">
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F4C5}'}</div>
                                <div className="stat-content">
                                    <h3>Total Bookings</h3>
                                    <p className="stat-value">{dashboardData?.stats?.totalBookings || 0}</p>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{23F0}'}</div>
                                <div className="stat-content">
                                    <h3>Today's Bookings</h3>
                                    <p className="stat-value">{dashboardData?.stats?.todayBookings || 0}</p>
                                </div>
                            </Card>
                        </div>

                        {bookingReports?.bookings && (
                            <Card className="detail-card">
                                <h3>Recent Bookings ({selectedPeriod})</h3>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Lab</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookingReports.bookings.slice(0, 20).map((booking, index) => (
                                            <tr key={booking._id || index}>
                                                <td>{booking.user?.name || 'N/A'}</td>
                                                <td>{booking.lab?.name || 'N/A'}</td>
                                                <td>{new Date(booking.date).toLocaleDateString()}</td>
                                                <td><span className={`status-badge ${booking.status}`}>{booking.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </div>
                )}

                {selectedReport === 'users' && dashboardData && (
                    <div className="report-content">
                        <div className="stats-grid">
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F465}'}</div>
                                <div className="stat-content">
                                    <h3>Total Users</h3>
                                    <p className="stat-value">{dashboardData.stats?.totalUsers || 0}</p>
                                </div>
                            </Card>
                        </div>

                        <div className="charts-row">
                            <Card className="chart-card">
                                <h3>Users by Role</h3>
                                <div className="pie-chart">
                                    {dashboardData.userRoles?.map((item, index) => {
                                        const total = dashboardData.userRoles.reduce((sum, r) => sum + r.count, 0);
                                        return (
                                            <div key={index} className="pie-item">
                                                <div className="pie-label">{item._id}</div>
                                                <div className="pie-bar">
                                                    <div className="pie-fill" style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
                                                </div>
                                                <div className="pie-value">{item.count} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {selectedReport === 'equipment' && (
                    <div className="report-content">
                        <div className="stats-grid">
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F4BB}'}</div>
                                <div className="stat-content">
                                    <h3>Total Equipment</h3>
                                    <p className="stat-value">{dashboardData?.stats?.totalEquipment || 0}</p>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F527}'}</div>
                                <div className="stat-content">
                                    <h3>In Maintenance</h3>
                                    <p className="stat-value">{dashboardData?.stats?.maintenanceEquipment || 0}</p>
                                </div>
                            </Card>
                        </div>

                        {equipmentReports?.equipment && (
                            <Card className="detail-card">
                                <h3>Equipment List</h3>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Code</th>
                                            <th>Category</th>
                                            <th>Lab</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equipmentReports.equipment.slice(0, 20).map((item, index) => (
                                            <tr key={item._id || index}>
                                                <td>{item.name}</td>
                                                <td>{item.code}</td>
                                                <td>{item.category}</td>
                                                <td>{item.lab?.name || 'N/A'}</td>
                                                <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {maintenanceReports?.faultStats && (
                            <Card className="chart-card">
                                <h3>Fault Statistics</h3>
                                <div className="fault-stats">
                                    {maintenanceReports.faultStats.map((stat, index) => (
                                        <div key={index} className="fault-item">
                                            <span className="fault-label">{stat._id}</span>
                                            <span className="fault-value">{stat.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {selectedReport === 'incoming' && (
                    <div className="report-content">
                        <div className="stats-grid">
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F4E5}'}</div>
                                <div className="stat-content">
                                    <h3>Incoming from Users</h3>
                                    <p className="stat-value">{allReceivedReports.length}</p>
                                </div>
                            </Card>
                        </div>

                        <Card title="Manage All Reports Received">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Reported By</th>
                                        <th>Reporter Role</th>
                                        <th>Lab</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allReceivedReports.map((report, index) => (
                                        <tr key={report._id || index}>
                                            <td><strong>{report.title}</strong></td>
                                            <td>{report.reportedBy?.name || 'Unknown'}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{report.reportedBy?.role || 'N/A'}</td>
                                            <td>{report.lab?.name || 'N/A'}</td>
                                            <td><span className={`status-badge ${report.status}`}>{report.status}</span></td>
                                            <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                )}

                {selectedReport === 'staff' && (
                    <div className="report-content">
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontWeight: '500' }}>View Performance For:</label>
                            <select
                                value={performanceRole}
                                onChange={(e) => setPerformanceRole(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="teacher">Teachers</option>
                                <option value="technician">Technicians</option>
                                <option value="admin">Administrators</option>
                            </select>
                        </div>

                        {performanceRole === 'teacher' && staffPerformance?.teachers && (
                            <Card title="Teacher Performance Metrics">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Department</th>
                                            <th>Total Reservations</th>
                                            <th>Approval Rate</th>
                                            <th>Students Served</th>
                                            <th>Materials Uploaded</th>
                                            <th>Attendance Marked</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffPerformance.teachers.map((teacher, index) => (
                                            <tr key={teacher._id || index}>
                                                <td><strong>{teacher.name}</strong></td>
                                                <td>{teacher.department || 'N/A'}</td>
                                                <td>{teacher.totalReservations}</td>
                                                <td>
                                                    <span className={`status-badge ${teacher.approvalRate >= 80 ? 'confirmed' : teacher.approvalRate >= 50 ? 'pending' : 'rejected'}`}>
                                                        {teacher.approvalRate}%
                                                    </span>
                                                </td>
                                                <td>{teacher.totalStudentsServed}</td>
                                                <td>{teacher.materialsUploaded}</td>
                                                <td>{teacher.attendanceRecordsMarked}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {performanceRole === 'technician' && staffPerformance?.technicians && (
                            <Card title="Technician Performance Metrics">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Total Assigned</th>
                                            <th>Resolved</th>
                                            <th>In Progress</th>
                                            <th>Resolution Rate</th>
                                            <th>Avg Resolution Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffPerformance.technicians.map((tech, index) => (
                                            <tr key={tech._id || index}>
                                                <td><strong>{tech.name}</strong></td>
                                                <td>{tech.totalAssigned}</td>
                                                <td>{tech.resolved}</td>
                                                <td>{tech.inProgress}</td>
                                                <td>
                                                    <span className={`status-badge ${tech.resolutionRate >= 80 ? 'confirmed' : tech.resolutionRate >= 50 ? 'pending' : 'rejected'}`}>
                                                        {tech.resolutionRate}%
                                                    </span>
                                                </td>
                                                <td>{tech.avgResolutionHours}h</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {performanceRole === 'admin' && staffPerformance?.admins && (
                            <Card title="Administrator Performance Metrics">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Bookings Managed</th>
                                            <th>Reservations Approved</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffPerformance.admins.map((admin, index) => (
                                            <tr key={admin._id || index}>
                                                <td><strong>{admin.name}</strong></td>
                                                <td>{admin.email}</td>
                                                <td>{admin.bookingsManaged}</td>
                                                <td>{admin.reservationsApproved}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </div>
                )}

                {selectedReport === 'reminders' && (
                    <div className="report-content">
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{26A0}'}</div>
                                <div className="stat-content">
                                    <h3>Overdue</h3>
                                    <p className="stat-value" style={{ color: '#dc2626' }}>{maintenanceReminders?.summary?.overdueCount || 0}</p>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F4C5}'}</div>
                                <div className="stat-content">
                                    <h3>This Week</h3>
                                    <p className="stat-value" style={{ color: '#f59e0b' }}>{maintenanceReminders?.summary?.thisWeekCount || 0}</p>
                                </div>
                            </Card>
                            <Card className="stat-card">
                                <div className="stat-icon">{'\u{1F4C6}'}</div>
                                <div className="stat-content">
                                    <h3>This Month</h3>
                                    <p className="stat-value" style={{ color: '#3b82f6' }}>{maintenanceReminders?.summary?.thisMonthCount || 0}</p>
                                </div>
                            </Card>
                        </div>

                        {maintenanceReminders?.overdue?.length > 0 && (
                            <Card title="Overdue Maintenance" style={{ marginBottom: '1rem' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Equipment</th>
                                            <th>Lab</th>
                                            <th>Due Date</th>
                                            <th>Days Overdue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {maintenanceReminders.overdue.map((item, index) => (
                                            <tr key={item._id || index} style={{ background: '#fef2f2' }}>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.lab?.name || 'N/A'}</td>
                                                <td>{new Date(item.nextMaintenanceDate).toLocaleDateString()}</td>
                                                <td><span className="status-badge rejected">{item.daysOverdue} days</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {maintenanceReminders?.thisWeek?.length > 0 && (
                            <Card title="Due This Week" style={{ marginBottom: '1rem' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Equipment</th>
                                            <th>Lab</th>
                                            <th>Due Date</th>
                                            <th>Days Until</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {maintenanceReminders.thisWeek.map((item, index) => (
                                            <tr key={item._id || index} style={{ background: '#fffbeb' }}>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.lab?.name || 'N/A'}</td>
                                                <td>{new Date(item.nextMaintenanceDate).toLocaleDateString()}</td>
                                                <td><span className="status-badge pending">{item.daysUntil} days</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {maintenanceReminders?.thisMonth?.length > 0 && (
                            <Card title="Due This Month">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Equipment</th>
                                            <th>Lab</th>
                                            <th>Due Date</th>
                                            <th>Days Until</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {maintenanceReminders.thisMonth.map((item, index) => (
                                            <tr key={item._id || index}>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.lab?.name || 'N/A'}</td>
                                                <td>{new Date(item.nextMaintenanceDate).toLocaleDateString()}</td>
                                                <td>{item.daysUntil} days</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {!maintenanceReminders?.overdue?.length && !maintenanceReminders?.thisWeek?.length && !maintenanceReminders?.thisMonth?.length && (
                            <Card>
                                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No upcoming maintenance reminders. All equipment is up to date.</p>
                            </Card>
                        )}
                    </div>
                )}

                <Modal
                    isOpen={showGenerateModal}
                    onClose={() => setShowGenerateModal(false)}
                    title={`Generate Report for ${targetGroup.charAt(0).toUpperCase() + targetGroup.slice(1)} Group`}
                >
                    <form onSubmit={handleSubmitReport} className="report-generation-form">
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Report Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={reportFormData.title}
                                onChange={handleReportInputChange}
                                required
                                placeholder="e.g., Monthly Lab Status & Fault Summary"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Report Type</label>
                                <select
                                    name="type"
                                    value={reportFormData.type}
                                    onChange={handleReportInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                >
                                    <option value="general">General Overview</option>
                                    <option value="fault">Failure/Fault Analysis</option>
                                    <option value="usage">Lab Utilization</option>
                                    <option value="inventory">Inventory Summary</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Priority</label>
                                <select
                                    name="priority"
                                    value={reportFormData.priority}
                                    onChange={handleReportInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Message Details</label>
                            <textarea
                                name="message"
                                value={reportFormData.message}
                                onChange={handleReportInputChange}
                                rows="4"
                                placeholder="Enter detailed information or summary for the recipients..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input type="checkbox" name="includeStats" checked={reportFormData.includeStats} onChange={handleReportInputChange} />
                                Include system analytics and statistics in the final report
                            </label>
                        </div>
                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button type="button" variant="secondary" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
                            <Button type="submit" variant="primary" loading={submittingReport}>Generate & Send</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default Reports;
