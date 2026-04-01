import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import './BookingManagement.css';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }, []);

    const fetchBookings = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: pagination.limit };
            if (filterStatus !== 'all') params.status = filterStatus;

            const response = await api.get('/bookings', { params });
            const data = response.data;
            setBookings(data.bookings || []);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            showMessage('error', 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, pagination.limit, showMessage]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            const response = await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
            if (response.data.success) {
                showMessage('success', `Booking ${newStatus} successfully`);
                fetchBookings(pagination.page);
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            showMessage('error', error?.response?.data?.message || 'Failed to update booking status');
        }
    };

    const handleDelete = async (bookingId) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;
        try {
            const response = await api.delete(`/bookings/${bookingId}`);
            if (response.data.success) {
                showMessage('success', 'Booking cancelled successfully');
                fetchBookings(pagination.page);
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            showMessage('error', 'Failed to cancel booking');
        }
    };

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setShowModal(true);
    };

    const filteredBookings = bookings.filter(booking => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (booking.user?.name || '').toLowerCase().includes(term) ||
            (booking.user?.email || '').toLowerCase().includes(term) ||
            (booking.lab?.name || '').toLowerCase().includes(term)
        );
    });

    const columns = [
        {
            accessor: 'user',
            header: 'User',
            render: (row) => (
                <div className="user-cell">
                    <span className="user-name">{row.user?.name || 'Unknown'}</span>
                    <span className="user-email">{row.user?.email || ''}</span>
                </div>
            )
        },
        {
            accessor: 'lab',
            header: 'Lab',
            render: (row) => row.lab?.name || 'N/A'
        },
        {
            accessor: 'workstation',
            header: 'Workstation',
            render: (row) => row.workstation?.workstationNumber || 'N/A'
        },
        {
            accessor: 'date',
            header: 'Date',
            render: (row) => row.date ? new Date(row.date).toLocaleDateString() : '-'
        },
        {
            accessor: 'time',
            header: 'Time',
            render: (row) => `${row.startTime || ''} - ${row.endTime || ''}`
        },
        {
            accessor: 'status',
            header: 'Status',
            render: (row) => (
                <span className={`status-badge ${row.status}`}>
                    {row.status}
                </span>
            )
        },
        {
            accessor: 'actions',
            header: 'Actions',
            render: (row) => (
                <div className="action-buttons">
                    <Button variant="secondary" size="small" onClick={() => handleViewDetails(row)}>View</Button>
                    {row.status === 'pending' && (
                        <>
                            <Button variant="primary" size="small" onClick={() => handleStatusChange(row._id, 'confirmed')}>Confirm</Button>
                            <Button variant="danger" size="small" onClick={() => handleStatusChange(row._id, 'cancelled')}>Cancel</Button>
                        </>
                    )}
                    {row.status === 'confirmed' && (
                        <Button variant="secondary" size="small" onClick={() => handleStatusChange(row._id, 'completed')}>Complete</Button>
                    )}
                    <Button variant="danger" size="small" onClick={() => handleDelete(row._id)}>Delete</Button>
                </div>
            )
        }
    ];

    const stats = {
        total: pagination.total,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length
    };

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="booking-management">
                <div className="page-header">
                    <h1>Booking Management</h1>
                    <p>View and manage all workstation bookings</p>
                </div>

                {message.text && (
                    <div className={`${message.type}-message`}>{message.text}</div>
                )}

                <div className="stats-row">
                    <Card className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Bookings</div>
                    </Card>
                    <Card className="stat-card pending">
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">Pending</div>
                    </Card>
                    <Card className="stat-card confirmed">
                        <div className="stat-value">{stats.confirmed}</div>
                        <div className="stat-label">Confirmed</div>
                    </Card>
                    <Card className="stat-card completed">
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </Card>
                </div>

                <Card className="management-card">
                    <div className="toolbar">
                        <div className="search-filter">
                            <input
                                type="text"
                                placeholder="Search by user or lab..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <Button variant="secondary" onClick={() => fetchBookings()}>Refresh</Button>
                    </div>

                    <Table columns={columns} data={filteredBookings} />

                    {pagination.pages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', padding: '1rem' }}>
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    variant={page === pagination.page ? 'primary' : 'secondary'}
                                    size="small"
                                    onClick={() => fetchBookings(page)}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    )}
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setSelectedBooking(null); }}
                    title="Booking Details"
                >
                    {selectedBooking && (
                        <div className="booking-details">
                            <div className="detail-section">
                                <h3>User Information</h3>
                                <p><strong>Name:</strong> {selectedBooking.user?.name || 'Unknown'}</p>
                                <p><strong>Email:</strong> {selectedBooking.user?.email || 'N/A'}</p>
                            </div>

                            <div className="detail-section">
                                <h3>Booking Information</h3>
                                <p><strong>Lab:</strong> {selectedBooking.lab?.name || 'N/A'}</p>
                                <p><strong>Workstation:</strong> {selectedBooking.workstation?.workstationNumber || 'N/A'}</p>
                                <p><strong>Date:</strong> {new Date(selectedBooking.date).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
                                <p><strong>Purpose:</strong> {selectedBooking.purpose}</p>
                                <p><strong>Status:</strong> <span className={`status-badge ${selectedBooking.status}`}>{selectedBooking.status}</span></p>
                                <p><strong>Created:</strong> {new Date(selectedBooking.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="detail-actions">
                                {selectedBooking.status === 'pending' && (
                                    <>
                                        <Button variant="primary" onClick={() => { handleStatusChange(selectedBooking._id, 'confirmed'); setShowModal(false); }}>Confirm Booking</Button>
                                        <Button variant="danger" onClick={() => { handleStatusChange(selectedBooking._id, 'cancelled'); setShowModal(false); }}>Cancel Booking</Button>
                                    </>
                                )}
                                {selectedBooking.status === 'confirmed' && (
                                    <Button variant="primary" onClick={() => { handleStatusChange(selectedBooking._id, 'completed'); setShowModal(false); }}>Mark as Completed</Button>
                                )}
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default BookingManagement;
