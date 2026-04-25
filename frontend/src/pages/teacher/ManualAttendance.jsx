import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './ManualAttendance.css';

const ManualAttendance = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    year: '',
    semester: '',
    department: '',
    courseCode: ''
  });
  
  // Available options from database
  const [years] = useState([1, 2, 3, 4, 5]);
  const [semesters] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [departments] = useState([
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Veterinary Medicine',
    'Business Administration',
    'Economics'
  ]);
  const [availableCourses, setAvailableCourses] = useState([]);

  const getStudentIdentifier = (student) => student.studentId || student.username || student._id;

  const getTeacherCampus = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.campus || 'Atse Tewodros';
      }
    } catch (e) {
      console.error('Error getting campus:', e);
    }
    return 'Atse Tewodros';
  };

  const campus = getTeacherCampus();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Fetch attendance sessions from backend
      const response = await api.get('/attendance/sessions');
      setSessions(response.data.sessions || []);
    } catch (err) {
      setError('Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students based on filters
  const fetchStudents = async () => {
    if (!filters.year || !filters.semester || !filters.department || !filters.courseCode) {
      setError('Please select all filters');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get('/users/students', {
        params: {
          year: filters.year,
          semester: filters.semester,
          department: filters.department,
          campus
        }
      });
      setStudents(response.data.users || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Generate a new session
  const handleGenerateSession = async () => {
    if (!filters.year || !filters.semester || !filters.department || !filters.courseCode) {
      setError('Please select all filters (Year, Semester, Department, Course)');
      return;
    }

    try {
      setLoading(true);
      
      // Find matching lab from reservations
      const matchingReservations = sessions.filter(r => 
        r.courseCode?.toLowerCase().includes(filters.courseCode.toLowerCase()) ||
        r.courseName?.toLowerCase().includes(filters.courseCode.toLowerCase())
      );

      const sessionData = {
        year: parseInt(filters.year),
        semester: parseInt(filters.semester),
        department: filters.department,
        courseCode: filters.courseCode,
        campus,
        reservationId: matchingReservations.length > 0 ? matchingReservations[0]._id : null,
        status: 'generated',
        teacher: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null,
        createdAt: new Date()
      };

      // Save session to backend
      const response = await api.post('/attendance/sessions', sessionData);
      
      if (response.data.success) {
        const newSession = response.data.session;
        setSessions(prev => [newSession, ...prev]);
        setSuccessMessage('Session generated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Fetch students for this session
        await fetchStudents();
      }
      
    } catch (err) {
      setError('Failed to generate session: ' + (err.response?.data?.message || err.message));
      console.error('Error generating session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start a session
  const handleStartSession = async (session) => {
    try {
      // Start the session in backend
      const startResponse = await api.patch(`/attendance/sessions/${session._id}/start`);
      
      const startedSession = startResponse.data.session || { ...session, startedAt: new Date(), status: 'active' };
      setActiveSession(startedSession);
      setSuccessMessage('Session started! You can now mark attendance.');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Fetch students from session endpoint
      const response = await api.get(`/attendance/sessions/${session._id}/students`);
      const studentsData = (response.data.students || []).map(student => ({
        ...student,
        attendanceStatus: student.attendanceStatus || 'absent'
      }));
      setStudents(studentsData);
    } catch (err) {
      setError('Failed to start session: ' + (err.response?.data?.message || err.message));
      console.error('Error starting session:', err);
    }
  };

  const fetchStudentsForSession = async (session) => {
    try {
      const response = await api.get('/users/students', {
        params: {
          year: session.year,
          semester: session.semester,
          department: session.department,
          campus
        }
      });
      
      // Initialize attendance for each student
      const studentsWithAttendance = (response.data.users || []).map(student => ({
        ...student,
        attendanceStatus: 'absent',
        markedAt: null
      }));
      
      setStudents(studentsWithAttendance);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // Mark student attendance manually
  const handleMarkAttendance = async (studentId, status) => {
    if (!activeSession) {
      setError('Please start a session first');
      return;
    }

    try {
      const student = students.find(s => s._id === studentId);
      const studentIdentifier = student ? getStudentIdentifier(student) : studentId;

      const response = await api.post(`/attendance/sessions/${activeSession._id}/mark`, {
        studentId: studentIdentifier,
        status
      });

      const savedStatus = response.data?.status || status;

      setStudents(prev => prev.map(s => {
        if (s._id === studentId) {
          return {
            ...s,
            attendanceStatus: savedStatus,
            markedAt: savedStatus === 'absent' ? null : new Date()
          };
        }
        return s;
      }));

      setSuccessMessage(`${student?.firstName || 'Student'} marked ${savedStatus} successfully`);
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('Failed to mark attendance: ' + (err.response?.data?.message || err.message));
      console.error('Error marking attendance:', err);
    }
  };

  // Mark all students as present
  const handleMarkAllPresent = async () => {
    if (!activeSession) return;

    // Save all to backend
    try {
      const markedAt = new Date();
      const updatedStatuses = {};

      for (const student of students) {
        const response = await api.post(`/attendance/sessions/${activeSession._id}/mark`, {
          studentId: getStudentIdentifier(student),
          status: 'present'
        });
        updatedStatuses[student._id] = response.data?.status || 'present';
      }
      setStudents(prev => prev.map(s => ({
        ...s,
        attendanceStatus: updatedStatuses[s._id] || s.attendanceStatus,
        markedAt: (updatedStatuses[s._id] || s.attendanceStatus) === 'absent' ? null : markedAt
      })));
      setSuccessMessage('Attendance saved for all students');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to mark all students present');
      console.error('Error marking all present:', err);
    }
  };

  // Mark all students as absent
  const handleMarkAllAbsent = async () => {
    if (!activeSession) return;

    // Save all to backend
    try {
      for (const student of students) {
        await api.post(`/attendance/sessions/${activeSession._id}/mark`, {
          studentId: getStudentIdentifier(student),
          status: 'absent'
        });
      }
      setStudents(prev => prev.map(s => ({
        ...s,
        attendanceStatus: 'absent',
        markedAt: null
      })));
      setSuccessMessage('All students marked as absent');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to mark all students absent');
      console.error('Error marking all absent:', err);
    }
  };

  // End session
  const handleEndSession = async () => {
    if (!activeSession) return;
    
    try {
      await api.patch(`/attendance/sessions/${activeSession._id}/end`);
    } catch (err) {
      console.error('Error ending session:', err);
    }
    
    setActiveSession(null);
    setStudents([]);
    setFilters({ year: '', semester: '', department: '', courseCode: '' });
    setSuccessMessage('Session ended');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getAttendanceStats = () => {
    const present = students.filter(s => s.attendanceStatus === 'present').length;
    const absent = students.filter(s => s.attendanceStatus === 'absent').length;
    const late = students.filter(s => s.attendanceStatus === 'late').length;
    return { present, absent, late, total: students.length };
  };

  const stats = getAttendanceStats();

  return (
    <DashboardLayout>
      <div className="manual-attendance">
        <div className="page-header">
          <div>
            <h1>Manual Attendance</h1>
            <p>Generate session and mark student attendance manually</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Session Controls */}
        <Card title="Session Setup" className="session-setup-card">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Year *</label>
              <select name="year" value={filters.year} onChange={handleFilterChange} disabled={!!activeSession}>
                <option value="">Select Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}{getOrdinalSuffix(y)} Year</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Semester *</label>
              <select name="semester" value={filters.semester} onChange={handleFilterChange} disabled={!!activeSession}>
                <option value="">Select Semester</option>
                {semesters.map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Department *</label>
              <select name="department" value={filters.department} onChange={handleFilterChange} disabled={!!activeSession}>
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Course Code *</label>
              <input 
                type="text" 
                name="courseCode" 
                value={filters.courseCode} 
                onChange={handleFilterChange} 
                placeholder="e.g., CS101"
                disabled={!!activeSession}
              />
            </div>
          </div>

          <div className="session-actions">
            {!activeSession ? (
              <Button onClick={handleGenerateSession} disabled={loading}>
                Generate Session
              </Button>
            ) : (
              <Button variant="danger" onClick={handleEndSession}>
                End Session
              </Button>
            )}
          </div>
        </Card>

        {/* Recent Sessions - Show generated sessions that can be started */}
        {!activeSession && sessions.filter(s => s.status === 'generated').length > 0 && (
          <Card title="Generated Sessions" className="sessions-list-card">
            <div className="sessions-list">
              {sessions.filter(s => s.status === 'generated').map(session => (
                <div key={session._id} className="session-item">
                  <div className="session-info">
                    <div className="session-course">{session.courseCode}</div>
                    <div className="session-details">
                      {session.year}{getOrdinalSuffix(session.year)} Year - Semester {session.semester} - {session.department}
                    </div>
                    <div className="session-date">
                      Created: {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="session-actions">
                    <Button onClick={() => handleStartSession(session)} size="small">
                      Start Session
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Active Session Info */}
        {activeSession && (
          <Card title="Active Session" className="active-session-card">
            <div className="active-session-info">
              <div className="session-detail">
                <span className="label">Year:</span>
                <span className="value">{activeSession.year}{getOrdinalSuffix(activeSession.year)} Year</span>
              </div>
              <div className="session-detail">
                <span className="label">Semester:</span>
                <span className="value">Semester {activeSession.semester}</span>
              </div>
              <div className="session-detail">
                <span className="label">Department:</span>
                <span className="value">{activeSession.department}</span>
              </div>
              <div className="session-detail">
                <span className="label">Course:</span>
                <span className="value">{activeSession.courseCode}</span>
              </div>
              <div className="session-detail">
                <span className="label">Started:</span>
                <span className="value">{new Date(activeSession.startedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Attendance Stats */}
        {students.length > 0 && (
          <div className="attendance-stats">
            <div className="stat-card present">
              <span className="stat-value">{stats.present}</span>
              <span className="stat-label">Present</span>
            </div>
            <div className="stat-card absent">
              <span className="stat-value">{stats.absent}</span>
              <span className="stat-label">Absent</span>
            </div>
            <div className="stat-card late">
              <span className="stat-value">{stats.late}</span>
              <span className="stat-label">Late</span>
            </div>
            <div className="stat-card total">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        )}

        {/* Student List */}
        {students.length > 0 && (
          <Card title="Student Attendance" className="students-card">
            <div className="bulk-actions">
              <Button size="small" onClick={handleMarkAllPresent}>Mark All Present</Button>
              <Button size="small" variant="secondary" onClick={handleMarkAllAbsent}>Mark All Absent</Button>
            </div>
            
            <table className="students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student._id} className={student.attendanceStatus}>
                    <td>{index + 1}</td>
                    <td>{student.studentId || student.username}</td>
                    <td>{student.firstName} {student.lastName}</td>
                    <td>{student.year}</td>
                    <td>{student.department}</td>
                    <td>
                      <span className={`status-badge ${student.attendanceStatus}`}>
                        {student.attendanceStatus}
                      </span>
                    </td>
                    <td>
                      <div className="attendance-buttons">
                        <button 
                          className={`att-btn present ${student.attendanceStatus === 'present' ? 'active' : ''}`}
                          onClick={() => handleMarkAttendance(student._id, 'present')}
                        >
                          Present
                        </button>
                        <button 
                          className={`att-btn absent ${student.attendanceStatus === 'absent' ? 'active' : ''}`}
                          onClick={() => handleMarkAttendance(student._id, 'absent')}
                        >
                          Absent
                        </button>
                        <button 
                          className={`att-btn late ${student.attendanceStatus === 'late' ? 'active' : ''}`}
                          onClick={() => handleMarkAttendance(student._id, 'late')}
                        >
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {students.length === 0 && !loading && (
              <div className="empty-state">No students found for the selected filters</div>
            )}
          </Card>
        )}

        {loading && <div className="loading">Loading...</div>}
      </div>
    </DashboardLayout>
  );
};

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default ManualAttendance;
