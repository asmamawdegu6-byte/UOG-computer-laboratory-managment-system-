import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './AttendanceHistory.css';

const AttendanceHistory = () => {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReservation, setSelectedReservation] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0
    });
    
    // Helper to safely format dates
    const formatDate = (dateValue, detailed = false) => {
        if (!dateValue) return 'N/A';
        let d;
        try {
            d = new Date(dateValue);
            if (isNaN(d.getTime())) return 'N/A';
            if (detailed) {
                return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            }
            return d.toLocaleDateString();
        } catch (err) {
            console.warn('Date formatting error:', err, 'value:', dateValue);
            return 'N/A';
        }
    };

    // Debug: Test API connection
    const testApi = async () => {
        try {
            console.log('Testing API connection...');
            const testRes = await api.get('/attendance/test-auth');
            console.log('Test response:', testRes.data);
            alert('API test successful: ' + JSON.stringify(testRes.data));
        } catch (err) {
            console.error('API test failed:', err);
            alert('API test failed: ' + (err.response?.data?.message || err.message));
        }
    };

    useEffect(() => {
        fetchReservations().then(() => {
            fetchAttendanceHistory();
        });
    }, []);

    useEffect(() => {
        fetchAttendanceHistory();
    }, [selectedReservation, filterStatus, pagination.page, selectedDate]);

    const fetchReservations = async () => {
        try {
            const response = await api.get('/reservations/my-reservations');
            const data = response.data || {};
            // Ensure we always have an array
            const reservations = Array.isArray(data.reservations) ? data.reservations : [];
            setReservations(reservations);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setReservations([]);
        }
    };

    const fetchAttendanceHistory = async () => {
        try {
            setLoading(true);
            setError('');
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };
            
            if (selectedReservation) {
                params.reservationId = selectedReservation;
            }
            
            if (selectedDate) {
                params.date = selectedDate;
            }
            
            console.log('Fetching attendance history with params:', params);
            const response = await api.get('/attendance/history', { params });
            console.log('Attendance history response:', response.data);
            
            // Safely extract data
            const data = response.data || {};
            
            if (!data.success) {
                setError(data.message || 'Failed to load attendance history');
                setAttendanceRecords([]);
                return;
            }
            
            // Ensure we have an array
            let records = Array.isArray(data.attendance) ? data.attendance : [];
            console.log('Attendance records:', records);
            
            // Filter by status on client side if needed - guard against invalid records
            if (filterStatus !== 'all') {
                records = records.filter(r => r && r.status === filterStatus);
            }
            
            setAttendanceRecords(records);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || records.length
            }));
        } catch (err) {
            console.error('Error fetching attendance history:', err);
            console.error('Error response:', err.response?.data);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load attendance history';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        try {
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
                    {status || 'Unknown'}
                </span>
            );
        } catch (err) {
            console.error('Error in getStatusBadge:', err, status);
            return <span>Unknown</span>;
        }
    };

    const getStudentName = (student) => {
        try {
            if (!student) return 'N/A';
            if (typeof student === 'string') return student;
            return student.name || student.firstName + ' ' + (student.lastName || '') || student.studentId || 'N/A';
        } catch (err) {
            console.error('Error in getStudentName:', err, student);
            return 'N/A';
        }
    };

    const columns = [
        {
            header: 'Student',
            accessor: 'student.name',
            render: (value, row) => {
                try {
                    const student = row.student || {};
                    const name = student.name || (student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : 'N/A');
                    const studentId = student.studentId || student.username || 'N/A';
                    return (
                        <div>
                            <div style={{ fontWeight: '500' }}>{name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {studentId}</div>
                        </div>
                    );
                } catch (err) {
                    console.error('Error rendering student column:', err, row);
                    return 'Error';
                }
            }
        },
        {
            header: 'Course',
            accessor: 'courseName',
            render: (value, row) => {
                try {
                    return (
                        <div>
                            <div>{row.courseName || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.courseCode || ''}</div>
                        </div>
                    );
                } catch (err) {
                    console.error('Error rendering course column:', err, row);
                    return 'Error';
                }
            }
        },
        {
            header: 'Date',
            accessor: 'date',
            render: (value, row) => {
                try {
                    return formatDate(row.date, true);
                } catch (err) {
                    console.error('Error rendering date column:', err, row);
                    return 'N/A';
                }
            }
        },
        {
            header: 'Time',
            accessor: 'time',
            render: (value, row) => {
                try {
                    const startTime = row.startTime || '';
                    const endTime = row.endTime || '';
                    return startTime && endTime ? `${startTime} - ${endTime}` : 'N/A';
                } catch (err) {
                    console.error('Error rendering time column:', err, row);
                    return 'N/A';
                }
            }
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (value, row) => {
                try {
                    return getStatusBadge(value || row?.status);
                } catch (err) {
                    console.error('Error rendering status column:', err, value);
                    return 'Error';
                }
            }
        },
        {
            header: 'Check-in',
            accessor: 'checkInTime',
            render: (value) => {
                try {
                    if (!value) return '-';
                    const d = new Date(value);
                    if (isNaN(d.getTime())) return '-';
                    return d.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch (err) {
                    console.warn('Check-in time formatting error:', err, 'value:', value);
                    return '-';
                }
            }
        },
        {
            header: 'Check-out',
            accessor: 'checkOutTime',
            render: (value) => {
                try {
                    if (!value) return '-';
                    const d = new Date(value);
                    if (isNaN(d.getTime())) return '-';
                    return d.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch (err) {
                    console.warn('Check-out time formatting error:', err, 'value:', value);
                    return '-';
                }
            }
        },
        {
            header: 'Marked By',
            accessor: 'markedBy.name',
            render: (value, row) => {
                try {
                    return row.markedBy?.name || 'Self';
                } catch (err) {
                    console.error('Error rendering marked by column:', err, row);
                    return 'Error';
                }
            }
        }
    ];

    const filteredRecords = (Array.isArray(attendanceRecords) ? attendanceRecords : []).filter(record => {
        if (!record || typeof record !== 'object') return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const student = record.student || {};
        const name = (student.name || (student.firstName ? `${student.firstName} ${student.lastName}` : '') || '').toLowerCase();
        const studentId = (student.studentId || student.username || '').toLowerCase();
        const course = (record.courseName || '').toLowerCase();
        
        return name.includes(term) || studentId.includes(term) || course.includes(term);
    });

    // Calculate stats - guard against invalid records and ensure array
    const safeRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];
    const stats = {
        total: safeRecords.length,
        present: safeRecords.filter(r => r && r.status === 'present').length,
        absent: safeRecords.filter(r => r && r.status === 'absent').length,
        late: safeRecords.filter(r => r && r.status === 'late').length
    };

    return (
        <DashboardLayout>
            <div className="attendance-history">
                <div className="page-header">
                    <h1>Today's Attendance</h1>
                    <p className="page-description">View today's attendance records for your lab sessions</p>
                    <button onClick={testApi} style={{ marginTop: '10px', padding: '8px 16px' }}>Test API</button>
                </div>

                {/* Stats Cards */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Records</div>
                    </div>
                    <div className="stat-card present">
                        <div className="stat-value">{stats.present}</div>
                        <div className="stat-label">Present</div>
                    </div>
                    <div className="stat-card absent">
                        <div className="stat-value">{stats.absent}</div>
                        <div className="stat-label">Absent</div>
                    </div>
                    <div className="stat-card late">
                        <div className="stat-value">{stats.late}</div>
                        <div className="stat-label">Late</div>
                    </div>
                </div>

                {/* Filters */}
                <Card className="filters-card">
                    <div className="filters-row">
                        <div className="filter-group">
                            <label>Search Student</label>
                            <input
                                type="text"
                                placeholder="Search by name or student ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        
                        <div className="filter-group">
                            <label>Date</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="filter-select"
                                    style={{ flex: 1 }}
                                />
                                <Button 
                                    variant="secondary" 
                                    size="small"
                                    onClick={() => {
                                        const today = new Date();
                                        setSelectedDate(today.toISOString().split('T')[0]);
                                    }}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    Today
                                </Button>
                            </div>
                        </div>
                        
                        <div className="filter-group">
                            <label>Select Session</label>
                            <select
                                value={selectedReservation}
                                onChange={(e) => setSelectedReservation(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Sessions</option>
                                {reservations.map(r => (
                                <option key={r._id} value={r._id}>
                                    {r.courseName} ({r.courseCode}) - {formatDate(r.date)}
                                </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>&nbsp;</label>
                            <Button variant="secondary" onClick={fetchAttendanceHistory}>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Attendance Table */}
                <Card className="table-card">
                    {loading ? (
                        <div className="loading">Loading attendance history...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="empty-state">
                            <p>No attendance records found.</p>
                        </div>
                    ) : (
                        <>
                            <Table columns={columns} data={filteredRecords} />
                            <div className="pagination-info">
                                Showing {filteredRecords.length} of {pagination.total} records
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AttendanceHistory;
