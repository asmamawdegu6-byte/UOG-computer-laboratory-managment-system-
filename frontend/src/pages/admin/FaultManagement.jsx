import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import './FaultManagement.css';

const FaultManagement = () => {
    const { addToast } = useNotifications();
    const [faults, setFaults] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedFault, setSelectedFault] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [summary, setSummary] = useState({ open: 0, inProgress: 0, resolved: 0 });

    useEffect(() => {
        fetchFaults();
        fetchTechnicians();
    }, []);

    const fetchFaults = async () => {
        try {
            setLoading(true);
            const response = await api.get('/maintenance/faults');
            setFaults(response.data.faults || []);
            if (response.data.summary) {
                setSummary(response.data.summary);
            }
        } catch (err) {
            setError('Failed to fetch fault reports');
            console.error('Error fetching faults:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const response = await api.get('/users');
            const techs = (response.data.users || []).filter(
                u => u.role === 'technician' || u.role === 'admin' || u.role === 'superadmin'
            );
            setUsers(techs);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleStatusUpdate = async (faultId, newStatus) => {
        try {
            const response = await api.patch(`/maintenance/faults/${faultId}`, {
                status: newStatus
            });

            if (response.data.success) {
                setSuccessMessage('Fault status updated successfully');
                addToast({ type: 'success', title: 'Status Updated', message: `Fault status changed to ${newStatus}` });
                fetchFaults();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to update fault status');
            addToast({ type: 'error', title: 'Update Failed', message: 'Could not update fault status' });
            console.error('Error updating fault:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleAssign = async (faultId, userId) => {
        try {
            const response = await api.patch(`/maintenance/faults/${faultId}`, {
                assignedTo: userId,
                status: 'in-progress'
            });

            if (response.data.success) {
                setSuccessMessage('Fault assigned successfully');
                addToast({ type: 'success', title: 'Fault Assigned', message: 'The fault has been assigned successfully' });
                fetchFaults();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to assign fault');
            addToast({ type: 'error', title: 'Assignment Failed', message: 'Could not assign the fault' });
            console.error('Error assigning fault:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleResolve = async (faultId) => {
        try {
            const response = await api.patch(`/maintenance/faults/${faultId}`, {
                status: 'resolved'
            });

            if (response.data.success) {
                setSuccessMessage('Fault resolved successfully');
                fetchFaults();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to resolve fault');
            console.error('Error resolving fault:', err);
            setTimeout(() => setError(''), 3000);
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

    const filteredFaults = faults.filter(f => {
        const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
        const matchesSeverity = filterSeverity === 'all' || f.severity === filterSeverity;
        return matchesStatus && matchesSeverity;
    });

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
            render: (row) => (
                <div className="reporter-info">
                    <div style={{ fontWeight: '500' }}>{row.reportedBy?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>
                        {row.reportedBy?.role || 'N/A'}
                    </div>
                </div>
            )
        },
        {
            header: 'Submitted To',
            accessor: 'submittedTo',
            render: (row) => {
                const roleLabels = {
                    technician: { label: 'Technician', color: '#2563eb', bg: '#dbeafe' },
                    admin: { label: 'Admin', color: '#7c3aed', bg: '#ede9fe' },
                    superadmin: { label: 'Super Admin', color: '#dc2626', bg: '#fee2e2' }
                };
                const info = roleLabels[row.submittedTo] || roleLabels.technician;
                return (
                    <span
                        style={{
                            backgroundColor: info.bg,
                            color: info.color,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                        }}
                    >
                        {info.label}
                    </span>
                );
            }
        },
        {
            header: 'Assigned To',
            accessor: 'assignedTo.name',
            render: (row) => row.assignedTo?.name || <span style={{ color: '#9ca3af' }}>Unassigned</span>
        },
        {
            header: 'Date',
            accessor: 'createdAt',
            render: (row) => new Date(row.createdAt).toLocaleDateString()
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {row.status === 'open' && (
                        <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleStatusUpdate(row._id, 'in-progress')}
                        >
                            Start
                        </Button>
                    )}
                    {(row.status === 'open' || row.status === 'in-progress') && (
                        <select
                            onChange={(e) => e.target.value && handleAssign(row._id, e.target.value)}
                            value=""
                            style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #d1d5db',
                                fontSize: '0.75rem'
                            }}
                        >
                            <option value="">Assign to...</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    )}
                    {(row.status === 'in-progress') && (
                        <Button
                            variant="success"
                            size="small"
                            onClick={() => handleResolve(row._id)}
                        >
                            Resolve
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setSelectedFault(row)}
                    >
                        View
                    </Button>
                </div>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="fault-management">
                <div className="page-header">
                    <div>
                        <h1>Fault Management</h1>
                        <p className="page-description">View, assign, and manage all fault reports</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="summary-cards">
                    <div className="summary-card open">
                        <div className="summary-count">{summary.open}</div>
                        <div className="summary-label">Open Faults</div>
                    </div>
                    <div className="summary-card in-progress">
                        <div className="summary-count">{summary.inProgress}</div>
                        <div className="summary-label">In Progress</div>
                    </div>
                    <div className="summary-card resolved">
                        <div className="summary-count">{summary.resolved}</div>
                        <div className="summary-label">Resolved</div>
                    </div>
                    <div className="summary-card total">
                        <div className="summary-count">{faults.length}</div>
                        <div className="summary-label">Total Faults</div>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                {/* Filters */}
                <Card className="filters-card">
                    <div className="filter-controls">
                        <div className="filter-group">
                            <label>Status:</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Severity:</label>
                            <select
                                value={filterSeverity}
                                onChange={(e) => setFilterSeverity(e.target.value)}
                            >
                                <option value="all">All Severities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Faults Table */}
                <Card title="All Fault Reports">
                    {loading ? (
                        <div className="loading">Loading fault reports...</div>
                    ) : filteredFaults.length === 0 ? (
                        <div className="empty-state">
                            <p>No fault reports found.</p>
                        </div>
                    ) : (
                        <Table columns={columns} data={filteredFaults} />
                    )}
                </Card>

                {/* Fault Detail Modal */}
                {selectedFault && (
                    <div className="fault-modal-overlay" onClick={() => setSelectedFault(null)}>
                        <div className="fault-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedFault.title}</h2>
                                <button className="close-btn" onClick={() => setSelectedFault(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-row">
                                    <strong>Lab:</strong> {selectedFault.lab?.name || 'N/A'}
                                </div>
                                <div className="detail-row">
                                    <strong>Workstation:</strong> {selectedFault.workstation || 'N/A'}
                                </div>
                                <div className="detail-row">
                                    <strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedFault.category}</span>
                                </div>
                                <div className="detail-row">
                                    <strong>Severity:</strong> {getSeverityBadge(selectedFault.severity)}
                                </div>
                                <div className="detail-row">
                                    <strong>Status:</strong> {getStatusBadge(selectedFault.status)}
                                </div>
                                <div className="detail-row">
                                    <strong>Reported By:</strong> {selectedFault.reportedBy?.name || 'Unknown'}
                                </div>
                                <div className="detail-row">
                                    <strong>Submitted To:</strong>{' '}
                                    {(() => {
                                        const roleLabels = {
                                            technician: { label: 'Technician', color: '#2563eb', bg: '#dbeafe' },
                                            admin: { label: 'Admin', color: '#7c3aed', bg: '#ede9fe' },
                                            superadmin: { label: 'Super Admin', color: '#dc2626', bg: '#fee2e2' }
                                        };
                                        const info = roleLabels[selectedFault.submittedTo] || roleLabels.technician;
                                        return (
                                            <span
                                                style={{
                                                    backgroundColor: info.bg,
                                                    color: info.color,
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {info.label}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="detail-row">
                                    <strong>Assigned To:</strong> {selectedFault.assignedTo?.name || 'Unassigned'}
                                </div>
                                <div className="detail-row">
                                    <strong>Reported:</strong> {new Date(selectedFault.createdAt).toLocaleString()}
                                </div>
                                <div className="detail-row">
                                    <strong>Description:</strong>
                                    <p>{selectedFault.description}</p>
                                </div>
                                {selectedFault.resolution && (
                                    <div className="detail-row">
                                        <strong>Resolution:</strong>
                                        <p>{selectedFault.resolution}</p>
                                    </div>
                                )}
                                {selectedFault.resolvedAt && (
                                    <div className="detail-row">
                                        <strong>Resolved:</strong> {new Date(selectedFault.resolvedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                {selectedFault.status === 'open' && (
                                    <Button
                                        variant="primary"
                                        onClick={() => { handleStatusUpdate(selectedFault._id, 'in-progress'); setSelectedFault(null); }}
                                    >
                                        Start Work
                                    </Button>
                                )}
                                {selectedFault.status === 'in-progress' && (
                                    <Button
                                        variant="success"
                                        onClick={() => { handleResolve(selectedFault._id); setSelectedFault(null); }}
                                    >
                                        Mark Resolved
                                    </Button>
                                )}
                                <Button variant="secondary" onClick={() => setSelectedFault(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default FaultManagement;
