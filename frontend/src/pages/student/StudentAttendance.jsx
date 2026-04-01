import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import './StudentAttendance.css';

const StudentAttendance = () => {
    const [studentId, setStudentId] = useState('');
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchActiveSession();
    }, []);

    const fetchActiveSession = async () => {
        try {
            setLoading(true);
            const response = await api.get('/attendance/active-session');
            if (response.data.success) {
                setSession(response.data.session);
                setTimeout(() => inputRef.current?.focus(), 300);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'No active session found');
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

            const response = await api.post('/attendance/mark-student', {
                studentId: studentId.trim()
            });

            if (response.data.success) {
                setSuccessData({
                    name: response.data.student.name,
                    studentId: response.data.student.studentId,
                    alreadyMarked: response.data.alreadyMarked,
                    message: response.data.message
                });
                setStudentId('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setSuccessData(null);
        setError('');
        setStudentId('');
        setTimeout(() => inputRef.current?.focus(), 200);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="student-attendance">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Looking for active session...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="student-attendance">
                <div className="page-header">
                    <h1>Mark Attendance</h1>
                    <p>Enter your Student ID to mark attendance</p>
                </div>

                {/* Session Info */}
                {session && (
                    <div className="session-info-banner">
                        <div className="session-info-row">
                            <span className="label">Course:</span>
                            <span className="value">{session.courseName} ({session.courseCode})</span>
                        </div>
                        <div className="session-info-row">
                            <span className="label">Lab:</span>
                            <span className="value">{session.labName}</span>
                        </div>
                        <div className="session-info-row">
                            <span className="label">Time:</span>
                            <span className="value">{session.startTime} - {session.endTime}</span>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {successData ? (
                    <div className={`success-card ${successData.alreadyMarked ? 'already-marked' : ''}`}>
                        <div className="success-icon">
                            {successData.alreadyMarked ? '!' : '✓'}
                        </div>
                        <h2>{successData.alreadyMarked ? 'Already Marked' : 'Attendance Marked!'}</h2>
                        <p className="success-message">{successData.message}</p>
                        <div className="student-info-card">
                            <div className="info-row">
                                <span className="info-label">Name</span>
                                <span className="info-value">{successData.name}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Student ID</span>
                                <span className="info-value">{successData.studentId}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Status</span>
                                <span className="info-value status-present">Present</span>
                            </div>
                        </div>
                        <button className="reset-btn" onClick={handleReset}>
                            Mark Another Student
                        </button>
                    </div>
                ) : (
                    /* Entry Card */
                    <div className="entry-card">
                        <div className="entry-header">
                            <div className="id-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                                    <line x1="2" y1="10" x2="22" y2="10"/>
                                </svg>
                            </div>
                            <h2>Enter Your Student ID</h2>
                            <p>Type your ID and click Submit</p>
                        </div>

                        <form onSubmit={handleSubmit} className="entry-form">
                            <div className="input-wrapper">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Student ID (e.g., STU001)"
                                    value={studentId}
                                    onChange={(e) => {
                                        setStudentId(e.target.value.toUpperCase());
                                        if (error) setError('');
                                    }}
                                    className="student-id-input"
                                    autoFocus
                                    autoComplete="off"
                                    disabled={!session}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="error-message">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="15" y1="9" x2="9" y2="15"/>
                                        <line x1="9" y1="9" x2="15" y2="15"/>
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={submitting || !studentId.trim() || !session}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner"></span>
                                        Marking...
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                        Submit Attendance
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="help-text">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            <span>Student ID is case-insensitive. Ask your teacher if you don&apos;t know your ID.</span>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentAttendance;
