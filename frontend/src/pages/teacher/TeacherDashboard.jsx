import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';
import './TeacherDashboard.css';

const CAMPUS_STYLES = {
  MAR: {
    primary: '#e91e63',
    secondary: '#fce4ec',
    accent: '#c2185b',
    gradient: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)'
  },
  ATF: {
    primary: '#00bcd4',
    secondary: '#e0f7fa',
    accent: '#0097a7',
    gradient: 'linear-gradient(135deg, #00bcd4 0%, #80deea 100%)'
  },
  HSC: {
    primary: '#4caf50',
    secondary: '#e8f5e9',
    accent: '#388e3c',
    gradient: 'linear-gradient(135deg, #4caf50 0%, #a5d6a7 100%)'
  },
  ATW: {
    primary: '#3949ab',
    secondary: '#e8eaf6',
    accent: '#1a237e',
    gradient: 'linear-gradient(135deg, #3949ab 0%, #5c6bc0 100%)'
  }
};

const getCampusCode = () => {
  try {
    const stored = localStorage.getItem('selectedCampus');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.code;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.campus;
    }
  } catch (e) {
    console.error('Error getting campus code:', e);
  }
  return 'ATW';
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${h}:${m}`;
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const campusCode = getCampusCode();
  const campusStyle = CAMPUS_STYLES[campusCode] || CAMPUS_STYLES.ATW;

  const [stats, setStats] = useState([
    { label: 'Active Reservations', value: 0, icon: '📅' },
    { label: 'Total Students', value: 0, icon: '👨‍🎓' },
    { label: 'Materials Uploaded', value: 0, icon: '📤' },
    { label: 'Fault Reports', value: 0, icon: '🔧' }
  ]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState([]);
  const [labStats, setLabStats] = useState({ available: 0, occupied: 0, total: 0 });
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'all' | 'pending'
  
  // Session management state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [generatingSession, setGeneratingSession] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchReservations();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reservationsRes, materialsRes, faultsRes, labsRes] = await Promise.all([
        api.get('/reservations/my-reservations'),
        api.get('/materials/my-materials'),
        api.get('/maintenance/faults'),
        api.get('/labs?campus=' + campusCode),
      ]);

      const reservationsData = reservationsRes.data.reservations || [];
      const materials = materialsRes.data.materials || [];
      const faults = faultsRes.data.faults || [];
      const labsData = labsRes.data.labs || [];

      let available = 0, occupied = 0, total = 0;
      labsData.forEach(lab => {
        const cap = lab.capacity || 0;
        total += cap;
        available += Math.floor(cap * 0.7);
        occupied += cap - Math.floor(cap * 0.7);
      });
      setLabs(labsData);
      setLabStats({ available, occupied, total });

      const activeReservations = reservationsData.filter(r => r.status === 'approved').length;
      const totalStudents = reservationsData.reduce((sum, r) => sum + (r.numberOfStudents || 0), 0);

      setStats([
        { label: 'Active Reservations', value: activeReservations, icon: '📅' },
        { label: 'Total Students', value: totalStudents, icon: '👨‍🎓' },
        { label: 'Materials Uploaded', value: materials.length, icon: '📤' },
        { label: 'Fault Reports', value: faults.filter(f => f.status === 'open' || f.status === 'in-progress').length, icon: '🔧' }
      ]);

      const upcoming = reservationsData
        .filter(r => r.status === 'approved' && new Date(r.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5)
        .map(r => ({
          id: r._id,
          subject: r.courseName,
          lab: r.lab?.name || 'N/A',
          date: new Date(r.date).toLocaleDateString(),
          time: `${formatTime(r.startTime)} - ${formatTime(r.endTime)}`,
          students: r.numberOfStudents
        }));

      setUpcomingClasses(upcoming);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations/my-reservations');
      setReservations(res.data.reservations || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  // Session management functions
  const handleGenerateSession = async (reservation) => {
    try {
      setGeneratingSession(true);
      
      // Get reservation details first
      const reservationDetails = reservation;
      
      const response = await api.post('/attendance/sessions', {
        reservationId: reservation._id,
        courseCode: reservationDetails.courseCode,
        year: reservationDetails.year,
        semester: reservationDetails.semester,
        department: reservationDetails.program
      });
      
      if (response.data.success) {
        // Auto-start the session
        const sessionId = response.data.session._id;
        await api.patch(`/attendance/sessions/${sessionId}/start`);
        
        // Add to active sessions and navigate
        setActiveSessions(prev => [...prev, { ...response.data.session, reservationId: reservation._id }]);
        fetchDashboardData();
        
        // Navigate to Monitor Attendance
        navigate('/teacher/monitor-attendance', { 
          state: { selectedReservationId: reservation._id } 
        });
      }
    } catch (err) {
      console.error('Error generating session:', err);
      const msg = err.response?.data?.message || 'Failed to generate session';
      alert(msg);
    } finally {
      setGeneratingSession(false);
    }
  };

  const openSessionModal = () => {
    // Get today's approved reservations that can have sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const eligibleReservations = reservations.filter(r => {
      if (r.status !== 'approved') return false;
      const resDate = new Date(r.date);
      resDate.setHours(0, 0, 0, 0);
      // Can generate for today or past approved sessions
      return resDate <= tomorrow;
    });
    
    setSelectedReservation(eligibleReservations[0] || null);
    setShowSessionModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (activeTab === 'upcoming') {
      return r.status === 'approved' && new Date(r.date) >= new Date();
    } else if (activeTab === 'pending') {
      return r.status === 'pending';
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="teacher-dashboard" style={{ '--campus-primary': campusStyle.primary, '--campus-secondary': campusStyle.secondary, '--campus-gradient': campusStyle.gradient }}>
        <div className="dashboard-header-section">
          <div className="campus-badge" style={{ background: campusStyle.secondary, color: campusStyle.accent }}>
            Campus: {campusCode}
          </div>
          <h1 style={{ color: campusStyle.primary }}>Teacher Dashboard</h1>
          <p className="welcome-text" style={{ color: campusStyle.accent }}>Manage your lab sessions and monitor student activity.</p>
          
          <div style={{ marginTop: '1rem' }}>
            <Button variant="primary" onClick={() => navigate('/teacher/lab-reservation')}>
              + Reserve New Lab
            </Button>
            <Button variant="success" onClick={openSessionModal} style={{ marginLeft: '0.5rem' }}>
              🎯 Start Session
            </Button>
            <Button variant="info" onClick={() => window.open('https://t.me/uog_computer_lab_bot', '_blank')} style={{ marginLeft: '0.5rem' }}>
              📱 Telegram Bot
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading dashboard data...</div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <Card key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </Card>
              ))}
            </div>

            {/* Upcoming Classes */}
            <Card title="Upcoming Lab Sessions" className="sessions-card">
              {upcomingClasses.length === 0 ? (
                <div className="empty-state">No upcoming sessions</div>
              ) : (
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Lab</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingClasses.map((session) => (
                      <tr key={session.id}>
                        <td>{session.subject}</td>
                        <td>{session.lab}</td>
                        <td>{session.date}</td>
                        <td>{session.time}</td>
                        <td>{session.students}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* My Reservations Section */}
            <Card 
              title="My Lab Reservations" 
              className="reservations-card"
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>My Lab Reservations</h3>
                  <Button variant="secondary" size="small" onClick={() => navigate('/teacher/my-reservations')}>
                    View All
                  </Button>
                </div>
              }
            >
              <div className="tab-navigation">
                <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
                  Upcoming
                </button>
                <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                  Pending
                </button>
                <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                  All
                </button>
              </div>

              {filteredReservations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No reservations found</h3>
                  <p>Click "Reserve New Lab" to book a lab room.</p>
                </div>
              ) : (
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Lab</th>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Students</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div className="course-name">{r.courseName}</div>
                          <div className="course-code">{r.courseCode}</div>
                        </td>
                        <td>{r.lab?.name || 'N/A'}</td>
                        <td>{r.roomName || 'N/A'}</td>
                        <td>{new Date(r.date).toLocaleDateString()}</td>
                        <td>{formatTime(r.startTime)} - {formatTime(r.endTime)}</td>
                        <td>{r.numberOfStudents}</td>
                        <td>
                          <span 
                            className="status-badge" 
                            style={{ 
                              backgroundColor: getStatusColor(r.status) + '20',
                              color: getStatusColor(r.status),
                              border: `1px solid ${getStatusColor(r.status)}`
                            }}
                          >
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Lab Availability Chart */}
            <Card title="Lab Availability Overview" className="availability-card">
              {labs.length === 0 ? (
                <div className="empty-state">No labs available</div>
              ) : (
                <div className="availability-chart">
                  <div className="chart-summary">
                    <div className="summary-item available">
                      <span className="summary-value">{labStats.available}</span>
                      <span className="summary-label">Available PCs</span>
                    </div>
                    <div className="summary-item occupied">
                      <span className="summary-value">{labStats.occupied}</span>
                      <span className="summary-label">Occupied</span>
                    </div>
                    <div className="summary-item total">
                      <span className="summary-value">{labStats.total}</span>
                      <span className="summary-label">Total PCs</span>
                    </div>
                  </div>
                  <div className="bar-chart">
                    {labs.map((lab, idx) => {
                      const capacity = lab.capacity || 0;
                      const avail = Math.floor(capacity * 0.7);
                      const used = capacity - avail;
                      return (
                        <div key={idx} className="bar-item">
                          <div className="bar-label">{lab.name}</div>
                          <div className="bar-container">
                            <div className="bar-fill available" style={{ width: `${(avail / capacity) * 100}%` }} title={`${avail} available`} />
                            <div className="bar-fill occupied" style={{ width: `${(used / capacity) * 100}%` }} title={`${used} occupied`} />
                          </div>
                          <div className="bar-value">{avail}/{capacity}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-color available"></span> Available</span>
                    <span className="legend-item"><span className="legend-color occupied"></span> Occupied</span>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Session Management Modal */}
        <Modal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title="Start Attendance Session"
          size="medium"
        >
          <div className="session-modal-content">
            <p style={{ marginBottom: '1rem', color: '#64748b' }}>
              Select a lab session to generate an attendance session. You can then track student attendance.
            </p>
            
            <div className="form-group">
              <label>Select Lab Session</label>
              <select 
                className="session-selector"
                value={selectedReservation?._id || ''}
                onChange={(e) => {
                  const res = reservations.find(r => r._id === e.target.value);
                  setSelectedReservation(res || null);
                }}
              >
                <option value="">-- Select a session --</option>
                {reservations
                  .filter(r => {
                    if (r.status !== 'approved') return false;
                    const resDate = new Date(r.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    resDate.setHours(0, 0, 0, 0);
                    return resDate <= tomorrow;
                  })
                  .map(r => (
                    <option key={r._id} value={r._id}>
                      {r.courseName} ({r.courseCode}) - {r.lab?.name} - {r.roomName || 'N/A'} - {new Date(r.date).toLocaleDateString()} ({r.startTime}-{r.endTime})
                    </option>
                  ))
                }
              </select>
            </div>

            {selectedReservation && (
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f8fafc', 
                borderRadius: '0.5rem',
                marginBottom: '1rem' 
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedReservation.courseName}</h4>
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  <strong>Lab:</strong> {selectedReservation.lab?.name} {selectedReservation.roomName && `(${selectedReservation.roomName})`}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  <strong>Date:</strong> {new Date(selectedReservation.date).toLocaleDateString()}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  <strong>Time:</strong> {selectedReservation.startTime} - {selectedReservation.endTime}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  <strong>Students:</strong> {selectedReservation.numberOfStudents}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowSessionModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (selectedReservation) {
                    handleGenerateSession(selectedReservation);
                    setShowSessionModal(false);
                  }
                }}
                disabled={!selectedReservation || generatingSession}
                loading={generatingSession}
              >
                Generate Session
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
