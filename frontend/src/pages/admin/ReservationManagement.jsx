import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import './ReservationManagement.css';

const ReservationManagement = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [conflictInfo, setConflictInfo] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }, []);

    const fetchReservations = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus !== 'all') params.status = filterStatus;

            const response = await api.get('/reservations', { params });
            setReservations(response.data.reservations || []);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            showMessage('error', 'Failed to load reservations');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, showMessage]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const handleApprove = async (reservation) => {
        setActionLoading(reservation._id);
        setConflictInfo(null);
        
        const reservationId = reservation._id;
        console.log('========== FRONTEND APPROVE CLICKED ==========');
        console.log('Reservation ID:', reservationId);
        console.log('Full reservation:', reservation);
        
        if (!reservationId) {
            console.error('ERROR: Reservation ID is missing!');
            showMessage('error', 'Error: Reservation ID is missing');
            setActionLoading(null);
            return;
        }
        
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const url = `${API_BASE_URL}/reservations/${reservationId}/approve`;
            console.log('Making PATCH request to:', url);
            
            const token = localStorage.getItem('token');
            console.log('Auth token exists:', !!token);
            
            const response = await api.patch(`/reservations/${reservationId}/approve`);
            console.log('Response:', response.data);
            
            if (response.data.success) {
                showMessage('success', `Reservation for "${reservation.courseName}" approved successfully`);
                fetchReservations();
                setShowModal(false);
            } else {
                if (response.data.conflicts) {
                    setConflictInfo(response.data.conflicts);
                }
                showMessage('error', response.data.message || `Failed to approve reservation`);
            }
        } catch (err) {
            console.error('Approve error:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            
            const errorData = err.response?.data;
            if (errorData?.conflicts) {
                setConflictInfo(errorData.conflicts);
                showMessage('error', errorData.message);
            } else if (errorData?.message) {
                showMessage('error', errorData.message);
            } else if (err.response) {
                showMessage('error', `Server error: ${err.response.status} - ${err.response.statusText}`);
            } else if (err.request) {
                showMessage('error', 'Network error: Server not responding. Please check if backend is running.');
            } else {
                showMessage('error', `Failed to approve reservation: ${err.message}`);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!selectedReservation || !rejectReason.trim()) {
            showMessage('error', 'Please provide a rejection reason');
            return;
        }

        setActionLoading(selectedReservation._id);
        try {
            const response = await api.patch(`/reservations/${selectedReservation._id}/reject`, {
                reason: rejectReason.trim()
            });
            if (response.data.success) {
                showMessage('success', `Reservation for "${selectedReservation.courseName}" rejected`);
                fetchReservations();
                setShowModal(false);
                setShowRejectModal(false);
                setRejectReason('');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to reject reservation');
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetails = (reservation) => {
        setSelectedReservation(reservation);
        setConflictInfo(null);
        setShowModal(true);
    };

    const openRejectModal = (reservation) => {
        setSelectedReservation(reservation);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const filteredReservations = reservations.filter(r => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (r.courseName || '').toLowerCase().includes(term) ||
            (r.courseCode || '').toLowerCase().includes(term) ||
            (r.teacher?.name || '').toLowerCase().includes(term) ||
            (r.lab?.name || '').toLowerCase().includes(term)
        );
    });

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
            approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
            rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
            cancelled: { bg: '#f3f4f6', color: '#374151', label: 'Cancelled' }
        };
        const s = styles[status] || styles.pending;
        return (
            <span className="res-status-badge" style={{ backgroundColor: s.bg, color: s.color }}>
                {s.label}
            </span>
        );
    };

    const columns = [
        {
            header: 'Teacher',
            accessor: 'teacher.name',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: '500' }}>{row.teacher?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.teacher?.email || ''}</div>
                </div>
            )
        },
        {
            header: 'Course',
            accessor: 'courseName',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: '500' }}>{row.courseName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.courseCode}</div>
                </div>
            )
        },
        {
            header: 'Lab',
            accessor: 'lab.name',
            render: (row) => row.lab?.name || 'N/A'
        },
        {
            header: 'Room',
            accessor: 'roomName',
            render: (row) => row.roomName || 'N/A'
        },
        {
            header: 'Date',
            accessor: 'date',
            render: (row) => new Date(row.date).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric'
            })
        },
        {
            header: 'Time',
            accessor: 'startTime',
            render: (row) => `${row.startTime} - ${row.endTime}`
        },
        {
            header: 'Students',
            accessor: 'numberOfStudents'
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button variant="secondary" size="small" onClick={() => handleViewDetails(row)}>
                        View
                    </Button>
                    {row.status === 'pending' && (
                        <>
                            <Button
                                variant="primary"
                                size="small"
                                onClick={() => handleApprove(row)}
                                loading={actionLoading === row._id}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="danger"
                                size="small"
                                onClick={() => openRejectModal(row)}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const stats = {
        pending: reservations.filter(r => r.status === 'pending').length,
        approved: reservations.filter(r => r.status === 'approved').length,
        rejected: reservations.filter(r => r.status === 'rejected').length,
        total: reservations.length
    };

    if (loading && reservations.length === 0) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="reservation-management">
                <div className="page-header">
                    <h1>Reservation Management</h1>
                    <p>Review and approve teacher lab reservations</p>
                </div>

                {message.text && (
                    <div className={`res-${message.type}-message`}>{message.text}</div>
                )}

                {/* Conflict Warning */}
                {conflictInfo && conflictInfo.length > 0 && (
                    <div className="conflict-warning">
                        <div className="conflict-header">
                            <strong>Double Booking Detected!</strong> This time slot conflicts with:
                        </div>
                        <ul className="conflict-list">
                            {conflictInfo.map((c, i) => (
                                <li key={i}>
                                    <strong>{c.courseName}</strong> ({c.courseCode}) - {c.lab}
                                    <br />
                                    {new Date(c.date).toLocaleDateString()} | {c.startTime}-{c.endTime} | Teacher: {c.teacher}
                                </li>
                            ))}
                        </ul>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#92400e' }}>
                            Reject this reservation or resolve the conflict first.
                        </p>
                    </div>
                )}

                {/* Stats */}
                <div className="res-stats-row">
                    <Card className="res-stat-card pending-stat">
                        <div className="res-stat-value">{stats.pending}</div>
                        <div className="res-stat-label">Pending</div>
                    </Card>
                    <Card className="res-stat-card approved-stat">
                        <div className="res-stat-value">{stats.approved}</div>
                        <div className="res-stat-label">Approved</div>
                    </Card>
                    <Card className="res-stat-card rejected-stat">
                        <div className="res-stat-value">{stats.rejected}</div>
                        <div className="res-stat-label">Rejected</div>
                    </Card>
                    <Card className="res-stat-card total-stat">
                        <div className="res-stat-value">{stats.total}</div>
                        <div className="res-stat-label">Total</div>
                    </Card>
                </div>

                {/* Table */}
                <Card className="res-management-card">
                    <div className="res-toolbar">
                        <div className="res-search-filter">
                            <input
                                type="text"
                                placeholder="Search by teacher, course, or lab..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="res-search-input"
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="res-filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <Button variant="secondary" onClick={() => fetchReservations()}>Refresh</Button>
                    </div>

                    {filteredReservations.length === 0 ? (
                        <div className="res-empty-state">
                            No reservations found
                        </div>
                    ) : (
                        <Table columns={columns} data={filteredReservations} />
                    )}
                </Card>

                {/* Detail Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setSelectedReservation(null); setConflictInfo(null); }}
                    title="Reservation Details"
                >
                    {selectedReservation && (
                        <div className="res-details">
                            <div className="res-detail-section">
                                <h3>Teacher</h3>
                                <p><strong>Name:</strong> {selectedReservation.teacher?.name}</p>
                                <p><strong>Email:</strong> {selectedReservation.teacher?.email}</p>
                                <p><strong>Department:</strong> {selectedReservation.teacher?.department || 'N/A'}</p>
                            </div>

                            <div className="res-detail-section">
                                <h3>Session Details</h3>
                                <p><strong>Course:</strong> {selectedReservation.courseName} ({selectedReservation.courseCode})</p>
                                <p><strong>Lab:</strong> {selectedReservation.lab?.name}</p>
                                <p><strong>Room:</strong> {selectedReservation.roomName || 'N/A'}</p>
                                <p><strong>Date:</strong> {new Date(selectedReservation.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p><strong>Time:</strong> {selectedReservation.startTime} - {selectedReservation.endTime}</p>
                                <p><strong>Students:</strong> {selectedReservation.numberOfStudents}</p>
                                {selectedReservation.description && <p><strong>Description:</strong> {selectedReservation.description}</p>}
                            </div>

                            <div className="res-detail-section">
                                <h3>Status</h3>
                                <p>{getStatusBadge(selectedReservation.status)}</p>
                                {selectedReservation.rejectionReason && (
                                    <p><strong>Rejection Reason:</strong> {selectedReservation.rejectionReason}</p>
                                )}
                            </div>

                            <div className="res-detail-actions">
                                {selectedReservation.status === 'pending' && (
                                    <>
                                        <Button
                                            variant="primary"
                                            onClick={() => handleApprove(selectedReservation)}
                                            loading={actionLoading === selectedReservation._id}
                                        >
                                            Approve Reservation
                                        </Button>
                                        <Button variant="danger" onClick={() => { setShowModal(false); openRejectModal(selectedReservation); }}>
                                            Reject Reservation
                                        </Button>
                                    </>
                                )}
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Reject Modal */}
                <Modal
                    isOpen={showRejectModal}
                    onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
                    title="Reject Reservation"
                >
                    {selectedReservation && (
                        <div className="reject-form">
                            <p>Rejecting reservation for <strong>{selectedReservation.courseName}</strong> by <strong>{selectedReservation.teacher?.name}</strong></p>
                            <div className="reject-reason-group">
                                <label>Rejection Reason *</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Provide a reason for rejection..."
                                    rows={3}
                                />
                            </div>
                            <div className="reject-actions">
                                <Button
                                    variant="danger"
                                    onClick={handleReject}
                                    loading={actionLoading === selectedReservation._id}
                                    disabled={!rejectReason.trim()}
                                >
                                    Confirm Rejection
                                </Button>
                                <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default ReservationManagement;
