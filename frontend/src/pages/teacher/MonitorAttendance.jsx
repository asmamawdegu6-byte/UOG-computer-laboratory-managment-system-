import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './MonitorAttendance.css';

const MonitorAttendance = () => {
    const location = useLocation();
    const [reservations, setReservations] = useState([]);
    const [selectedReservationId, setSelectedReservationId] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState('student-id');

    // Student ID entry state
    const [studentIdInput, setStudentIdInput] = useState('');
    const [markingAttendance, setMarkingAttendance] = useState(false);
    const [markResult, setMarkResult] = useState(null);
    const studentIdRef = useRef(null);

    useEffect(() => {
        fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle passed reservation ID from navigation
    useEffect(() => {
        if (location.state?.selectedReservationId && reservations.length > 0) {
            const passedId = location.state.selectedReservationId;
            if (reservations.find(r => r._id === passedId)) {
                setSelectedReservationId(passedId);
                fetchAttendanceAndStats(passedId);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, reservations]);

    useEffect(() => {
        if (activeView === 'student-id' && studentIdRef.current) {
            studentIdRef.current.focus();
        }
    }, [activeView]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reservations/my-reservations');
            const allReservations = response.data.reservations || [];
            setReservations(allReservations);

            // Auto-select first approved or pending session (for today or future)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const validSessions = allReservations.filter(r => 
                r.status === 'approved' || r.status === 'pending'
            );
            
            if (validSessions.length >= 1) {
                // Check if there's a passed reservation ID from navigation
                const passedId = location.state?.selectedReservationId;
                if (passedId && validSessions.find(r => r._id === passedId)) {
                    setSelectedReservationId(passedId);
                    fetchSessionStudents(passedId);
                } else {
                    setSelectedReservationId(validSessions[0]._id);
                    fetchSessionStudents(validSessions[0]._id);
                }
            }
        } catch (err) {
            setError('Failed to fetch reservations');
            console.error('Error fetching reservations:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch students for the selected session
    const fetchSessionStudents = async (reservationId) => {
        try {
            // First get the active session for this reservation
            const sessionsRes = await api.get('/attendance/sessions', {
                params: { reservationId }
            });
            
            if (sessionsRes.data.sessions && sessionsRes.data.sessions.length > 0) {
                const activeSession = sessionsRes.data.sessions.find(s => s.status === 'active') || sessionsRes.data.sessions[0];
                
                // Get students for this session
                const studentsRes = await api.get(`/attendance/sessions/${activeSession._id}/students`);
                
                if (studentsRes.data.success) {
                    // Convert students to attendance format
                    const studentsWithAttendance = (studentsRes.data.students || []).map(student => ({
                        _id: student.attendanceId || student._id,
                        student: {
                            _id: student._id,
                            name: `${student.firstName} ${student.lastName}`,
                            studentId: student.studentId,
                            email: student.email
                        },
                        status: student.attendanceStatus || 'absent',
                        checkInTime: student.markedAt,
                        checkOutTime: null
                    }));
                    
                    setAttendance(studentsWithAttendance);
                    
                    // Calculate stats
                    const present = studentsWithAttendance.filter(s => s.status === 'present').length;
                    const late = studentsWithAttendance.filter(s => s.status === 'late').length;
                    const absent = studentsWithAttendance.filter(s => s.status === 'absent').length;
                    const total = studentsWithAttendance.length;
                    
                    setStats({
                        present,
                        late,
                        absent,
                        total,
                        expectedStudents: total,
                        attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching session students:', err);
            // Fall back to regular attendance fetching
            fetchAttendanceAndStats(reservationId);
        }
    };

    const fetchAttendanceAndStats = async (reservationId) => {
        try {
            const [attendanceRes, statsRes] = await Promise.all([
                api.get(`/attendance/reservation/${reservationId}`),
                api.get(`/attendance/stats/${reservationId}`)
            ]);
            setAttendance(attendanceRes.data.attendance || []);
            setStats(statsRes.data.stats || null);
        } catch (err) {
            console.error('Error fetching attendance:', err);
        }
    };

    const handleSessionChange = (e) => {
        const id = e.target.value;
        setSelectedReservationId(id);
        setError('');
        setAttendance([]);
        setStats(null);
        setMarkResult(null);
        if (id) {
            fetchSessionStudents(id);
            // Also store the session ID for marking attendance
            fetchSessionForReservation(id);
        }
    };
    
    // Store current session ID
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Fetch session ID for a reservation
    const fetchSessionForReservation = async (reservationId) => {
        try {
            const sessionsRes = await api.get('/attendance/sessions', {
                params: { reservationId }
            });
            
            if (sessionsRes.data.sessions && sessionsRes.data.sessions.length > 0) {
                const activeSession = sessionsRes.data.sessions.find(s => s.status === 'active') || sessionsRes.data.sessions[0];
                setCurrentSessionId(activeSession._id);
            } else {
                setCurrentSessionId(null);
            }
        } catch (err) {
            console.error('Error fetching session:', err);
            setCurrentSessionId(null);
        }
    };

    const handleRefresh = () => {
        if (selectedReservationId) {
            fetchSessionStudents(selectedReservationId);
        }
    };

    const handleMarkByStudentId = async (e) => {
        e.preventDefault();
        if (!studentIdInput.trim() || !selectedReservationId) return;

        try {
            setMarkingAttendance(true);
            setError('');
            setMarkResult(null);

            const response = await api.post('/attendance/mark-by-student-id', {
                reservationId: selectedReservationId,
                studentId: studentIdInput.trim(),
                status: 'present'
            });

            if (response.data.success) {
                setMarkResult({
                    type: 'success',
                    message: response.data.message,
                    student: response.data.student
                });
                setStudentIdInput('');
                fetchSessionStudents(selectedReservationId);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to mark attendance';
            setMarkResult({ type: 'error', message: msg });
        } finally {
            setMarkingAttendance(false);
        }
    };

    const handleCheckOut = async (studentIdString) => {
        if (!selectedReservationId || !studentIdString) return;

        try {
            const response = await api.post('/attendance/checkout', {
                reservationId: selectedReservationId,
                studentId: studentIdString
            });

            if (response.data.success) {
                fetchSessionStudents(selectedReservationId);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to check out student';
            setError(msg);
            setTimeout(() => setError(''), 4000);
        }
    };

    const handleMarkStatus = async (studentIdString, status) => {
        if (!selectedReservationId || !studentIdString) return;
        setMarkingAttendance(true);

        try {
            // Use session-based marking if available
            if (currentSessionId) {
                await api.post(`/attendance/sessions/${currentSessionId}/mark`, {
                    studentId: studentIdString,
                    status: status
                });
            } else {
                await api.post('/attendance/mark-by-student-id', {
                    reservationId: selectedReservationId,
                    studentId: studentIdString,
                    status: status
                });
            }
            fetchSessionStudents(selectedReservationId);
        } catch (err) {
            const msg = err.response?.data?.message || `Failed to mark as ${status}`;
            setError(msg);
            setTimeout(() => setError(''), 4000);
        } finally {
            setMarkingAttendance(false);
        }
    };

    const handleMarkAsAbsent = async (studentIdString) => {
        if (!selectedReservationId || !studentIdString) return;

        try {
            // Use session-based marking if available
            if (currentSessionId) {
                await api.post(`/attendance/sessions/${currentSessionId}/mark`, {
                    studentId: studentIdString,
                    status: 'absent'
                });
            } else {
                await api.post('/attendance/mark-by-student-id', {
                    reservationId: selectedReservationId,
                    studentId: studentIdString,
                    status: 'absent'
                });
            }
            fetchSessionStudents(selectedReservationId);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to mark as absent';
            setError(msg);
            setTimeout(() => setError(''), 4000);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            present: { bg: '#d1fae5', color: '#065f46' },
            absent: { bg: '#fee2e2', color: '#991b1b' },
            late: { bg: '#fef3c7', color: '#92400e' },
            excused: { bg: '#dbeafe', color: '#1e40af' }
        };
        const colors = statusColors[status] || statusColors.present;
        return (
            <span style={{
                backgroundColor: colors.bg,
                color: colors.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'capitalize'
            }}>
                {status}
            </span>
        );
    };

    const approvedReservations = reservations.filter(r => r.status === 'approved' || r.status === 'pending');
    const selectedReservation = approvedReservations.find(r => r._id === selectedReservationId);

    const filteredAttendance = attendance.filter(record => {
        const term = searchTerm.toLowerCase();
        return (
            (record.student?.name || '').toLowerCase().includes(term) ||
            (record.student?.studentId || '').toLowerCase().includes(term) ||
            (record.student?.email || '').toLowerCase().includes(term)
        );
    });

    const qrUrl = selectedReservationId
        ? `${window.location.origin}/attendance/scan?r=${selectedReservationId}`
        : '';

    const columns = [
        {
            header: 'Student',
            accessor: 'student.name',
            render: (value, row) => {
                const student = typeof value === 'object' ? value : row?.student;
                return (
                    <div>
                        <div style={{ fontWeight: '500' }}>{student?.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {student?.studentId || 'N/A'}</div>
                    </div>
                );
            }
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (value) => {
                const status = typeof value === 'object' ? value.status : value;
                return getStatusBadge(status);
            }
        },
        {
            header: 'Check-in',
            accessor: 'checkInTime',
            render: (value) => {
                const time = typeof value === 'object' ? value.checkInTime : value;
                return time ? new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
            }
        },
        {
            header: 'Check-out',
            accessor: 'checkOutTime',
            render: (value) => {
                const time = typeof value === 'object' ? value.checkOutTime : value;
                return time ? new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
            }
        },
        {
            header: 'Actions',
            accessor: '_id',
            render: (value, row) => {
                const student = row?.student;
                const hasCheckedOut = row?.checkOutTime;
                const isPresent = row?.status === 'present' || row?.status === 'late';
                const isAbsent = row?.status === 'absent' || !row?.status;
                
                return (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Present Button */}
                        {(isAbsent || row?.status === 'late') && (
                            <button
                                onClick={() => handleMarkStatus(student?.studentId, 'present')}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Present
                            </button>
                        )}

                        {/* Late Button */}
                        {isAbsent && (
                            <button
                                onClick={() => handleMarkStatus(student?.studentId, 'late')}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Late
                            </button>
                        )}
                        
                        {/* Mark as Absent Button */}
                        {isPresent && (
                            <button
                                onClick={() => handleMarkAsAbsent(student?.studentId)}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Absent
                            </button>
                        )}
                        
                        {/* Check Out Button */}
                        {isPresent && !hasCheckedOut && (
                            <button
                                onClick={() => handleCheckOut(student?.studentId)}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: '#dbeafe',
                                    color: '#1e40af',
                                    border: '1px solid #93c5fd',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Check Out
                            </button>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <DashboardLayout>
            <div className="monitor-attendance">
                <h1>Monitor Attendance</h1>
                <p className="page-description">
                    Track and manage lab attendance using Student IDs. No QR code needed.
                </p>

                {/* Session Selector */}
                <div className="session-selector-section">
                    <label htmlFor="session-select" className="session-selector-label">
                        Select Lab Session
                    </label>
                    {loading ? (
                        <div className="loading">Loading sessions...</div>
                    ) : approvedReservations.length === 0 ? (
                        <div className="no-sessions-warning">
                            No approved lab sessions found. Please create a reservation first.
                        </div>
                    ) : (
                        <select
                            id="session-select"
                            className="session-selector"
                            value={selectedReservationId}
                            onChange={handleSessionChange}
                        >
                            <option value="">-- Select a session --</option>
                            {approvedReservations.map((r) => (
                                <option key={r._id} value={r._id}>
                                    {r.courseName} ({r.courseCode}) - {r.lab?.name} - {new Date(r.date).toLocaleDateString()} ({r.startTime}-{r.endTime}) {r.semester ? `| ${r.semester}` : ''} {r.year ? `Year ${r.year}` : ''} {r.section ? `Section ${r.section}` : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Error */}
                {error && <div className="error-message">{error}</div>}

                {/* Session Selected */}
                {selectedReservationId && (
                    <>
                        {/* Session Header */}
                        {selectedReservation && (
                            <div className="session-header-bar">
                                <div className="session-header-info">
                                    <span className="session-course-tag">{selectedReservation.courseName}</span>
                                    <span className="session-meta">{selectedReservation.lab?.name} &bull; {new Date(selectedReservation.date).toLocaleDateString()} &bull; {selectedReservation.startTime}-{selectedReservation.endTime}</span>
                                </div>
                                <div className="session-header-actions">
                                    <button
                                        className={`view-tab ${activeView === 'student-id' ? 'active' : ''}`}
                                        onClick={() => setActiveView('student-id')}
                                    >
                                        Student ID Entry
                                    </button>
                                    <button
                                        className={`view-tab ${activeView === 'qr' ? 'active' : ''}`}
                                        onClick={() => setActiveView('qr')}
                                    >
                                        QR Code
                                    </button>
                                    <button
                                        className={`view-tab ${activeView === 'analytics' ? 'active' : ''}`}
                                        onClick={() => setActiveView('analytics')}
                                    >
                                        Analytics
                                    </button>
                                    <Button variant="secondary" size="small" onClick={handleRefresh}>
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STUDENT ID ENTRY VIEW */}
                        {activeView === 'student-id' && (
                            <div className="student-id-section">
                                <div className="student-id-panel">
                                    <h2>Mark Attendance by Student ID</h2>
                                    <p className="id-instruction">
                                        Enter a student&apos;s ID below to mark them as present. Press Enter or click Mark.
                                    </p>

                                    <form onSubmit={handleMarkByStudentId} className="id-entry-form">
                                        <div className="id-input-row">
                                            <input
                                                ref={studentIdRef}
                                                type="text"
                                                placeholder="Enter Student ID (e.g., STU001)"
                                                value={studentIdInput}
                                                onChange={(e) => {
                                                    setStudentIdInput(e.target.value.toUpperCase());
                                                    if (markResult) setMarkResult(null);
                                                }}
                                                className="student-id-field"
                                                autoFocus
                                                autoComplete="off"
                                            />
                                            <button
                                                type="submit"
                                                className="mark-btn"
                                                disabled={markingAttendance || !studentIdInput.trim()}
                                            >
                                                {markingAttendance ? 'Marking...' : 'Mark Present'}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Result Feedback */}
                                    {markResult && (
                                        <div className={`mark-result ${markResult.type}`}>
                                            <div className="result-icon">
                                                {markResult.type === 'success' ? '\u2713' : '\u2717'}
                                            </div>
                                            <div className="result-content">
                                                <strong>{markResult.type === 'success' ? 'Success' : 'Error'}</strong>
                                                <p>{markResult.message}</p>
                                                {markResult.student && (
                                                    <div className="result-student-info">
                                                        <span>{markResult.student.name}</span>
                                                        <span>{markResult.student.studentId}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="attendance-stats">
                                        <div className="stat">
                                            <span className="stat-value present-value">{stats?.present || 0}</span>
                                            <span className="stat-label">Present</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value absent-value">{stats?.absent || 0}</span>
                                            <span className="stat-label">Absent</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value late-value">{stats?.late || 0}</span>
                                            <span className="stat-label">Late</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value total-value">{stats?.total || 0}</span>
                                            <span className="stat-label">Total</span>
                                        </div>
                                    </div>

                                    {/* Attendance Rate Bar */}
                                    {stats && (
                                        <div className="rate-bar-container">
                                            <div className="rate-bar-label">
                                                <span>Attendance Rate</span>
                                                <span className="rate-value">{stats.attendanceRate}%</span>
                                            </div>
                                            <div className="rate-bar-track">
                                                <div
                                                    className={`rate-bar-fill ${stats.attendanceRate >= 75 ? 'good' : stats.attendanceRate >= 50 ? 'warning' : 'danger'}`}
                                                    style={{ width: `${stats.attendanceRate}%` }}
                                                />
                                            </div>
                                            <div className="rate-bar-sublabel">
                                                {stats.present} of {stats.expectedStudents} expected students
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Attendance List */}
                                <div className="attendance-list-panel">
                                    <div className="list-header">
                                        <h3>Attendance List ({attendance.length})</h3>
                                        {attendance.length > 0 && (
                                            <input
                                                type="text"
                                                placeholder="Search by name or ID..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="search-input"
                                            />
                                        )}
                                    </div>

                                    {attendance.length === 0 ? (
                                        <div className="empty-state-small">
                                            No attendance marked yet. Enter Student IDs above to start marking attendance.
                                        </div>
                                    ) : filteredAttendance.length === 0 ? (
                                        <div className="empty-state-small">
                                            No matches for &quot;{searchTerm}&quot;
                                        </div>
                                    ) : (
                                        <Table columns={columns} data={filteredAttendance} />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* QR CODE VIEW */}
                        {activeView === 'qr' && (
                            <div className="qr-section">
                                <div className="qr-panel">
                                    <h2>Scan for Attendance</h2>
                                    <p className="qr-instruction">
                                        Students: Scan this QR code with your phone camera, then enter your Student ID.
                                    </p>

                                    {qrUrl && (
                                        <div className="qr-code-wrapper">
                                            <QRCodeSVG
                                                value={qrUrl}
                                                size={220}
                                                level="H"
                                                includeMargin={true}
                                                bgColor="#ffffff"
                                                fgColor="#1e293b"
                                            />
                                        </div>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="attendance-stats">
                                        <div className="stat">
                                            <span className="stat-value present-value">{stats?.present || 0}</span>
                                            <span className="stat-label">Present</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value absent-value">{stats?.absent || 0}</span>
                                            <span className="stat-label">Absent</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value late-value">{stats?.late || 0}</span>
                                            <span className="stat-label">Late</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value total-value">{stats?.total || 0}</span>
                                            <span className="stat-label">Total</span>
                                        </div>
                                    </div>

                                    {/* Attendance Rate Bar */}
                                    {stats && (
                                        <div className="rate-bar-container">
                                            <div className="rate-bar-label">
                                                <span>Attendance Rate</span>
                                                <span className="rate-value">{stats.attendanceRate}%</span>
                                            </div>
                                            <div className="rate-bar-track">
                                                <div
                                                    className={`rate-bar-fill ${stats.attendanceRate >= 75 ? 'good' : stats.attendanceRate >= 50 ? 'warning' : 'danger'}`}
                                                    style={{ width: `${stats.attendanceRate}%` }}
                                                />
                                            </div>
                                            <div className="rate-bar-sublabel">
                                                {stats.present} of {stats.expectedStudents} expected students
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Attendance List */}
                                <div className="attendance-list-panel">
                                    <div className="list-header">
                                        <h3>Attendance List ({attendance.length})</h3>
                                        {attendance.length > 0 && (
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="search-input"
                                            />
                                        )}
                                    </div>

                                    {attendance.length === 0 ? (
                                        <div className="empty-state-small">
                                            No attendance marked yet. Display the QR code for students to scan.
                                        </div>
                                    ) : filteredAttendance.length === 0 ? (
                                        <div className="empty-state-small">
                                            No matches for &quot;{searchTerm}&quot;
                                        </div>
                                    ) : (
                                        <Table columns={columns} data={filteredAttendance} />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ANALYTICS VIEW */}
                        {activeView === 'analytics' && stats && (
                            <div className="analytics-section">
                                {/* Attendance Overview */}
                                <div className="analytics-card">
                                    <h3>Attendance Overview</h3>
                                    <div className="analytics-grid">
                                        {/* Attendance Rate Circle */}
                                        <div className="rate-circle-container">
                                            <div className={`rate-circle ${stats.attendanceRate >= 75 ? 'good' : stats.attendanceRate >= 50 ? 'warning' : 'danger'}`}>
                                                <span className="rate-circle-value">{stats.attendanceRate}%</span>
                                                <span className="rate-circle-label">Attendance</span>
                                            </div>
                                            <div className="rate-context">
                                                {stats.present} of {stats.expectedStudents} students
                                            </div>
                                        </div>

                                        {/* Breakdown Bars */}
                                        <div className="breakdown-container">
                                            <div className="breakdown-item">
                                                <div className="breakdown-header">
                                                    <span className="breakdown-label present-text">Present</span>
                                                    <span className="breakdown-count">{stats.present}</span>
                                                </div>
                                                <div className="breakdown-bar-track">
                                                    <div
                                                        className="breakdown-bar-fill present-bar"
                                                        style={{ width: `${stats.expectedStudents > 0 ? (stats.present / stats.expectedStudents) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="breakdown-item">
                                                <div className="breakdown-header">
                                                    <span className="breakdown-label absent-text">Absent</span>
                                                    <span className="breakdown-count">{stats.absent}</span>
                                                </div>
                                                <div className="breakdown-bar-track">
                                                    <div
                                                        className="breakdown-bar-fill absent-bar"
                                                        style={{ width: `${stats.expectedStudents > 0 ? (stats.absent / stats.expectedStudents) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="breakdown-item">
                                                <div className="breakdown-header">
                                                    <span className="breakdown-label late-text">Late</span>
                                                    <span className="breakdown-count">{stats.late}</span>
                                                </div>
                                                <div className="breakdown-bar-track">
                                                    <div
                                                        className="breakdown-bar-fill late-bar"
                                                        style={{ width: `${stats.expectedStudents > 0 ? (stats.late / stats.expectedStudents) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="breakdown-item">
                                                <div className="breakdown-header">
                                                    <span className="breakdown-label excused-text">Excused</span>
                                                    <span className="breakdown-count">{stats.excused}</span>
                                                </div>
                                                <div className="breakdown-bar-track">
                                                    <div
                                                        className="breakdown-bar-fill excused-bar"
                                                        style={{ width: `${stats.expectedStudents > 0 ? (stats.excused / stats.expectedStudents) * 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Check-in Timing Analysis */}
                                <div className="analytics-card">
                                    <h3>Check-in Timing Analysis</h3>
                                    <div className="timing-stats">
                                        <div className="timing-item">
                                            <div className="timing-value early">{stats.checkInBreakdown?.early || 0}</div>
                                            <div className="timing-label">Early Arrivals</div>
                                            <div className="timing-desc">More than 5 min before</div>
                                        </div>
                                        <div className="timing-item">
                                            <div className="timing-value ontime">{stats.checkInBreakdown?.onTime || 0}</div>
                                            <div className="timing-label">On Time</div>
                                            <div className="timing-desc">Within 5 min of start</div>
                                        </div>
                                        <div className="timing-item">
                                            <div className="timing-value latecheckin">{stats.checkInBreakdown?.lateCheckIn || 0}</div>
                                            <div className="timing-label">Late Check-ins</div>
                                            <div className="timing-desc">More than 5 min after</div>
                                        </div>
                                    </div>
                                    {stats.avgCheckInTime && (
                                        <div className="avg-checkin">
                                            Average Check-in Time: <strong>{stats.avgCheckInTime}</strong>
                                        </div>
                                    )}
                                </div>

                                {/* Session Utilization */}
                                <div className="analytics-card">
                                    <h3>Session Utilization</h3>
                                    <div className="utilization-grid">
                                        <div className="util-item">
                                            <span className="util-icon">Duration</span>
                                            <span className="util-value">{stats.sessionDurationMinutes} min</span>
                                            <span className="util-label">{stats.sessionStartTime} - {stats.sessionEndTime}</span>
                                        </div>
                                        <div className="util-item">
                                            <span className="util-icon">Expected</span>
                                            <span className="util-value">{stats.expectedStudents}</span>
                                            <span className="util-label">Students enrolled</span>
                                        </div>
                                        <div className="util-item">
                                            <span className="util-icon">Attended</span>
                                            <span className="util-value">{stats.present + stats.late}</span>
                                            <span className="util-label">Students present</span>
                                        </div>
                                        <div className="util-item">
                                            <span className="util-icon">Rate</span>
                                            <span className="util-value">{stats.attendanceRate}%</span>
                                            <span className="util-label">Lab utilization</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Prompt when no session selected */}
                {!selectedReservationId && !loading && approvedReservations.length > 0 && (
                    <div className="select-session-prompt">
                        <div className="prompt-arrow">&#8593;</div>
                        <p>Select a lab session above to get started</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MonitorAttendance;
