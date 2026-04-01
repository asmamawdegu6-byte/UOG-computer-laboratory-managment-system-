import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './MaintenanceLog.css';

const MaintenanceLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/maintenance/faults');
            setLogs(response.data.faults || []);
        } catch (err) {
            setError('Failed to fetch maintenance logs');
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (severity) => {
        const severityColors = {
            low: { bg: '#f3f4f6', color: '#374151' },
            medium: { bg: '#fef3c7', color: '#92400e' },
            high: { bg: '#fee2e2', color: '#991b1b' },
            critical: { bg: '#dc2626', color: '#ffffff' }
        };

        const colors = severityColors[severity] || severityColors.medium;

        return (
            <span
                style={{
                    backgroundColor: colors.bg,
                    color: colors.color,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                }}
            >
                {severity}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            open: { bg: '#fef3c7', color: '#92400e' },
            'in-progress': { bg: '#dbeafe', color: '#1e40af' },
            resolved: { bg: '#d1fae5', color: '#065f46' },
            closed: { bg: '#f3f4f6', color: '#374151' }
        };

        const colors = statusColors[status] || statusColors.open;

        return (
            <span
                style={{
                    backgroundColor: colors.bg,
                    color: colors.color,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                }}
            >
                {status}
            </span>
        );
    };

    const filteredLogs = filterStatus === 'all'
        ? logs
        : logs.filter(l => l.status === filterStatus);

    const columns = [
        {
            header: 'Title',
            accessor: 'title'
        },
        {
            header: 'Lab',
            accessor: 'lab.name',
            render: (row) => row.lab?.name || 'N/A'
        },
        {
            header: 'Category',
            accessor: 'category',
            render: (row) => (
                <span style={{ textTransform: 'capitalize' }}>{row.category}</span>
            )
        },
        {
            header: 'Severity',
            accessor: 'severity',
            render: (row) => getSeverityBadge(row.severity)
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            header: 'Reported By',
            accessor: 'reportedBy.name',
            render: (row) => row.reportedBy?.name || 'Unknown'
        },
        {
            header: 'Reported Date',
            accessor: 'createdAt',
            render: (row) => new Date(row.createdAt).toLocaleDateString()
        },
        {
            header: 'Resolved Date',
            accessor: 'resolvedAt',
            render: (row) => row.resolvedAt
                ? new Date(row.resolvedAt).toLocaleDateString()
                : '-'
        }
    ];

    return (
        <DashboardLayout>
            <div className="maintenance-log">
                <div className="page-header">
                    <div>
                        <h1>Maintenance Log</h1>
                        <p className="page-description">View maintenance history and resolved issues</p>
                    </div>
                    <div className="filter-controls">
                        <label>Filter by Status:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Logs</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <Card>
                    {loading ? (
                        <div className="loading">Loading maintenance logs...</div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="empty-state">No maintenance logs found</div>
                    ) : (
                        <Table columns={columns} data={filteredLogs} />
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default MaintenanceLog;
