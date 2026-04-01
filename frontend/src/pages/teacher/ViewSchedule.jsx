import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import './ViewSchedule.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
    { start: '08:00', end: '09:00', label: '08:00 - 09:00' },
    { start: '09:00', end: '10:00', label: '09:00 - 10:00' },
    { start: '10:00', end: '11:00', label: '10:00 - 11:00' },
    { start: '11:00', end: '12:00', label: '11:00 - 12:00' },
    { start: '12:00', end: '13:00', label: '12:00 - 13:00' },
    { start: '13:00', end: '14:00', label: '13:00 - 14:00' },
    { start: '14:00', end: '15:00', label: '14:00 - 15:00' },
    { start: '15:00', end: '16:00', label: '15:00 - 16:00' },
    { start: '16:00', end: '17:00', label: '16:00 - 17:00' },
    { start: '17:00', end: '18:00', label: '17:00 - 18:00' },
];

const ViewSchedule = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weekOffset, setWeekOffset] = useState(0);

    const getWeekDates = useCallback((offset = 0) => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diff + offset * 7);
        monday.setHours(0, 0, 0, 0);

        return DAYS.map((_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, []);

    const weekDates = getWeekDates(weekOffset);

    const fetchSchedule = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/reservations/my-reservations');
            setReservations(response.data.reservations || []);
        } catch (err) {
            setError('Failed to fetch your schedule');
            console.error('Error fetching schedule:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    // Find session for a specific day + time slot (matches overlapping time ranges)
    const getSessionForSlot = (date, slotStart, slotEnd) => {
        const dateStr = date.toDateString();
        return reservations.find(r => {
            const rDate = new Date(r.date).toDateString();
            return rDate === dateStr
                && r.startTime >= slotStart
                && r.startTime < slotEnd
                && (r.status === 'approved' || r.status === 'pending');
        });
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const formatWeekRange = () => {
        const start = weekDates[0];
        const end = weekDates[weekDates.length - 1];
        const opts = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}, ${end.getFullYear()}`;
    };

    const getStatusColor = (status) => {
        if (status === 'approved') return '#059669';
        if (status === 'pending') return '#f59e0b';
        return '#9ca3af';
    };

    const getStatusBadge = (status) => {
        const labels = { approved: 'Approved', pending: 'Pending', rejected: 'Rejected', cancelled: 'Cancelled', completed: 'Completed' };
        const colors = {
            approved: { bg: '#d1fae5', color: '#065f46' },
            pending: { bg: '#fef3c7', color: '#92400e' },
            rejected: { bg: '#fee2e2', color: '#991b1b' },
            cancelled: { bg: '#f3f4f6', color: '#374151' },
            completed: { bg: '#dbeafe', color: '#1e40af' }
        };
        const c = colors[status] || colors.pending;
        return (
            <span className="schedule-status-badge" style={{ backgroundColor: c.bg, color: c.color }}>
                {labels[status] || status}
            </span>
        );
    };

    // Filter to only show time slots that have at least one session this week
    const activeTimeSlots = TIME_SLOTS.filter(slot => {
        return weekDates.some(date => {
            const session = getSessionForSlot(date, slot.start, slot.end);
            return !!session;
        });
    });

    // Count sessions per course
    const courseSummary = {};
    reservations.filter(r => r.status === 'approved' || r.status === 'pending').forEach(r => {
        const key = r.courseCode || r.courseName;
        if (!courseSummary[key]) {
            courseSummary[key] = { courseName: r.courseName, courseCode: r.courseCode, count: 0, labs: new Set() };
        }
        courseSummary[key].count++;
        if (r.lab?.name) courseSummary[key].labs.add(r.lab.name);
    });

    return (
        <DashboardLayout>
            <div className="view-schedule">
                <div className="page-header">
                    <div>
                        <h1>My Teaching Schedule</h1>
                        <p className="page-description">Weekly class timetable - see all your lab sessions</p>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <>
                        {/* Course Summary Cards */}
                        {Object.keys(courseSummary).length > 0 && (
                            <div className="course-summary-row">
                                {Object.values(courseSummary).map((course, idx) => (
                                    <div key={idx} className="course-summary-card">
                                        <div className="csc-name">{course.courseName}</div>
                                        <div className="csc-code">{course.courseCode}</div>
                                        <div className="csc-meta">
                                            <span className="csc-count">{course.count} sessions</span>
                                            <span className="csc-labs">{Array.from(course.labs).join(', ')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Week Navigation */}
                        <div className="week-navigation">
                            <Button variant="secondary" size="small" onClick={() => setWeekOffset(o => o - 1)}>
                                &larr; Prev Week
                            </Button>
                            <div className="week-range">
                                <strong>{formatWeekRange()}</strong>
                                {weekOffset === 0 && <span className="current-week-badge">Current Week</span>}
                                {weekOffset !== 0 && (
                                    <Button variant="secondary" size="small" onClick={() => setWeekOffset(0)}>
                                        Today
                                    </Button>
                                )}
                            </div>
                            <Button variant="secondary" size="small" onClick={() => setWeekOffset(o => o + 1)}>
                                Next Week &rarr;
                            </Button>
                        </div>

                        {/* TIMETABLE */}
                        <div className="timetable-wrapper">
                            <table className="timetable">
                                <thead>
                                    <tr>
                                        <th className="timetable-time-header">Time</th>
                                        {weekDates.map((date, idx) => (
                                            <th key={idx} className={`timetable-day-header ${isToday(date) ? 'today-col-header' : ''}`}>
                                                <div className="th-day-name">{DAYS[idx]}</div>
                                                <div className="th-day-date">
                                                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                                {isToday(date) && <div className="today-col-badge">TODAY</div>}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeTimeSlots.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="timetable-empty-row">
                                                No classes scheduled for this week
                                            </td>
                                        </tr>
                                    ) : (
                                        activeTimeSlots.map(slot => (
                                            <tr key={slot.label}>
                                                <td className="timetable-time-cell">
                                                    <div className="slot-time-start">{slot.start}</div>
                                                    <div className="slot-time-to">to</div>
                                                    <div className="slot-time-end">{slot.end}</div>
                                                </td>
                                                {weekDates.map((date, dayIdx) => {
                                                    const session = getSessionForSlot(date, slot.start, slot.end);
                                                    const todayCol = isToday(date) ? 'today-col' : '';

                                                    if (session) {
                                                        const statusColor = getStatusColor(session.status);
                                                        return (
                                                            <td key={dayIdx} className={`timetable-cell has-session ${todayCol}`}>
                                                                <div className="tt-session" style={{ borderLeftColor: statusColor }}>
                                                                    <div className="tt-course-name">{session.courseName}</div>
                                                                    <div className="tt-course-code">{session.courseCode}</div>
                                                                    <div className="tt-lab-name">{session.lab?.name}</div>
                                                                    <div className="tt-session-meta">
                                                                        <span>{session.startTime}-{session.endTime}</span>
                                                                        <span className="tt-dot" style={{ background: statusColor }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        );
                                                    }
                                                    return (
                                                        <td key={dayIdx} className={`timetable-cell ${todayCol}`}>
                                                            <div className="tt-empty">Free</div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="timetable-legend">
                            <span className="legend-item">
                                <span className="legend-dot" style={{ background: '#059669' }} />
                                Approved
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot" style={{ background: '#f59e0b' }} />
                                Pending
                            </span>
                            <span className="legend-item">
                                <span className="legend-dot" style={{ background: '#cbd5e1' }} />
                                Free
                            </span>
                        </div>

                        {/* Session Details Table */}
                        <div className="session-table-section">
                            <h2 className="section-title">This Week&apos;s Sessions</h2>
                            <Table
                                columns={[
                                    { header: 'Course', accessor: 'courseName', render: (_, row) => (
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{row.courseName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.courseCode}</div>
                                        </div>
                                    )},
                                    { header: 'Lab', accessor: 'lab.name', render: (_, row) => row.lab?.name || 'N/A' },
                                    { header: 'Day', accessor: 'date', render: (_, row) => {
                                        const d = new Date(row.date);
                                        return DAYS[d.getDay() - 1] || 'N/A';
                                    }},
                                    { header: 'Date', accessor: 'date', render: (_, row) => {
                                        const d = new Date(row.date);
                                        const today = new Date();
                                        const todayFlag = d.toDateString() === today.toDateString();
                                        return (
                                            <span>
                                                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                {todayFlag && <span className="today-inline-tag">TODAY</span>}
                                            </span>
                                        );
                                    }},
                                    { header: 'Start', accessor: 'startTime', render: (_, row) => (
                                        <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>{row.startTime}</span>
                                    )},
                                    { header: 'End', accessor: 'endTime' },
                                    { header: 'Students', accessor: 'numberOfStudents' },
                                    { header: 'Status', accessor: 'status', render: (_, row) => getStatusBadge(row.status) }
                                ]}
                                data={[...reservations]
                                    .filter(r => {
                                        const rDate = new Date(r.date);
                                        const weekStart = weekDates[0];
                                        const weekEnd = new Date(weekDates[4]);
                                        weekEnd.setHours(23, 59, 59, 999);
                                        return rDate >= weekStart && rDate <= weekEnd && (r.status === 'approved' || r.status === 'pending');
                                    })
                                    .sort((a, b) => {
                                        const dA = new Date(a.date);
                                        const dB = new Date(b.date);
                                        const dayDiff = dA.getDay() - dB.getDay();
                                        return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
                                    })}
                            />
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ViewSchedule;
