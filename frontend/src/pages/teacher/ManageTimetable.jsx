import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import './ManageTimetable.css';

const ManageTimetable = () => {
    const [loading, setLoading] = useState(true);
    const [timetable, setTimetable] = useState(null);
    const [labs, setLabs] = useState([]);
    const [weekStart, setWeekStart] = useState(getMonday(new Date()));
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        labId: '',
        courseName: '',
        courseCode: '',
        startTime: '09:00',
        endTime: '11:00',
        numberOfStudents: 25,
        frequency: 'weekly',
        startDate: '',
        endDate: '',
        dayOfWeek: '1',
        description: ''
    });

    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const weekStartStr = weekStart.toISOString().split('T')[0];

            const [timetableRes, labsRes] = await Promise.all([
                api.get('/reservations/timetable', { params: { weekStart: weekStartStr } }),
                api.get('/labs')
            ]);

            setTimetable(timetableRes.data.timetable);
            setLabs(labsRes.data.labs || []);
        } catch (err) {
            console.error('Error fetching timetable:', err);
            showMessage('error', 'Failed to load timetable data');
        } finally {
            setLoading(false);
        }
    }, [weekStart, showMessage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const navigateWeek = (direction) => {
        const newWeek = new Date(weekStart);
        newWeek.setDate(newWeek.getDate() + (direction * 7));
        setWeekStart(newWeek);
    };

    const goToCurrentWeek = () => {
        setWeekStart(getMonday(new Date()));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateRecurring = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                labId: formData.labId,
                courseName: formData.courseName,
                courseCode: formData.courseCode,
                startTime: formData.startTime,
                endTime: formData.endTime,
                numberOfStudents: parseInt(formData.numberOfStudents),
                frequency: formData.frequency,
                startDate: formData.startDate,
                endDate: formData.endDate,
                dayOfWeek: formData.dayOfWeek,
                description: formData.description
            };

            const response = await api.post('/reservations/recurring', payload);

            if (response.data.success) {
                showMessage('success', `Created ${response.data.summary.totalCreated} recurring reservation(s). ${response.data.summary.conflictsSkipped > 0 ? `${response.data.summary.conflictsSkipped} conflict(s) skipped.` : ''}`);
                setShowCreateModal(false);
                setFormData({
                    labId: '',
                    courseName: '',
                    courseCode: '',
                    startTime: '09:00',
                    endTime: '11:00',
                    numberOfStudents: 25,
                    frequency: 'weekly',
                    startDate: '',
                    endDate: '',
                    dayOfWeek: '1',
                    description: ''
                });
                fetchData();
            }
        } catch (err) {
            console.error('Create recurring error:', err);
            showMessage('error', err?.response?.data?.message || 'Failed to create recurring reservations');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelReservation = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
        try {
            await api.delete(`/reservations/${id}`);
            showMessage('success', 'Reservation cancelled successfully');
            fetchData();
        } catch (err) {
            showMessage('error', 'Failed to cancel reservation');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            approved: '#2ecc71',
            pending: '#f39c12',
            rejected: '#e74c3c',
            cancelled: '#95a5a6'
        };
        return colors[status] || '#3498db';
    };

    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="manage-timetable">
                <div className="page-header">
                    <div className="header-content">
                        <h1>Manage Timetable</h1>
                        <p>Create and manage your academic timetable with recurring sessions</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                            + Create Recurring Sessions
                        </Button>
                    </div>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`} style={{ marginBottom: '1rem' }}>
                        {message.text}
                    </div>
                )}

                <div className="week-navigation">
                    <Button variant="secondary" onClick={() => navigateWeek(-1)}>Previous Week</Button>
                    <div className="week-display">
                        <span className="week-range">
                            {formatDate(weekStart)} - {formatDate(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
                        </span>
                        <Button variant="secondary" onClick={goToCurrentWeek} style={{ marginLeft: '0.5rem' }}>Today</Button>
                    </div>
                    <Button variant="secondary" onClick={() => navigateWeek(1)}>Next Week</Button>
                </div>

                <Card className="timetable-card">
                    <div className="timetable-grid">
                        {dayNames.map((day, dayIndex) => {
                            const dayDate = new Date(weekStart);
                            dayDate.setDate(weekStart.getDate() + dayIndex);
                            const isToday = new Date().toDateString() === dayDate.toDateString();

                            return (
                                <div key={day} className={`timetable-day-column ${isToday ? 'today' : ''}`}>
                                    <div className="day-header">
                                        <span className="day-name">{dayLabels[dayIndex]}</span>
                                        <span className="day-date">{formatDate(dayDate)}</span>
                                    </div>
                                    <div className="day-sessions">
                                        {timetable && timetable[day] && timetable[day].length > 0 ? (
                                            timetable[day].map((session, idx) => (
                                                <div
                                                    key={session._id || idx}
                                                    className="session-block"
                                                    style={{ borderLeftColor: getStatusColor(session.status) }}
                                                >
                                                    <div className="session-course">
                                                        <strong>{session.courseCode}</strong>
                                                        {session.isRecurring && <span className="recurring-badge" title="Recurring session">R</span>}
                                                    </div>
                                                    <div className="session-time">{session.startTime} - {session.endTime}</div>
                                                    <div className="session-lab">{session.lab?.name || 'N/A'}</div>
                                                    <div className="session-students">{session.numberOfStudents} students</div>
                                                    <span className="session-status" style={{ color: getStatusColor(session.status) }}>
                                                        {session.status}
                                                    </span>
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={() => handleCancelReservation(session._id)}
                                                        title="Cancel reservation"
                                                    >
                                                        x
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-sessions">No sessions</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create Recurring Sessions"
                    size="large"
                >
                    <form onSubmit={handleCreateRecurring} className="recurring-form">
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Course Name *</label>
                                <input
                                    type="text"
                                    name="courseName"
                                    value={formData.courseName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Introduction to Programming"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Course Code *</label>
                                <input
                                    type="text"
                                    name="courseCode"
                                    value={formData.courseCode}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., CS101"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Lab *</label>
                                <select
                                    name="labId"
                                    value={formData.labId}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                >
                                    <option value="">Select a lab</option>
                                    {labs.map(lab => (
                                        <option key={lab._id} value={lab._id}>
                                            {lab.name} ({lab.code}) - Capacity: {lab.capacity}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Number of Students *</label>
                                <input
                                    type="number"
                                    name="numberOfStudents"
                                    value={formData.numberOfStudents}
                                    onChange={handleInputChange}
                                    required
                                    min="1"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>End Time *</label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Frequency *</label>
                                <select
                                    name="frequency"
                                    value={formData.frequency}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Bi-weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            {formData.frequency !== 'daily' && (
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Day of Week *</label>
                                    <select
                                        name="dayOfWeek"
                                        value={formData.dayOfWeek}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    >
                                        <option value="1">Monday</option>
                                        <option value="2">Tuesday</option>
                                        <option value="3">Wednesday</option>
                                        <option value="4">Thursday</option>
                                        <option value="5">Friday</option>
                                        <option value="6">Saturday</option>
                                        <option value="0">Sunday</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Start Date *</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>End Date *</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Description (optional)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="2"
                                placeholder="Additional notes about this recurring session..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                            />
                        </div>

                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button type="submit" variant="primary" loading={submitting}>Create Sessions</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default ManageTimetable;
