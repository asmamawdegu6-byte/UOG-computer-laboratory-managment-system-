import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './MyReservations.css';

const MyReservations = () => {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedReservation, setSelectedReservation] = useState(null);

    useEffect(() => {
        fetchMyReservations();
    }, []);

    const fetchMyReservations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reservations/my-reservations');
            setReservations(response.data.reservations || []);
        } catch (err) {
            setError('Failed to fetch reservations');
            console.error('Error fetching reservations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReservation = async (reservationId) => {
        if (!window.confirm('Are you sure you want to cancel this reservation?')) {
            return;
        }

        try {
            const response = await api.delete(`/reservations/${reservationId}`);
            if (response.data.success) {
                setSuccessMessage('Reservation cancelled successfully');
                fetchMyReservations();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to cancel reservation');
            console.error('Error cancelling reservation:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
            approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
            rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
            cancelled: { bg: '#f3f4f6', color: '#374151', label: 'Cancelled' },
            completed: { bg: '#dbeafe', color: '#1e40af', label: 'Completed' }
        };

        const colors = statusColors[status] || statusColors.pending;

        return (
            <span
                style={{
                    backgroundColor: colors.bg,
                    color: colors.color,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                }}
            >
                {colors.label}
            </span>
        );
    };

    const filteredReservations = filterStatus === 'all'
        ? reservations
        : reservations.filter(r => r.status === filterStatus);

    const columns = [
        {
            header: 'Lab',
            accessor: 'lab.name',
            render: (row) => <strong>{row.lab?.name || 'N/A'}</strong>
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
            header: 'Date',
            accessor: 'date',
            render: (row) => new Date(row.date).toLocaleDateString('en-US', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            })
        },
        {
            header: 'Time',
            accessor: 'time',
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {row.status === 'pending' && (
                        <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleCancelReservation(row._id)}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => setSelectedReservation(row)}
                    >
                        View
                    </Button>
                </div>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="my-reservations">
                <div className="page-header">
                    <div>
                        <h1>My Reservations</h1>
                        <p className="page-description">View and manage your lab reservations</p>
                    </div>
                    <Button variant="primary" onClick={() => navigate('/teacher/reservation')}>
                        New Reservation
                    </Button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                {/* Filter */}
                <Card className="filter-card">
                    <div className="filter-controls">
                        <label>Filter by Status:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Reservations</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </Card>

                <Card title={`Reservations (${filteredReservations.length})`}>
                    {loading ? (
                        <div className="loading">Loading reservations...</div>
                    ) : filteredReservations.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📅</div>
                            <h3>No Reservations Found</h3>
                            <p>
                                {filterStatus === 'all'
                                    ? "You haven't made any lab reservations yet."
                                    : `No ${filterStatus} reservations found.`}
                            </p>
                            <Button variant="primary" onClick={() => navigate('/teacher/reservation')}>
                                Make a Reservation
                            </Button>
                        </div>
                    ) : (
                        <Table columns={columns} data={filteredReservations} />
                    )}
                </Card>

                {/* Detail Modal */}
                {selectedReservation && (
                    <div className="modal-overlay" onClick={() => setSelectedReservation(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Reservation Details</h2>
                                <button className="close-btn" onClick={() => setSelectedReservation(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-row">
                                    <strong>Lab:</strong>
                                    <span>{selectedReservation.lab?.name || 'N/A'} ({selectedReservation.lab?.code})</span>
                                </div>
                                <div className="detail-row">
                                    <strong>Course:</strong>
                                    <span>{selectedReservation.courseName} ({selectedReservation.courseCode})</span>
                                </div>
                                <div className="detail-row">
                                    <strong>Date:</strong>
                                    <span>{new Date(selectedReservation.date).toLocaleDateString('en-US', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}</span>
                                </div>
                                <div className="detail-row">
                                    <strong>Time:</strong>
                                    <span>{selectedReservation.startTime} - {selectedReservation.endTime}</span>
                                </div>
                                <div className="detail-row">
                                    <strong>Students:</strong>
                                    <span>{selectedReservation.numberOfStudents}</span>
                                </div>
                                <div className="detail-row">
                                    <strong>Status:</strong>
                                    {getStatusBadge(selectedReservation.status)}
                                </div>
                                {selectedReservation.description && (
                                    <div className="detail-row">
                                        <strong>Description:</strong>
                                        <span>{selectedReservation.description}</span>
                                    </div>
                                )}
                                {selectedReservation.rejectionReason && (
                                    <div className="detail-row rejection">
                                        <strong>Rejection Reason:</strong>
                                        <span>{selectedReservation.rejectionReason}</span>
                                    </div>
                                )}
                                {selectedReservation.approvedBy && (
                                    <div className="detail-row">
                                        <strong>Approved By:</strong>
                                        <span>{selectedReservation.approvedBy?.name || 'N/A'}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <strong>Submitted:</strong>
                                    <span>{new Date(selectedReservation.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                {selectedReservation.status === 'pending' && (
                                    <Button
                                        variant="danger"
                                        onClick={() => {
                                            handleCancelReservation(selectedReservation._id);
                                            setSelectedReservation(null);
                                        }}
                                    >
                                        Cancel Reservation
                                    </Button>
                                )}
                                <Button variant="secondary" onClick={() => setSelectedReservation(null)}>
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

export default MyReservations;
