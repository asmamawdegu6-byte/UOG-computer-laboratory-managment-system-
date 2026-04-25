import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import './ConflictDetection.css';

const ConflictDetection = () => {
    const [conflicts, setConflicts] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedConflict, setSelectedConflict] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [resolving, setResolving] = useState(false);

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }, []);

    const detectConflicts = useCallback((bookingsList, reservationsList) => {
        const conflictsList = [];

        // --- 1. Workstation Double Booking Detection ---
        const wsGrouped = {};
        bookingsList.forEach(booking => {
            if (['cancelled', 'completed', 'no-show'].includes(booking.status)) return;
            const wsId = booking.workstation?.workstationId || 'unknown';
            const labId = booking.lab?._id || 'unknown';
            const dateKey = new Date(booking.date).toISOString().split('T')[0];
            const key = `${labId}-${wsId}-${dateKey}`;
            if (!wsGrouped[key]) wsGrouped[key] = [];
            wsGrouped[key].push(booking);
        });

        Object.entries(wsGrouped).forEach(([key, groupBookings]) => {
            if (groupBookings.length < 2) return;
            for (let i = 0; i < groupBookings.length; i++) {
                for (let j = i + 1; j < groupBookings.length; j++) {
                    const a = groupBookings[i];
                    const b = groupBookings[j];
                    if (a.startTime < b.endTime && b.startTime < a.endTime) {
                        conflictsList.push({
                            id: `ws-conflict-${a._id}-${b._id}`,
                            type: 'double_booking',
                            lab: a.lab?.name || 'N/A',
                            labId: a.lab?._id,
                            workstation: a.workstation?.workstationNumber || 'N/A',
                            workstationId: a.workstation?.workstationId,
                            date: new Date(a.date).toISOString().split('T')[0],
                            timeSlot1: `${a.startTime} - ${a.endTime}`,
                            timeSlot2: `${b.startTime} - ${b.endTime}`,
                            bookings: [
                                { id: a._id, user: a.user, purpose: a.purpose, startTime: a.startTime, endTime: a.endTime, createdAt: a.createdAt },
                                { id: b._id, user: b.user, purpose: b.purpose, startTime: b.startTime, endTime: b.endTime, createdAt: b.createdAt }
                            ],
                            status: 'pending',
                            severity: 'high',
                            detectedAt: new Date().toISOString()
                        });
                    }
                }
            }
        });

        // --- 2. Reservation vs Booking Conflict Detection ---
        // When a teacher has an approved lab reservation, student bookings in that lab at the same time conflict
        const approvedReservations = reservationsList.filter(r => r.status === 'approved');

        bookingsList.forEach(booking => {
            if (['cancelled', 'completed', 'no-show'].includes(booking.status)) return;
            const bookingDate = new Date(booking.date).toISOString().split('T')[0];
            const bookingLabId = booking.lab?._id?.toString();

            approvedReservations.forEach(reservation => {
                const reservationDate = new Date(reservation.date).toISOString().split('T')[0];
                const reservationLabId = reservation.lab?._id?.toString();

                if (bookingLabId === reservationLabId && bookingDate === reservationDate) {
                    if (booking.startTime < reservation.endTime && reservation.startTime < booking.endTime) {
                        const conflictId = `res-conflict-${booking._id}-${reservation._id}`;
                        if (!conflictsList.find(c => c.id === conflictId)) {
                            conflictsList.push({
                                id: conflictId,
                                type: 'reservation_conflict',
                                lab: booking.lab?.name || 'N/A',
                                labId: bookingLabId,
                                workstation: booking.workstation?.workstationNumber || 'Any',
                                date: bookingDate,
                                timeSlot1: `Booking: ${booking.startTime} - ${booking.endTime}`,
                                timeSlot2: `Reservation: ${reservation.startTime} - ${reservation.endTime}`,
                                bookings: [
                                    { id: booking._id, user: booking.user, purpose: booking.purpose || 'Workstation booking', startTime: booking.startTime, endTime: booking.endTime, createdAt: booking.createdAt }
                                ],
                                reservation: {
                                    id: reservation._id,
                                    courseName: reservation.courseName,
                                    courseCode: reservation.courseCode,
                                    teacher: reservation.teacher,
                                    startTime: reservation.startTime,
                                    endTime: reservation.endTime
                                },
                                status: 'pending',
                                severity: 'critical',
                                detectedAt: new Date().toISOString()
                            });
                        }
                    }
                }
            });
        });

        // --- 3. Lab Capacity / Overlapping Reservations Detection ---
        const resGrouped = {};
        approvedReservations.forEach(res => {
            const labId = res.lab?._id?.toString() || 'unknown';
            const dateKey = new Date(res.date).toISOString().split('T')[0];
            const key = `${labId}-${dateKey}`;
            if (!resGrouped[key]) resGrouped[key] = [];
            resGrouped[key].push(res);
        });

        Object.entries(resGrouped).forEach(([key, groupRes]) => {
            if (groupRes.length < 2) return;
            for (let i = 0; i < groupRes.length; i++) {
                for (let j = i + 1; j < groupRes.length; j++) {
                    const a = groupRes[i];
                    const b = groupRes[j];
                    if (a.startTime < b.endTime && b.startTime < a.endTime) {
                        const conflictId = `lab-conflict-${a._id}-${b._id}`;
                        if (!conflictsList.find(c => c.id === conflictId)) {
                            conflictsList.push({
                                id: conflictId,
                                type: 'lab_overbooked',
                                lab: a.lab?.name || 'N/A',
                                labId: a.lab?._id,
                                workstation: 'Entire Lab',
                                date: new Date(a.date).toISOString().split('T')[0],
                                timeSlot1: `${a.courseCode}: ${a.startTime} - ${a.endTime}`,
                                timeSlot2: `${b.courseCode}: ${b.startTime} - ${b.endTime}`,
                                bookings: [],
                                reservation: {
                                    id: a._id,
                                    courseName: a.courseName,
                                    courseCode: a.courseCode,
                                    teacher: a.teacher,
                                    startTime: a.startTime,
                                    endTime: a.endTime,
                                    numberOfStudents: a.numberOfStudents
                                },
                                reservation2: {
                                    id: b._id,
                                    courseName: b.courseName,
                                    courseCode: b.courseCode,
                                    teacher: b.teacher,
                                    startTime: b.startTime,
                                    endTime: b.endTime,
                                    numberOfStudents: b.numberOfStudents
                                },
                                status: 'pending',
                                severity: 'critical',
                                detectedAt: new Date().toISOString()
                            });
                        }
                    }
                }
            }
        });

        return conflictsList;
    }, []);

    const fetchConflicts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/bookings/conflicts');
            const detectedConflicts = response.data.conflicts || [];
            setBookings([]);
            setReservations([]);
            setConflicts(detectedConflicts);
        } catch (error) {
            console.error('Error fetching data for conflict detection:', error);
            showMessage('error', 'Failed to load booking/reservation data');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => {
        fetchConflicts();
    }, [fetchConflicts]);

    const handleResolve = async (conflict, keepId) => {
        setResolving(true);
        try {
            let cancelId;
            let cancelType = 'booking';

            if (conflict.type === 'double_booking') {
                cancelId = conflict.bookings.find(b => b.id !== keepId)?.id;
            } else if (conflict.type === 'reservation_conflict') {
                // Cancel the student booking, keep the teacher reservation
                cancelId = conflict.bookings[0]?.id;
            } else if (conflict.type === 'lab_overbooked') {
                // Cancel the second reservation
                cancelId = conflict.reservation2?.id;
                cancelType = 'reservation';
            }

            if (!cancelId) {
                showMessage('error', 'Could not determine which item to cancel');
                return;
            }

            let response;
            if (cancelType === 'reservation') {
                response = await api.delete(`/reservations/${cancelId}`);
            } else {
                response = await api.patch(`/bookings/${cancelId}/status`, { status: 'cancelled' });
            }

            if (response.data.success) {
                showMessage('success', `Conflict resolved! ${cancelType === 'reservation' ? 'Reservation' : 'Booking'} has been cancelled.`);
                setConflicts(prev => prev.map(c =>
                    c.id === conflict.id
                        ? { ...c, status: 'resolved', resolution: `${cancelType} ${cancelId.slice(-8)} cancelled` }
                        : c
                ));
                setShowModal(false);
                setSelectedConflict(null);
                fetchConflicts();
            }
        } catch (error) {
            console.error('Error resolving conflict:', error);
            showMessage('error', error?.response?.data?.message || 'Failed to resolve conflict');
        } finally {
            setResolving(false);
        }
    };

    const handleDismiss = (conflictId) => {
        if (!window.confirm('Are you sure you want to dismiss this conflict?')) return;
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        showMessage('success', 'Conflict dismissed');
    };

    const handleViewDetails = (conflict) => {
        setSelectedConflict(conflict);
        setShowModal(true);
    };

    const filteredConflicts = conflicts.filter(conflict => {
        return filterStatus === 'all' || conflict.status === filterStatus;
    });

    const getTypeLabel = (type) => {
        const labels = {
            double_booking: 'Double Booking',
            reservation_conflict: 'Booking vs Reservation',
            lab_overbooked: 'Lab Overbooked'
        };
        return labels[type] || type;
    };

    const getTypeBadgeClass = (type) => {
        const classes = {
            double_booking: 'type-double-booking',
            reservation_conflict: 'type-reservation-conflict',
            lab_overbooked: 'type-lab-overbooked'
        };
        return classes[type] || '';
    };

    const columns = [
        {
            accessor: 'type',
            header: 'Type',
            render: (row) => (
                <span className={`type-badge ${getTypeBadgeClass(row.type)}`}>
                    {getTypeLabel(row.type)}
                </span>
            )
        },
        { accessor: 'lab', header: 'Lab' },
        { accessor: 'workstation', header: 'Workstation' },
        { accessor: 'date', header: 'Date' },
        {
            accessor: 'timeSlots',
            header: 'Conflicting Times',
            render: (row) => (
                <div style={{ fontSize: '0.8rem' }}>
                    <div>{row.timeSlot1}</div>
                    <div style={{ color: '#e74c3c' }}>{row.timeSlot2}</div>
                </div>
            )
        },
        {
            accessor: 'severity',
            header: 'Severity',
            render: (row) => <span className={`severity-badge ${row.severity}`}>{row.severity}</span>
        },
        {
            accessor: 'status',
            header: 'Status',
            render: (row) => <span className={`status-badge ${row.status}`}>{row.status}</span>
        },
        {
            accessor: 'actions',
            header: 'Actions',
            render: (row) => (
                <div className="action-buttons">
                    <Button variant="secondary" size="small" onClick={() => handleViewDetails(row)}>View</Button>
                    {row.status === 'pending' && (
                        <Button variant="danger" size="small" onClick={() => handleDismiss(row.id)}>Dismiss</Button>
                    )}
                </div>
            )
        }
    ];

    const stats = {
        total: conflicts.length,
        pending: conflicts.filter(c => c.status === 'pending').length,
        resolved: conflicts.filter(c => c.status === 'resolved').length,
        high: conflicts.filter(c => c.severity === 'high' || c.severity === 'critical').length
    };

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="conflict-detection">
                <div className="page-header">
                    <h1>Conflict Detection</h1>
                    <p>Identify and resolve booking and reservation conflicts</p>
                </div>

                {message.text && (
                    <div className={`${message.type}-message`}>{message.text}</div>
                )}

                <div className="stats-row">
                    <Card className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Conflicts</div>
                    </Card>
                    <Card className="stat-card pending">
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">Pending</div>
                    </Card>
                    <Card className="stat-card resolved">
                        <div className="stat-value">{stats.resolved}</div>
                        <div className="stat-label">Resolved</div>
                    </Card>
                    <Card className="stat-card high">
                        <div className="stat-value">{stats.high}</div>
                        <div className="stat-label">High/Critical</div>
                    </Card>
                </div>

                <Card className="management-card">
                    <div className="toolbar">
                        <div className="search-filter">
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                        <Button variant="secondary" onClick={fetchConflicts}>Refresh & Scan</Button>
                    </div>

                    {filteredConflicts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                            </div>
                            <h3>No Conflicts Found</h3>
                            <p>All bookings and reservations are properly scheduled with no conflicts.</p>
                        </div>
                    ) : (
                        <Table columns={columns} data={filteredConflicts} />
                    )}
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setSelectedConflict(null); }}
                    title="Resolve Conflict"
                    size="large"
                >
                    {selectedConflict && (
                        <div className="conflict-details">
                            <div className="detail-section">
                                <h3>Conflict Information</h3>
                                <p><strong>Type:</strong> <span className={`type-badge ${getTypeBadgeClass(selectedConflict.type)}`}>{getTypeLabel(selectedConflict.type)}</span></p>
                                <p><strong>Lab:</strong> {selectedConflict.lab}</p>
                                <p><strong>Workstation:</strong> {selectedConflict.workstation}</p>
                                <p><strong>Date:</strong> {selectedConflict.date}</p>
                                <p><strong>Severity:</strong> <span className={`severity-badge ${selectedConflict.severity}`}>{selectedConflict.severity}</span></p>
                                <p><strong>Status:</strong> <span className={`status-badge ${selectedConflict.status}`}>{selectedConflict.status}</span></p>
                            </div>

                            {/* Double Booking - show two conflicting bookings */}
                            {selectedConflict.type === 'double_booking' && selectedConflict.bookings?.length > 0 && (
                                <div className="detail-section">
                                    <h3>Conflicting Bookings</h3>
                                    <p className="resolve-instruction">Select which booking to keep. The other will be cancelled.</p>
                                    {selectedConflict.bookings.map((booking, index) => (
                                        <div key={index} className="booking-item conflict-option">
                                            <div className="booking-info">
                                                <p><strong>Booking #{index + 1}</strong></p>
                                                <p><strong>User:</strong> {booking.user?.name || 'Unknown'} ({booking.user?.email || ''})</p>
                                                <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
                                                <p><strong>Purpose:</strong> {booking.purpose}</p>
                                                <p><strong>Created:</strong> {new Date(booking.createdAt).toLocaleString()}</p>
                                            </div>
                                            {selectedConflict.status === 'pending' && (
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleResolve(selectedConflict, booking.id)}
                                                    disabled={resolving}
                                                >
                                                    {resolving ? 'Resolving...' : 'Keep This Booking'}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reservation Conflict - show booking vs reservation */}
                            {selectedConflict.type === 'reservation_conflict' && (
                                <div className="detail-section">
                                    <h3>Conflicting Items</h3>
                                    <p className="resolve-instruction">A student booking conflicts with a teacher's lab reservation. Click resolve to cancel the student booking.</p>

                                    <div className="booking-item conflict-option" style={{ borderLeftColor: '#e74c3c' }}>
                                        <div className="booking-info">
                                            <p><strong>Student Booking</strong></p>
                                            <p><strong>User:</strong> {selectedConflict.bookings?.[0]?.user?.name || 'Unknown'}</p>
                                            <p><strong>Time:</strong> {selectedConflict.bookings?.[0]?.startTime} - {selectedConflict.bookings?.[0]?.endTime}</p>
                                            <p><strong>Purpose:</strong> {selectedConflict.bookings?.[0]?.purpose}</p>
                                        </div>
                                    </div>

                                    <div className="booking-item conflict-option" style={{ borderLeftColor: '#2ecc71' }}>
                                        <div className="booking-info">
                                            <p><strong>Teacher Reservation (Approved)</strong></p>
                                            <p><strong>Course:</strong> {selectedConflict.reservation?.courseName} ({selectedConflict.reservation?.courseCode})</p>
                                            <p><strong>Teacher:</strong> {selectedConflict.reservation?.teacher?.name || 'Unknown'}</p>
                                            <p><strong>Time:</strong> {selectedConflict.reservation?.startTime} - {selectedConflict.reservation?.endTime}</p>
                                        </div>
                                    </div>

                                    {selectedConflict.status === 'pending' && (
                                        <Button
                                            variant="danger"
                                            onClick={() => handleResolve(selectedConflict, selectedConflict.reservation?.id)}
                                            disabled={resolving}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            {resolving ? 'Resolving...' : 'Resolve - Cancel Student Booking'}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Lab Overbooked - show two conflicting reservations */}
                            {selectedConflict.type === 'lab_overbooked' && (
                                <div className="detail-section">
                                    <h3>Lab Overbooked - Multiple Reservations</h3>
                                    <p className="resolve-instruction">Two teacher reservations overlap. Click resolve to cancel the second reservation.</p>

                                    {selectedConflict.reservation && (
                                        <div className="booking-item conflict-option" style={{ borderLeftColor: '#3498db' }}>
                                            <div className="booking-info">
                                                <p><strong>Reservation #1</strong></p>
                                                <p><strong>Course:</strong> {selectedConflict.reservation.courseName} ({selectedConflict.reservation.courseCode})</p>
                                                <p><strong>Teacher:</strong> {selectedConflict.reservation.teacher?.name || 'Unknown'}</p>
                                                <p><strong>Time:</strong> {selectedConflict.reservation.startTime} - {selectedConflict.reservation.endTime}</p>
                                                <p><strong>Students:</strong> {selectedConflict.reservation.numberOfStudents}</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedConflict.reservation2 && (
                                        <div className="booking-item conflict-option" style={{ borderLeftColor: '#e74c3c' }}>
                                            <div className="booking-info">
                                                <p><strong>Reservation #2</strong></p>
                                                <p><strong>Course:</strong> {selectedConflict.reservation2.courseName} ({selectedConflict.reservation2.courseCode})</p>
                                                <p><strong>Teacher:</strong> {selectedConflict.reservation2.teacher?.name || 'Unknown'}</p>
                                                <p><strong>Time:</strong> {selectedConflict.reservation2.startTime} - {selectedConflict.reservation2.endTime}</p>
                                                <p><strong>Students:</strong> {selectedConflict.reservation2.numberOfStudents}</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedConflict.status === 'pending' && (
                                        <Button
                                            variant="danger"
                                            onClick={() => handleResolve(selectedConflict, selectedConflict.reservation?.id)}
                                            disabled={resolving}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            {resolving ? 'Resolving...' : 'Resolve - Cancel Reservation #2'}
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="detail-actions">
                                <Button variant="secondary" onClick={() => { setShowModal(false); setSelectedConflict(null); }}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default ConflictDetection;
