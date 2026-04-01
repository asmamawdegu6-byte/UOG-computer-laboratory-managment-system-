import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './ScanAttendance.css';

const ScanAttendance = () => {
    const [searchParams] = useSearchParams();
    const reservationId = searchParams.get('r');

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);
    const [studentId, setStudentId] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (!reservationId) {
            setError('Invalid QR code. No session ID found.');
            setLoading(false);
            return;
        }
        fetchSessionInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reservationId]);

    const fetchSessionInfo = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/attendance/session/${reservationId}`);
            if (response.data.success) {
                setSession(response.data.session);
                setTimeout(() => inputRef.current?.focus(), 300);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load session information';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!studentId.trim()) {
            setError('Please enter your Student ID');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const response = await api.post('/attendance/qr-scan', {
                reservationId,
                studentId: studentId.trim()
            });

            if (response.data.success) {
                setSuccessData({
                    ...response.data.student,
                    alreadyMarked: response.data.alreadyMarked,
                    message: response.data.message,
                    attendanceCount: response.data.attendanceCount
                });
                setStudentId('');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to mark attendance';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="scan-attendance-page">
                <div className="scan-container">
                    <div className="scan-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading session...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="scan-attendance-page">
                <div className="scan-container">
                    <div className="scan-error-full">
                        <div className="error-icon-large">X</div>
                        <h2>Invalid Session</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="scan-attendance-page">
            <div className="scan-container">
                {/* Header */}
                <div className="scan-header">
                    <div className="scan-logo">CLM</div>
                    <h1>Lab Attendance</h1>
                </div>

                {/* Session Info */}
                {session && (
                    <div className="session-info-card">
                        <div className="session-info-row">
                            <span className="info-label">Course</span>
                            <span className="info-value">{session.courseName} ({session.courseCode})</span>
                        </div>
                        <div className="session-info-row">
                            <span className="info-label">Lab</span>
                            <span className="info-value">{session.lab?.name}</span>
                        </div>
                        <div className="session-info-row">
                            <span className="info-label">Date</span>
                            <span className="info-value">{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                        <div className="session-info-row">
                            <span className="info-label">Time</span>
                            <span className="info-value">{session.startTime} - {session.endTime}</span>
                        </div>
                        <div className="session-info-row">
                            <span className="info-label">Teacher</span>
                            <span className="info-value">{session.teacher?.name}</span>
                        </div>
                        <div className="attendance-counter">
                            <span className="counter-value">{session.attendanceCount || 0}</span>
                            <span className="counter-label">/{session.numberOfStudents} present</span>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {successData ? (
                    <div className={`success-card ${successData.alreadyMarked ? 'already-marked' : ''}`}>
                        <div className="success-checkmark">
                            {successData.alreadyMarked ? '!' : '✓'}
                        </div>
                        <h2>{successData.alreadyMarked ? 'Already Marked' : 'Attendance Recorded!'}</h2>
                        <p className="success-message">{successData.message}</p>
                        <div className="student-details-card">
                            <div className="detail-row">
                                <span className="detail-label">Name</span>
                                <span className="detail-value">{successData.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Student ID</span>
                                <span className="detail-value">{successData.studentId}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{successData.email}</span>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => { setSuccessData(null); setTimeout(() => inputRef.current?.focus(), 200); }}
                            className="scan-another-btn"
                        >
                            Scan Another Student
                        </Button>
                    </div>
                ) : (
                    /* Student ID Entry Form */
                    <div className="entry-card">
                        <h2>Enter Your Student ID</h2>
                        <form onSubmit={handleSubmit} className="entry-form">
                            <input
                                id="student-id-scan-input"
                                ref={inputRef}
                                type="text"
                                placeholder="e.g. STU001"
                                value={studentId}
                                onChange={(e) => { setStudentId(e.target.value); if (error) setError(''); }}
                                className="student-id-input"
                                autoFocus
                                autoComplete="off"
                                required
                            />
                            {error && <div className="scan-error">{error}</div>}
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting || !studentId.trim()}
                                className="mark-btn"
                            >
                                {submitting ? 'Marking...' : 'Mark My Attendance'}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Footer */}
                <div className="scan-footer">
                    <p>Computer Lab Management System</p>
                </div>
            </div>
        </div>
    );
};

export default ScanAttendance;
