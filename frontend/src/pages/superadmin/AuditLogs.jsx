import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { superadminService } from '../../services/superadminService';
import './AuditLogs.css';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actions, setActions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [filters, setFilters] = useState({
        search: '',
        action: '',
        resource: '',
        startDate: '',
        endDate: ''
    });

    const fetchLogs = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError('');

            const params = { page, limit: pagination.limit };
            if (filters.search) params.search = filters.search;
            if (filters.action) params.action = filters.action;
            if (filters.resource) params.resource = filters.resource;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const data = await superadminService.getAuditLogs(params);
            setLogs(data.logs || []);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            setError('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit]);

    const fetchActions = useCallback(async () => {
        try {
            const data = await superadminService.getAuditLogActions();
            setActions(data.actions || []);
        } catch (err) {
            console.error('Error fetching actions:', err);
        }
    }, []);

    useEffect(() => {
        fetchLogs(1);
        fetchActions();
    }, [fetchLogs, fetchActions]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        fetchLogs(1);
    };

    const handleClearFilters = () => {
        setFilters({ search: '', action: '', resource: '', startDate: '', endDate: '' });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchLogs(newPage);
        }
    };

    const formatTimestamp = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatAction = (action) => {
        if (!action) return 'N/A';
        const parts = action.split('.');
        const category = parts[0]?.charAt(0).toUpperCase() + parts[0]?.slice(1);
        const verb = parts[1]?.replace('_', ' ') || '';
        return `${category} - ${verb.charAt(0).toUpperCase() + verb.slice(1)}`;
    };

    const getActionBadgeClass = (action) => {
        if (!action) return '';
        if (action.includes('delete') || action.includes('reject')) return 'action-danger';
        if (action.includes('create') || action.includes('approve')) return 'action-success';
        if (action.includes('update') || action.includes('change')) return 'action-warning';
        if (action.includes('login') || action.includes('logout')) return 'action-info';
        return '';
    };

    const columns = [
        {
            accessor: 'createdAt',
            header: 'Timestamp',
            render: (row) => (
                <span className="timestamp">{formatTimestamp(row.createdAt)}</span>
            )
        },
        {
            accessor: 'user',
            header: 'User',
            render: (row) => (
                <div className="user-cell">
                    <strong>{row.user?.name || 'Unknown'}</strong>
                    {row.user?.role && (
                        <span className="role-badge">{row.user.role}</span>
                    )}
                </div>
            )
        },
        {
            accessor: 'action',
            header: 'Action',
            render: (row) => (
                <span className={`action-badge ${getActionBadgeClass(row.action)}`}>
                    {formatAction(row.action)}
                </span>
            )
        },
        {
            accessor: 'resource',
            header: 'Resource',
            render: (row) => (
                <div className="resource-cell">
                    <span className="resource-type">{row.resource}</span>
                    {row.details && (
                        <span className="resource-details">{row.details.substring(0, 60)}{row.details.length > 60 ? '...' : ''}</span>
                    )}
                </div>
            )
        },
        {
            accessor: 'ipAddress',
            header: 'IP Address',
            render: (row) => row.ipAddress || 'N/A'
        }
    ];

    if (loading && logs.length === 0) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="audit-logs">
                <div className="page-header">
                    <div className="header-content">
                        <h1>System Audit Logs</h1>
                        <p>Security and activity history across the system</p>
                    </div>
                    <div className="header-stats">
                        <span className="stat-item">
                            <strong>{pagination.total}</strong> total logs
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <Card className="filter-card">
                    <div className="filters">
                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Search</label>
                                <input
                                    type="text"
                                    name="search"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    placeholder="Search in details or action..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Action Type</label>
                                <select name="action" value={filters.action} onChange={handleFilterChange}>
                                    <option value="">All Actions</option>
                                    {actions.map(action => (
                                        <option key={action} value={action}>{formatAction(action)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Resource</label>
                                <select name="resource" value={filters.resource} onChange={handleFilterChange}>
                                    <option value="">All Resources</option>
                                    <option value="User">User</option>
                                    <option value="Lab">Lab</option>
                                    <option value="Booking">Booking</option>
                                    <option value="Reservation">Reservation</option>
                                    <option value="Fault">Fault</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Campus">Campus</option>
                                    <option value="Config">Config</option>
                                    <option value="Material">Material</option>
                                    <option value="Attendance">Attendance</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="filter-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className="filter-actions">
                                <Button variant="primary" onClick={handleSearch}>Search</Button>
                                <Button variant="secondary" onClick={handleClearFilters}>Clear</Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="logs-card">
                    {loading ? (
                        <LoadingSpinner />
                    ) : logs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">{'\u{1F4CB}'}</div>
                            <h3>No Audit Logs Found</h3>
                            <p>No logs match your current filters. Try adjusting your search criteria.</p>
                        </div>
                    ) : (
                        <>
                            <Table columns={columns} data={logs} />

                            <div className="pagination">
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                >
                                    Previous
                                </Button>
                                <span className="page-info">
                                    Page {pagination.page} of {pagination.pages} ({pagination.total} records)
                                </span>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.pages}
                                >
                                    Next
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AuditLogs;
