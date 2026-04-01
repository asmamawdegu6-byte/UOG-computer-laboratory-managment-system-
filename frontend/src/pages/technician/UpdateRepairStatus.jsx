import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './UpdateRepairStatus.css';

const UpdateRepairStatus = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [resolution, setResolution] = useState('');

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
                status: newStatus,
                resolution: resolution
            });

            if (response.data.success) {
                setSuccessMessage('Ticket status updated successfully');
                setSelectedTicket(null);
                setResolution('');
                fetchTickets();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to update ticket status');
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
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {row.status === 'open' && (
                        <Button
                            variant="primary"
                            size="small"
                            onClick={() => setSelectedTicket(row)}
                        >
                            Start Repair
                        </Button>
                    )}
                    {row.status === 'in-progress' && (
                        <Button
                            variant="success"
                            size="small"
                            onClick={() => setSelectedTicket(row)}
                        >
                            Complete Repair
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="update-repair-status">
                <div className="page-header">
                    <div>
                        <h1>Update Repair Status</h1>
                        <p className="page-description">Update repair status for maintenance tickets</p>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <Card>
                    {loading ? (
                        <div className="loading">Loading tickets...</div>
                    ) : tickets.length === 0 ? (
                        <div className="empty-state">No tickets found</div>
                    ) : (
                        <Table columns={columns} data={tickets} />
                    )}
                </Card>

                {selectedTicket && (
                    <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Update Repair Status</h2>
                                <button className="close-btn" onClick={() => setSelectedTicket(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="ticket-info">
                                    <h3>{selectedTicket.title}</h3>
                                    <p><strong>Lab:</strong> {selectedTicket.lab?.name || 'N/A'}</p>
                                    <p><strong>Category:</strong> {selectedTicket.category}</p>
                                    <p><strong>Severity:</strong> {getSeverityBadge(selectedTicket.severity)}</p>
                                    <p><strong>Current Status:</strong> {getStatusBadge(selectedTicket.status)}</p>
                                </div>

                                <div className="form-group">
                                    <label>Resolution Notes</label>
                                    <textarea
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        placeholder="Describe the repair work done..."
                                        rows="4"
                                    />
                                </div>

                                <div className="modal-actions">
                                    {selectedTicket.status === 'open' && (
                                        <Button
                                            variant="primary"
                                            onClick={() => handleStatusUpdate(selectedTicket._id, 'in-progress')}
                                        >
                                            Start Repair
                                        </Button>
                                    )}
                                    {selectedTicket.status === 'in-progress' && (
                                        <Button
                                            variant="success"
                                            onClick={() => handleStatusUpdate(selectedTicket._id, 'resolved')}
                                        >
                                            Mark as Resolved
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        onClick={() => setSelectedTicket(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default UpdateRepairStatus;
