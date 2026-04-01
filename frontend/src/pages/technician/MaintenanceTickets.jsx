import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import './MaintenanceTickets.css';

const MaintenanceTickets = () => {
    const { addToast } = useNotifications();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/maintenance/faults');
            setTickets(response.data.faults || []);
        } catch (err) {
            setError('Failed to fetch tickets');
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (ticketId, newStatus) => {
        try {
            const response = await api.patch(`/maintenance/faults/${ticketId}`, {
                status: newStatus
            });

            if (response.data.success) {
                setSuccessMessage('Ticket status updated successfully');
                addToast({ type: 'success', title: 'Ticket Updated', message: `Ticket status changed to ${newStatus}` });
                fetchTickets();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to update ticket status');
            addToast({ type: 'error', title: 'Update Failed', message: 'Could not update ticket status' });
            console.error('Error updating ticket:', err);
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

    const filteredTickets = filterStatus === 'all'
        ? tickets
        : tickets.filter(t => t.status === filterStatus);

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
            header: 'Reported',
            accessor: 'createdAt',
            render: (row) => new Date(row.createdAt).toLocaleDateString()
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {row.status === 'open' && (
                        <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleStatusUpdate(row._id, 'in-progress')}
                        >
                            Start Work
                        </Button>
                    )}
                    {row.status === 'in-progress' && (
                        <Button
                            variant="success"
                            size="small"
                            onClick={() => handleStatusUpdate(row._id, 'resolved')}
                        >
                            Resolve
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setSelectedTicket(row)}
                    >
                        View
                    </Button>
                </div>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="maintenance-tickets">
                <div className="page-header">
                    <div>
                        <h1>Maintenance Tickets</h1>
                        <p className="page-description">View and manage fault tickets</p>
                    </div>
                    <div className="filter-controls">
                        <label>Filter by Status:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Tickets</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <Card>
                    {loading ? (
                        <div className="loading">Loading tickets...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="empty-state">No tickets found</div>
                    ) : (
                        <Table columns={columns} data={filteredTickets} />
                    )}
                </Card>

                {selectedTicket && (
                    <div className="ticket-modal-overlay" onClick={() => setSelectedTicket(null)}>
                        <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedTicket.title}</h2>
                                <button className="close-btn" onClick={() => setSelectedTicket(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-row">
                                    <strong>Lab:</strong> {selectedTicket.lab?.name || 'N/A'}
                                </div>
                                <div className="detail-row">
                                    <strong>Category:</strong> {selectedTicket.category}
                                </div>
                                <div className="detail-row">
                                    <strong>Severity:</strong> {getSeverityBadge(selectedTicket.severity)}
                                </div>
                                <div className="detail-row">
                                    <strong>Status:</strong> {getStatusBadge(selectedTicket.status)}
                                </div>
                                <div className="detail-row">
                                    <strong>Reported By:</strong> {selectedTicket.reportedBy?.name || 'Unknown'}
                                </div>
                                <div className="detail-row">
                                    <strong>Submitted To:</strong>{' '}
                                    {(() => {
                                        const roleLabels = {
                                            technician: { label: 'Technician', color: '#2563eb', bg: '#dbeafe' },
                                            admin: { label: 'Admin', color: '#7c3aed', bg: '#ede9fe' },
                                            superadmin: { label: 'Super Admin', color: '#dc2626', bg: '#fee2e2' }
                                        };
                                        const info = roleLabels[selectedTicket.submittedTo] || roleLabels.technician;
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
                                    <strong>Description:</strong>
                                    <p>{selectedTicket.description}</p>
                                </div>
                                {selectedTicket.resolution && (
                                    <div className="detail-row">
                                        <strong>Resolution:</strong>
                                        <p>{selectedTicket.resolution}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MaintenanceTickets;
