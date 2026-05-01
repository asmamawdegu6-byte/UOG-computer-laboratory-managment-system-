import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './LabReservation.css';

const LabReservation = () => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [formData, setFormData] = useState({
    labId: '',
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    courseName: '',
    courseCode: '',
    semester: '',
    academicYear: '',
    year: '',
    section: '',
    program: '',
    numberOfStudents: '',
    description: '',
    requiredWorkstations: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [labsRes, reservationsRes] = await Promise.all([
        api.get('/labs'),
        api.get('/reservations/my-reservations')
      ]);
      setLabs(labsRes.data.labs || []);
      setReservations(reservationsRes.data.reservations || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setSuccess('');

    if (name === 'labId' && value) {
      const lab = labs.find(l => l._id === value);
      setSelectedLab(lab);
      setSelectedRoom(null);
      setFormData(prev => ({ ...prev, roomId: '' }));
    } else if (name === 'labId' && !value) {
      setSelectedLab(null);
      setSelectedRoom(null);
      setAvailability(null);
    } else if (name === 'roomId' && value && selectedLab) {
      const room = selectedLab.rooms?.find(r => r._id === value);
      setSelectedRoom(room);
    } else if (name === 'roomId' && !value) {
      setSelectedRoom(null);
    }
  };

  const checkAvailability = async () => {
    if (!formData.labId || !formData.date || !formData.startTime || !formData.endTime) {
      setError('Please select lab, date, start time and end time first');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return;
    }

    try {
      setCheckingAvailability(true);
      const response = await api.get('/reservations', {
        params: {
          lab: formData.labId,
          status: 'approved'
        }
      });

      const approvedReservations = response.data.reservations || [];
      const selectedDate = new Date(formData.date).toDateString();

      // Filter by date first
      let dateReservations = approvedReservations.filter(r => {
        const resDate = new Date(r.date).toDateString();
        return resDate === selectedDate;
      });

      // If room is selected, filter by room as well
      if (formData.roomId) {
        const selectedRoom = selectedLab?.rooms?.find(r => r._id === formData.roomId);
        dateReservations = dateReservations.filter(r => {
          // Either no room selected for that reservation OR same room
          if (!r.roomId) return true; // Legacy reservations without room
          return r.roomId === formData.roomId || r.roomId === selectedRoom?._id;
        });
      }

      const conflicts = dateReservations.filter(r => {
        const existingStart = r.startTime;
        const existingEnd = r.endTime;
        return (formData.startTime < existingEnd && formData.endTime > existingStart);
      });

      if (conflicts.length > 0) {
        setAvailability({
          available: false,
          conflicts: conflicts.map(c => ({
            course: c.courseName,
            courseCode: c.courseCode,
            room: c.roomName || 'Lab',
            time: `${c.startTime} - ${c.endTime}`,
            teacher: c.teacher?.name || 'Unknown'
          }))
        });
      } else {
        setAvailability({ available: true, conflicts: [] });
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.labId) {
      setError('Please select a lab');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return;
    }

    const capacity = selectedRoom ? selectedRoom.capacity : selectedLab?.capacity;
    if (parseInt(formData.numberOfStudents) > capacity) {
      setError(`Number of students exceeds capacity (${capacity})`);
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        labId: formData.labId,
        roomId: formData.roomId || undefined,
        courseName: formData.courseName,
        courseCode: formData.courseCode,
        semester: formData.semester || undefined,
        academicYear: formData.academicYear || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        section: formData.section || undefined,
        program: formData.program || undefined,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        numberOfStudents: parseInt(formData.numberOfStudents, 10),
        requiredWorkstations: formData.requiredWorkstations ? parseInt(formData.requiredWorkstations, 10) : undefined,
        description: formData.description
      };

      const response = await api.post('/reservations', data);

      if (response.data.success) {
        setSuccess('Reservation submitted successfully! Waiting for admin approval.');
        setFormData({
          labId: '',
          roomId: '',
          date: '',
          startTime: '',
          endTime: '',
          courseName: '',
          courseCode: '',
          semester: '',
          academicYear: '',
          year: '',
          section: '',
          program: '',
          numberOfStudents: '',
          description: '',
          requiredWorkstations: ''
        });
        setSelectedLab(null);
        setSelectedRoom(null);
        setAvailability(null);
        const reservationsRes = await api.get('/reservations/my-reservations');
        setReservations(reservationsRes.data.reservations || []);
        setActiveTab('my');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit reservation';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      setSuccess('Reservation cancelled successfully');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to cancel reservation');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
      approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
      cancelled: { bg: '#f3f4f6', color: '#374151', label: 'Cancelled' },
      completed: { bg: '#dbeafe', color: '#1e40af', label: 'Completed' }
    };
    const s = styles[status] || styles.pending;
    return (
      <span className="status-badge" style={{ backgroundColor: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  const columns = [
    {
      header: 'Lab',
      accessor: 'lab.name',
      render: (row) => <span className="lab-name">{row.lab?.name || 'N/A'}</span>
    },
    {
      header: 'Room',
      accessor: 'roomName',
      render: (row) => <span className="room-name">{row.roomName || 'N/A'}</span>
    },
    {
      header: 'Course',
      accessor: 'courseName',
      render: (row) => (
        <div>
          <div className="course-name">{row.courseName}</div>
          <div className="course-code">{row.courseCode}</div>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => new Date(row.date).toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      })
    },
    {
      header: 'Time',
      accessor: 'startTime',
      render: (row) => `${row.startTime} - ${row.endTime}`
    },
    {
      header: 'Students',
      accessor: 'numberOfStudents'
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {row.status === 'pending' && (
            <Button variant="danger" size="small" onClick={() => handleCancel(row._id)}>
              Cancel
            </Button>
          )}
          {row.rejectionReason && (
            <span className="rejection-reason" title={row.rejectionReason}>
              Reason: {row.rejectionReason.substring(0, 30)}...
            </span>
          )}
        </div>
      )
    }
  ];

  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="lab-reservation">
        <div className="page-header">
          <div>
            <h1>Lab Reservation</h1>
            <p className="page-description">Reserve computer labs for your course sessions</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            New Reservation
          </button>
          <button
            className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            My Reservations ({reservations.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'labs' ? 'active' : ''}`}
            onClick={() => setActiveTab('labs')}
          >
            Available Labs
          </button>
        </div>

        {/* New Reservation Form */}
        {activeTab === 'new' && (
          <Card title="Create New Reservation" className="reservation-form-card">
            <form onSubmit={handleSubmit}>
              {/* Lab Selection */}
              <div className="form-section">
                <h3 className="form-section-title">Select Lab</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Lab *</label>
                    <select name="labId" value={formData.labId} onChange={handleChange} required>
                      <option value="">Choose a lab...</option>
                      {labs.map(lab => (
                        <option key={lab._id} value={lab._id}>
                          {lab.name} ({lab.code}) - {lab.capacity} seats
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedLab && selectedLab.rooms && selectedLab.rooms.length > 0 && (
                    <div className="form-group">
                      <label>Room *</label>
                      <select name="roomId" value={formData.roomId} onChange={handleChange} required>
                        <option value="">Choose a room...</option>
                        {selectedLab.rooms.map(room => (
                          <option key={room._id} value={room._id}>
                            {room.name} ({room.capacity} seats)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={today}
                      required
                    />
                  </div>
                </div>

                {/* Selected Lab Details */}
                {selectedLab && (
                  <div className="lab-details-card">
                    <div className="lab-details-header">
                      <h4>{selectedLab.name}</h4>
                      <span className="lab-code">{selectedLab.code}</span>
                    </div>
                    <div className="lab-details-grid">
                      <div className="lab-detail">
                        <span className="detail-label">Location</span>
                        <span className="detail-value">
                          {selectedLab.location?.building}, {selectedLab.location?.floor}, Room {selectedLab.location?.roomNumber}
                        </span>
                      </div>
                      <div className="lab-detail">
                        <span className="detail-label">Capacity</span>
                        <span className="detail-value">
                          {selectedRoom ? `${selectedRoom.capacity} workstations` : `${selectedLab.capacity} workstations`}
                        </span>
                      </div>
                      {selectedRoom && (
                        <div className="lab-detail">
                          <span className="detail-label">Room</span>
                          <span className="detail-value">{selectedRoom.name} ({selectedRoom.type || 'general'})</span>
                        </div>
                      )}
                      <div className="lab-detail">
                        <span className="detail-label">Facilities</span>
                        <span className="detail-value">
                          {selectedLab.facilities?.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Course Details */}
              <div className="form-section">
                <h3 className="form-section-title">Course Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Course Name *</label>
                    <input
                      type="text"
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleChange}
                      placeholder="e.g. Introduction to Programming"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Course Code *</label>
                    <input
                      type="text"
                      name="courseCode"
                      value={formData.courseCode}
                      onChange={handleChange}
                      placeholder="e.g. CS101"
                      required
                    />
                  </div>
                </div>
<div className="form-row">
                  <div className="form-group">
                    <label>Year *</label>
                    <select name="year" value={formData.year} onChange={handleChange} required>
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                      <option value="6">6th Year</option>
                      <option value="7">7th Year</option>
                      <option value="8">8th Year</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Semester *</label>
                    <select name="semester" value={formData.semester} onChange={handleChange} required>
                      <option value="">Select Semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                      <option value="7">Semester 7</option>
                      <option value="8">Semester 8</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Academic Year</label>
                    <select name="academicYear" value={formData.academicYear} onChange={handleChange}>
                      <option value="">Select Year</option>
                      <option value="2023/2024">2023/2024</option>
                      <option value="2024/2025">2024/2025</option>
                      <option value="2025/2026">2025/2026</option>
                      <option value="2026/2027">2026/2027</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Department *</label>
                    <select name="program" value={formData.program} onChange={handleChange} required>
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Veterinary Medicine">Veterinary Medicine</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Economics">Economics</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Section</label>
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      placeholder="e.g. A, B"
                    />
                  </div>
                </div>
              </div>

              {/* Time & Capacity */}
              <div className="form-section">
                <h3 className="form-section-title">Time & Capacity</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Number of Students *</label>
                    <input
                      type="number"
                      name="numberOfStudents"
                      value={formData.numberOfStudents}
                      onChange={handleChange}
                      min="1"
                      max={selectedLab?.capacity || 999}
                      placeholder={selectedLab ? `Max ${selectedLab.capacity}` : ''}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Required Workstations (optional)</label>
                    <input
                      type="number"
                      name="requiredWorkstations"
                      value={formData.requiredWorkstations}
                      onChange={handleChange}
                      min="1"
                      max={selectedLab?.capacity || 999}
                      placeholder="Leave empty for all"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (optional)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Any additional details about your session..."
                    />
                  </div>
                </div>
              </div>

              {/* Availability Check */}
              {formData.labId && formData.date && formData.startTime && formData.endTime && (
                <div className="availability-section">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={checkAvailability}
                    loading={checkingAvailability}
                  >
                    Check Availability
                  </Button>
                  {availability && (
                    <div className={`availability-result ${availability.available ? 'available' : 'unavailable'}`}>
                      {availability.available ? (
                        <div className="availability-available">
                          <span className="availability-icon">✓</span>
                          <span>Lab is available for this time slot</span>
                        </div>
                      ) : (
                        <div className="availability-unavailable">
                          <span className="availability-icon">✗</span>
                          <div>
                            <span>Lab is NOT available. Conflicts:</span>
                            <ul className="conflict-list">
                              {availability.conflicts.map((c, i) => (
                                <li key={i}>{c.course} ({c.courseCode}) - {c.room} - {c.time} - {c.teacher}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <Button type="submit" variant="primary" loading={submitting}>
                  Submit Reservation Request
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* My Reservations Tab */}
        {activeTab === 'my' && (
          <Card title="My Reservations" className="reservations-card">
            {loading ? (
              <div className="loading">Loading reservations...</div>
            ) : reservations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Reservations Yet</h3>
                <p>You haven't made any lab reservations.</p>
                <Button variant="primary" onClick={() => setActiveTab('new')}>
                  Make a Reservation
                </Button>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="reservation-stats">
                  <div className="stat-item pending">
                    <span className="stat-count">{reservations.filter(r => r.status === 'pending').length}</span>
                    <span className="stat-label">Pending</span>
                  </div>
                  <div className="stat-item approved">
                    <span className="stat-count">{reservations.filter(r => r.status === 'approved').length}</span>
                    <span className="stat-label">Approved</span>
                  </div>
                  <div className="stat-item rejected">
                    <span className="stat-count">{reservations.filter(r => r.status === 'rejected').length}</span>
                    <span className="stat-label">Rejected</span>
                  </div>
                  <div className="stat-item total">
                    <span className="stat-count">{reservations.length}</span>
                    <span className="stat-label">Total</span>
                  </div>
                </div>
                <Table columns={columns} data={reservations} />
              </>
            )}
          </Card>
        )}

        {/* Available Labs Tab */}
        {activeTab === 'labs' && (
          <Card title="Available Labs" className="labs-card">
            {loading ? (
              <div className="loading">Loading labs...</div>
            ) : labs.length === 0 ? (
              <div className="empty-state">No labs available</div>
            ) : (
              <div className="labs-grid">
                {labs.map(lab => (
                  <div key={lab._id} className="lab-card">
                    <div className="lab-card-header">
                      <h3>{lab.name}</h3>
                      <span className="lab-code-badge">{lab.code}</span>
                    </div>
                    <div className="lab-card-body">
                      <div className="lab-info-row">
                        <span className="info-icon">📍</span>
                        <span>{lab.location?.building}, {lab.location?.floor}, Room {lab.location?.roomNumber}</span>
                      </div>
                      <div className="lab-info-row">
                        <span className="info-icon">👥</span>
                        <span>{lab.capacity} Workstations</span>
                      </div>
                      <div className="lab-info-row">
                        <span className="info-icon">🔧</span>
                        <span>{lab.facilities?.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ') || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="lab-card-footer">
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => {
                          setFormData({ ...formData, labId: lab._id });
                          setSelectedLab(lab);
                          setActiveTab('new');
                        }}
                      >
                        Reserve This Lab
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LabReservation;
