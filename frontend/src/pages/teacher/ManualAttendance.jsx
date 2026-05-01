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
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
// Filter states
  const [filters, setFilters] = useState({
    year: '',
    semester: '',
    department: '',
    courseCode: '',
    selectedReservationId: ''
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

  const getOrdinalSuffix = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

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
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(), fetchReservations()]);
      setLoading(false);
    };
    initData();
  }, []);

  const fetchSessions = async () => {
    try {
      // Fetch attendance sessions from backend
      const response = await api.get('/attendance/sessions');
      setSessions(response.data.sessions || []);
    } catch (err) {
      setError('Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
    }
  };

const fetchReservations = async () => {
    try {
      const response = await api.get('/reservations/my-reservations');
      setReservations(response.data.reservations || []);
    } catch (err) {
      setError('Failed to fetch reservations');
      console.error('Error fetching reservations:', err);
    }
  };

  // Get approved reservations that can be used for attendance
  const getApprovedReservations = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return reservations.filter(r => {
      if (r.status !== 'approved') return false;
      const resDate = new Date(r.date);
      // Allow reservations from today and past (for taking attendance for completed sessions)
      // Also show future reservations
      return resDate >= today || resDate < today;
    });
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
    // If a reservation is selected directly, use it; otherwise use filters
    const approvedReservations = getApprovedReservations();
    
    if (filters.selectedReservationId) {
      // Use selected reservation directly
      const selectedReservation = approvedReservations.find(r => r._id === filters.selectedReservationId);
      if (!selectedReservation) {
        setError('Selected reservation not found. Please select a valid reservation.');
        return;
      }
      
      try {
        setLoading(true);
        
        const sessionData = {
          year: selectedReservation.year,
          semester: selectedReservation.semester,
          department: selectedReservation.program || selectedReservation.department,
          courseCode: selectedReservation.courseCode,
          campus,
          reservationId: selectedReservation._id,
          status: 'generated',
          teacher: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null,
          createdAt: new Date()
        };
        
        const response = await api.post('/attendance/sessions', sessionData);
        
        if (response.data.success) {
          const newSession = response.data.session;
          setSessions(prev => [newSession, ...prev]);
          setSuccessMessage('Session generated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
          
          // Set filters from the reservation for fetching students later
          setFilters(prev => ({
            ...prev,
            year: String(selectedReservation.year),
            semester: String(selectedReservation.semester),
            department: selectedReservation.program || selectedReservation.department,
            courseCode: selectedReservation.courseCode
          }));
          
          // Fetch students for this session
          await fetchStudents();
        }
      } catch (err) {
        setError('Failed to generate session: ' + (err.response?.data?.message || err.message));
        console.error('Error generating session:', err);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Fallback to filter-based matching (original logic)
    if (!filters.year || !filters.semester || !filters.department || !filters.courseCode) {
      setError('Please select all filters (Year, Semester, Department, Course) or select a reservation from the dropdown.');
      return;
    }

    console.log('Current filters:', filters);
    console.log('All reservations fetched:', reservations);
    console.log('--- Starting reservation matching ---');

    try {
      setLoading(true);
      
      console.log('Approved reservations for attendance:', approvedReservations.length);
      
      // Find matching reservation using all selected filters (Year, Semester, Department, Course)
      // Note: Reservation records often use 'program' for the department field
      const matchingReservations = approvedReservations.filter(r => {
        const matchesCourse = r.courseCode?.toLowerCase().includes(filters.courseCode.toLowerCase()) ||
                            r.courseName?.toLowerCase().includes(filters.courseCode.toLowerCase());
        const matchesYear = String(r.year) === String(filters.year);
        const matchesSemester = String(r.semester) === String(filters.semester);
        // We check both 'program' and 'department' fields for robustness, ensuring case-insensitive exact match
        const matchesDept = (r.program || r.department)?.toLowerCase() === filters.department?.toLowerCase();

        console.log(`  Evaluating Reservation ID: ${r._id || 'N/A'}`);
        console.log(`    Reservation Data: Year=${r.year}, Semester=${r.semester}, Dept=${r.program || r.department}, CourseCode=${r.courseCode}, CourseName=${r.courseName}`);
        console.log(`    Filter Values: Year=${filters.year}, Semester=${filters.semester}, Dept=${filters.department}, CourseCode=${filters.courseCode}`);
        console.log(`    Match Results: Course=${matchesCourse}, Year=${matchesYear}, Semester=${matchesSemester}, Department=${matchesDept}`);

        return matchesCourse && matchesYear && matchesSemester && matchesDept;
      });

      if (matchingReservations.length === 0) {
        // Provide more helpful error message
        if (approvedReservations.length === 0) {
          setError('No approved reservations found. Please ensure you have an approved reservation before generating an attendance session. Go to Lab Reservation to create or check your reservation status.');
        } else {
          setError(`No matching reservation found for the selected filters (Year: ${filters.year}, Semester: ${filters.semester}, Department: ${filters.department}, Course: ${filters.courseCode}). Please select a reservation from the dropdown instead.`);
        }
        setLoading(false);
        return;
      } else {
        console.log('--- Matching reservations found:', matchingReservations);
      }

      const sessionData = {
        year: parseInt(filters.year),
        semester: parseInt(filters.semester),
        department: filters.department,
        courseCode: filters.courseCode,
        campus,
        reservationId: matchingReservations[0]._id, // Guaranteed to be not null now
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
    // Check both reservation (backend field name) and reservationId (alternative)
    const reservationValue = session.reservation || session.reservationId;
    if (!reservationValue) {
      setError('Cannot start session: This session was not created from a reservation. Please create a new session from an approved reservation first.');
      return;
    }

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
    setError('');

    try {
      const student = students.find(s => s._id === studentId || s.studentId === studentId || s.username === studentId);
      const studentIdentifier = student ? (student._id || student.studentId) : studentId;

      console.log('=== MARKING ATTENDANCE ===');
      console.log('Session ID:', activeSession._id);
      console.log('Student ID:', studentIdentifier);
      console.log('Status:', status);

      const response = await api.post(`/attendance/sessions/${activeSession._id}/mark`, {
        studentId: studentIdentifier,
        status
      });

      console.log('Response:', response.data);

      if (response.data.success) {
        // Use the status returned by the server (handles auto-marking 'late' if session already started)
        const savedStatus = response.data?.status || status; 

        setStudents(prev => prev.map(s => {
          const sId = s._id || s.studentId;
          if (sId === studentId || sId === studentIdentifier) {
            return {
              ...s,
              attendanceStatus: savedStatus,
              markedAt: savedStatus === 'absent' ? null : new Date()
            };
          }
          return s;
        }));

        // Show success message
        const displayMsg = savedStatus === 'present' 
          ? 'Student attended successfully' 
          : `Student marked as ${savedStatus}`;
        setSuccessMessage(displayMsg);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.data.message || 'Failed to mark attendance');
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
      console.error('Response error:', err.response?.data);
      setError('Failed to mark attendance: ' + (err.response?.data?.message || err.message));
    }
  };

  // Mark all students as present
  const handleMarkAllPresent = async () => {
    if (!activeSession || !students.length) return;

    try {
      // Optimistically update UI
      const markedAt = new Date();
      setStudents(prev => prev.map(student => ({
        ...student,
        attendanceStatus: 'present',
        markedAt: markedAt
      })));
      setSuccessMessage('Marking attendance for all students...');

      // Mark all students in parallel
      const markPromises = students.map(student =>
        api.post(`/attendance/sessions/${activeSession._id}/mark`, {
          studentId: getStudentIdentifier(student),
          status: 'present'
        })
      );

      // Wait for all marks to complete
      await Promise.all(markPromises);

      setSuccessMessage('Attendance saved for all students');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      // Revert optimistic update on error
      setStudents(prev => prev.map(student => ({
        ...student,
        attendanceStatus: 'absent',
        markedAt: null
      })));
      setError('Failed to mark all students present');
      console.error('Error marking all present:', err);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Mark all students as absent
  const handleMarkAllAbsent = async () => {
    if (!activeSession) return;
    setError('');
    setLoading(true);

    try {
      // Mark all in parallel for performance
      const markPromises = students.map(student =>
        api.post(`/attendance/sessions/${activeSession._id}/mark`, {
          studentId: getStudentIdentifier(student),
          status: 'absent'
        })
      );
      
      await Promise.all(markPromises);

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
    } finally {
      setLoading(false);
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
    setFilters({ year: '', semester: '', department: '', courseCode: '', selectedReservationId: '' });
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

  // Filter the list of generated sessions based on current filter selections
  const filteredGeneratedSessions = sessions.filter(s => {
    if (s.status !== 'generated') return false;
    
    // If filters are active, only show sessions that match those filters
    if (filters.year && String(s.year) !== String(filters.year)) return false;
    if (filters.semester && String(s.semester) !== String(filters.semester)) return false;
    if (filters.department && s.department?.toLowerCase() !== filters.department.toLowerCase()) return false;
    if (filters.courseCode && !s.courseCode?.toLowerCase().includes(filters.courseCode.toLowerCase())) return false;
    
    return true;
  });

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
            {/* Reservation Selection - New Option */}
            <div className="filter-group" style={{ gridColumn: '1 / -1' }}>
              <label>Select Reservation (Optional)</label>
              <select 
                name="selectedReservationId" 
                value={filters.selectedReservationId} 
                onChange={(e) => {
                  const resId = e.target.value;
                  if (resId) {
                    // Auto-fill filters from selected reservation
                    const res = reservations.find(r => r._id === resId);
                    if (res) {
                      setFilters({
                        ...filters,
                        selectedReservationId: resId,
                        year: String(res.year || ''),
                        semester: String(res.semester || ''),
                        department: res.program || res.department || '',
                        courseCode: res.courseCode || ''
                      });
                    }
                  } else {
                    setFilters({ ...filters, selectedReservationId: '' });
                  }
                }} 
                disabled={!!activeSession}
              >
                <option value="">-- Select an approved reservation --</option>
                {getApprovedReservations().map(res => (
                  <option key={res._id} value={res._id}>
                    {res.courseCode} - {res.courseName} | {res.lab?.name || 'Lab'} | {new Date(res.date).toLocaleDateString()} | {res.startTime}-{res.endTime}
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Select a reservation to auto-fill the filters below, or enter filters manually.
              </small>
            </div>
            
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
        {!activeSession && filteredGeneratedSessions.length > 0 && (
          <Card title="Generated Sessions" className="sessions-list-card">
            <div className="sessions-list">
              {filteredGeneratedSessions.map(session => (
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
                          type="button"
                          className={`att-btn present ${student.attendanceStatus === 'present' ? 'active' : ''}`}
                          onClick={() => handleMarkAttendance(student._id, 'present')}
                        >
                          Present
                        </button>
                        <button 
                          type="button"
                          className={`att-btn absent ${student.attendanceStatus === 'absent' ? 'active' : ''}`}
                          onClick={() => handleMarkAttendance(student._id, 'absent')}
                        >
                          Absent
                        </button>
                        <button 
                          type="button"
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

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManualAttendance;