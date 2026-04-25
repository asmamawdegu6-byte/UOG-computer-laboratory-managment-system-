import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { reportService } from '../../services/reportService';
import { useNotifications } from '../../contexts/NotificationContext';
import './MaintenanceTickets.css';

const urgencyLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
};

const statusLabels = {
    open: 'Open',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed'
};

const MaintenanceTickets = () => {
    const { addToast } = useNotifications();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/maintenance/faults');
            setTickets(response.data.faults || []);
        } catch (err) {
            setError('Failed to fetch maintenance requests');
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        try {
            setExporting(true);
            const params = { status: filterStatus !== 'all' ? filterStatus : undefined, search: searchTerm };
            if (type === 'csv') {
                await reportService.exportCSV('faults', params);
            } else {
                await reportService.exportPDF('faults', params);
            }
        } catch (err) {
            console.error('Export failed:', err);
            addToast({ type: 'error', title: 'Export Failed', message: 'Could not generate report' });
        } finally {
            setExporting(false);
        }
    };

    const handleStatusUpdate = async (ticketId, newStatus) => {
        try {
            const response = await api.patch(`/maintenance/faults/${ticketId}`, {
                status: newStatus
            });

            if (response.data.success) {
                setSuccessMessage('Maintenance request updated successfully');
                addToast({ type: 'success', title: 'Request Updated', message: `Status changed to ${newStatus}` });
                fetchTickets();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to update maintenance request');
            addToast({ type: 'error', title: 'Update Failed', message: 'Could not update maintenance request' });
            console.error('Error updating ticket:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const filteredTickets = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return tickets.filter(ticket => {
            const statusOk = filterStatus === 'all' || ticket.status === filterStatus;
            if (!statusOk) return false;

            if (!term) return true;

            const haystack = [
                ticket.code,
                ticket.title,
                ticket.workstation,
                ticket.lab?.name,
                ticket.reportedBy?.name,
                ticket.description,
                ticket.severity,
                ticket.resolution
            ].join(' ').toLowerCase();

            return haystack.includes(term);
        });
    }, [tickets, filterStatus, searchTerm]);

    return (
        <DashboardLayout>
            <div className="maintenance-tickets">
                <div className="page-header">
                    <div>
                        <h1>Maintenance Request Register</h1>
                        <p className="page-description">Follow technician requests in a spreadsheet-style log.</p>
                    </div>
                    <div className="filter-controls">
                        <div className="export-btns" style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                            <Button variant="secondary" size="small" onClick={() => handleExport('csv')} disabled={exporting}>
                                {exporting ? '...' : '📄 CSV'}
                            </Button>
                            <Button variant="secondary" size="small" onClick={() => handleExport('pdf')} disabled={exporting}>
                                {exporting ? '...' : '📕 PDF'}
                            </Button>
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Requests</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                        <input
                            className="sheet-search"
                            type="text"
                            placeholder="Search tag, room, reporter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <Card className="spreadsheet-card">
                    {loading ? (
                        <div className="loading">Loading maintenance requests...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="empty-state">No maintenance requests found</div>
                    ) : (
                        <div className="sheet-table-wrap">
                            <table className="sheet-table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Date Reported</th>
                                        <th>Computer Tag</th>
                                        <th>Location/Room</th>
                                        <th>Reported By</th>
                                        <th>Problem Description</th>
                                        <th>Urgency Status</th>
                                        <th>Lab Owner</th>
                                        <th>Action To Taken</th>
                                        <th>Current Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map((ticket, index) => {
                                        const computerTag = ticket.workstation || ticket.code || ticket.title || 'N/A';
                                        const labOwner = ticket.lab?.supervisor?.name || ticket.assignedTo?.name || 'N/A';
                                        const actionTaken = ticket.resolution || (ticket.status === 'in-progress'
                                            ? 'Technician assigned / work started'
                                            : ticket.status === 'resolved'
                                                ? 'Issue resolved'
                                                : 'Pending action');

                                        return (
                                            <tr key={ticket._id}>
                                                <td>{index + 1}</td>
                                                <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                                <td>{computerTag}</td>
                                                <td>{ticket.lab?.name || 'N/A'}</td>
                                                <td>{ticket.reportedBy?.name || 'Unknown'}</td>
                                                <td>{ticket.description}</td>
                                                <td>
                                                    <span className={`sheet-status urgency-${ticket.severity}`}>
                                                        {urgencyLabels[ticket.severity] || ticket.severity}
                                                    </span>
                                                </td>
                                                <td>{labOwner}</td>
                                                <td>{actionTaken}</td>
                                                <td>
                                                    <span className={`sheet-status status-${ticket.status}`}>
                                                        {statusLabels[ticket.status] || ticket.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="sheet-actions">
                                                        {ticket.status === 'open' && (
                                                            <Button variant="primary" size="small" onClick={() => handleStatusUpdate(ticket._id, 'in-progress')}>
                                                                Start
                                                            </Button>
                                                        )}
                                                        {ticket.status === 'in-progress' && (
                                                            <Button variant="success" size="small" onClick={() => handleStatusUpdate(ticket._id, 'resolved')}>
                                                                Resolve
                                                            </Button>
                                                        )}
                                                        <Button variant="secondary" size="small" onClick={() => setSelectedTicket(ticket)}>
                                                            View
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {selectedTicket && (
                    <div className="ticket-modal-overlay" onClick={() => setSelectedTicket(null)}>
                        <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{selectedTicket.title}</h2>
                                <button className="close-btn" onClick={() => setSelectedTicket(null)}>x</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-row">
                                    <strong>Computer Tag</strong>
                                    <p>{selectedTicket.workstation || selectedTicket.title}</p>
                                </div>
                                <div className="detail-row">
                                    <strong>Location / Room</strong>
                                    <p>{selectedTicket.lab?.name || 'N/A'}</p>
                                </div>
                                <div className="detail-row">
                                    <strong>Reported By</strong>
                                    <p>{selectedTicket.reportedBy?.name || 'Unknown'}</p>
                                </div>
                                <div className="detail-row">
                                    <strong>Urgency</strong>
                                    <p>{urgencyLabels[selectedTicket.severity] || selectedTicket.severity}</p>
                                </div>
                                <div className="detail-row">
                                    <strong>Problem Description</strong>
                                    <p>{selectedTicket.description}</p>
                                </div>
                                <div className="detail-row">
                                    <strong>Current Status</strong>
                                    <p>{statusLabels[selectedTicket.status] || selectedTicket.status}</p>
                                </div>
                                {selectedTicket.resolution && (
                                    <div className="detail-row">
                                        <strong>Action Taken</strong>
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
