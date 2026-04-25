import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import Notification from '../../components/ui/Notification';
import './BookWorkstation.css';

const BookWorkstation = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    labId: '',
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    workstationId: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [labsLoading, setLabsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [notification, setNotification] = useState(null);
  const [labs, setLabs] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [bookedWorkstations, setBookedWorkstations] = useState([]);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingLimit, setBookingLimit] = useState({ allowed: true, message: '' });
  const [reservationConflict, setReservationConflict] = useState(false);
  const [userGender, setUserGender] = useState(null);

  // Allowed labs for student booking - match partial names in lab names
  const allowedLabs = ['IT Lab', 'CS Lab', 'Main Library', 'Veterinary'];

  // Time slots for booking
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // Get user gender from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserGender(user.gender || null);
      }
    } catch (e) {
      console.error('Error getting user gender:', e);
    }
  }, []);

  const filteredLabs = labs.filter(lab => allowedLabs.some(allowed => lab.name.includes(allowed)));

  // Check if a room is allowed for the current user based on gender
  const isRoomAllowed = (room) => {
    if (room.isActive === false) return false;
    if (room.type === 'female_only') return userGender === 'female';
    if (room.type === 'male_only') return userGender === 'male';
    // All other room types (general, post, etc.) are allowed
    return true;
  };

  // Check if student has reached max booking limit (4 hours total)
  const checkBookingLimit = async () => {
    const { date, startTime, endTime } = formData;
    if (!date || !startTime || !endTime) return { allowed: true, message: '' };

    try {
      const response = await api.get('/bookings/my-bookings', {
        params: { upcoming: 'true' }
      });

      const bookings = response.data.bookings || [];

      // Calculate total hours used today
      const today = new Date().toISOString().split('T')[0];
      let totalHoursToday = 0;

      bookings.forEach(booking => {
        const bookingDate = new Date(booking.date).toISOString().split('T')[0];
        if (bookingDate === today && (booking.status === 'pending' || booking.status === 'confirmed')) {
          const start = parseInt(booking.startTime.split(':')[0]);
          const end = parseInt(booking.endTime.split(':')[0]);
          totalHoursToday += (end - start);
        }
      });

      // Calculate requested hours
      const requestStart = parseInt(startTime.split(':')[0]);
      const requestEnd = parseInt(endTime.split(':')[0]);
      const requestedHours = requestEnd - requestStart;

      const maxAllowedHours = 4;
      const remainingHours = maxAllowedHours - totalHoursToday;

      if (remainingHours <= 0) {
        return { allowed: false, message: `You have reached your maximum booking limit of ${maxAllowedHours} hours for today.` };
      }

      if (requestedHours > remainingHours) {
        return { allowed: false, message: `You only have ${remainingHours} hours remaining today. Maximum allowed is ${maxAllowedHours} hours.` };
      }

      return { allowed: true, message: '' };
    } catch (error) {
      console.error('Error checking booking limit:', error);
      return { allowed: true, message: '' };
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  // Fetch labs on component mount
  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      setLabsLoading(true);
      const response = await api.get('/labs');
      setLabs(response.data.labs || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
      showNotification('error', 'Failed to load labs');
    } finally {
      setLabsLoading(false);
    }
  };

  // Fetch workstations when lab is selected
  useEffect(() => {
    if (formData.labId) {
      fetchLabWorkstations(formData.labId);
    }
  }, [formData.labId]);

  const fetchLabWorkstations = async (labId) => {
    try {
      const response = await api.get(`/labs/${labId}/rooms`);
      const rooms = response.data.rooms || [];
      // If a room is already selected, find that room's workstations
      if (formData.roomId && rooms.length > 0) {
        const room = rooms.find(r => r._id === formData.roomId);
        if (room) {
          setWorkstations(room.workstations || []);
          setSelectedRoom(room);
        }
      }
    } catch (error) {
      console.error('Error fetching lab rooms:', error);
    }
  };

  // Pre-select from query parameters (when coming from ViewAvailability)
  useEffect(() => {
    const labIdFromQuery = searchParams.get('labId');
    const roomIdFromQuery = searchParams.get('roomId');
    const roomNameFromQuery = searchParams.get('roomName');
    const labNameFromQuery = searchParams.get('labName');
    const dateFromQuery = searchParams.get('date');

    if (labIdFromQuery && roomIdFromQuery && labs.length > 0) {
      const lab = labs.find(l => l._id === labIdFromQuery);
      if (lab) {
        setFormData(prev => ({
          ...prev,
          labId: labIdFromQuery,
          roomId: roomIdFromQuery,
          date: dateFromQuery || prev.date
        }));
        setSelectedRoomName(roomNameFromQuery || '');

         // Find the room object
         const room = lab.rooms?.find(r => r._id === roomIdFromQuery);
         if (room) {
           // Check gender permission
           if (!isRoomAllowed(room)) {
             showNotification('error', 'You do not have permission to book this room.');
             setStep(1);
             return;
           }
           setSelectedRoom(room);
           setWorkstations(room.workstations || []);
         }
         setStep(2);
      }
    }
  }, [labs, searchParams]);

  // Check for booked workstations when date/time changes
  const checkAvailability = useCallback(async () => {
    const { labId, date, startTime, endTime } = formData;
    if (!labId || !date || !startTime || !endTime) return;

    try {
      const response = await api.get(`/labs/${labId}/availability`, {
        params: { date: date }
      });

      const availability = response.data.availability || [];
      const reservations = response.data.reservations || [];

      // Check if selected time overlaps with any teacher class reservation
      const hasReservationConflict = reservations.some(r =>
        startTime < r.endTime && endTime > r.startTime
      );

      // Find workstations that have bookings overlapping with selected time
      const booked = [];
      availability.forEach(ws => {
        if (ws.bookings && ws.bookings.length > 0) {
          const hasOverlap = ws.bookings.some(b =>
            (b.status === 'pending' || b.status === 'confirmed') &&
            startTime < b.endTime && endTime > b.startTime
          );
          if (hasOverlap) {
            booked.push(ws._id);
          }
        }
      });

      if (hasReservationConflict) {
        const allWorkstationIds = availability.map(ws => ws._id);
        setBookedWorkstations(allWorkstationIds);
        setReservationConflict(true);
      } else {
        setBookedWorkstations(booked);
        setReservationConflict(false);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  }, [formData.labId, formData.date, formData.startTime, formData.endTime]);

  useEffect(() => {
    if (step === 3) {
      checkAvailability();
      checkBookingLimit().then(result => setBookingLimit(result));
    }
  }, [step, checkAvailability]);

  const handleLabSelect = (labId, roomId = null, roomName = null) => {
    setFormData({ ...formData, labId, roomId: roomId || '' });
    if (roomName) {
      setSelectedRoomName(roomName);
    } else {
      setSelectedRoomName('');
      setSelectedRoom(null);
    }
    setStep(2);
  };

  const handleDateTimeSubmit = async (e) => {
    e.preventDefault();
    if (!formData.purpose.trim()) {
      showNotification('error', 'Please enter the purpose of your booking');
      return;
    }

    // Check booking limit
    const limitCheck = await checkBookingLimit();
    if (!limitCheck.allowed) {
      showNotification('error', limitCheck.message);
      setBookingLimit(limitCheck);
      return;
    }
    setBookingLimit(limitCheck);
    setStep(3);
  };

  const handleWorkstationSelect = (workstationId) => {
    setFormData({ ...formData, workstationId });
  };

  const handleBooking = async () => {
    console.log('[DEBUG] handleBooking called');
    console.log('[DEBUG] formData:', formData);

    if (!formData.workstationId) {
      showNotification('error', 'Please select a workstation');
      return;
    }

    // Check booking limit before confirming
    const limitCheck = await checkBookingLimit();
    if (!limitCheck.allowed) {
      showNotification('error', limitCheck.message);
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        labId: formData.labId,
        workstationId: String(formData.workstationId),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose
      };

      console.log('[DEBUG] Booking data:', bookingData);

      const response = await api.post('/bookings', bookingData);

      if (response.data.success) {
        setBookingResult(response.data.booking);
        setSuccess(true);
        showNotification('success', 'Booking created successfully!');
      }
    } catch (error) {
      console.error('Booking error:', error);
      let errorMessage = 'Failed to create booking';
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      showNotification('error', errorMessage);

      if (error?.response?.status === 409) {
        showNotification('error', 'This time slot is already booked. Please select a different time or workstation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedLab = labs.find(l => l._id === formData.labId);

  if (success) {
    return (
      <DashboardLayout>
        <div className="book-workstation">
          {notification && (
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
              position="top-right"
            />
          )}
          <div className="success-container">
            <div className="success-icon">&#10003;</div>
            <h1>Booking Submitted!</h1>
            <p>Your workstation booking has been submitted for admin approval.</p>
            <div className="booking-details">
              <div className="detail-item">
                <span>Lab:</span>
                <strong>{selectedLab?.name}</strong>
              </div>
              <div className="detail-item">
                <span>Room:</span>
                <strong>{selectedRoomName}</strong>
              </div>
              <div className="detail-item">
                <span>Date:</span>
                <strong>{formData.date}</strong>
              </div>
              <div className="detail-item">
                <span>Time:</span>
                <strong>{formData.startTime} - {formData.endTime}</strong>
              </div>
              <div className="detail-item">
                <span>Status:</span>
                <strong className="status-pending">Pending Approval</strong>
              </div>
            </div>
            <div className="info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p>Your booking is pending admin approval. You will be notified once it is confirmed.</p>
            </div>
            <div className="success-actions">
              <a href="/student/my-bookings" className="btn-primary">View My Bookings</a>
              <button onClick={() => window.location.reload()} className="btn-secondary">Book Another</button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (labsLoading) {
    return (
      <DashboardLayout>
        <div className="book-workstation">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>Loading labs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="book-workstation">
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
            position="top-right"
          />
        )}

        <div className="page-header">
          <h1>Book a Workstation</h1>
          <p>Select your preferred lab, date, and workstation</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Select Lab</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Date & Time</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Workstation</span>
          </div>
        </div>

        {/* Step 1: Select Lab */}
        {step === 1 && (
          <div className="step-content">
            <h2>Select a Lab</h2>
            {filteredLabs.length === 0 ? (
              <div className="empty-state">
                <p>No labs available for student booking. Please contact the administrator.</p>
              </div>
            ) : (
              <div className="labs-grid">
                {filteredLabs.map((lab) => (
                  <div
                    key={lab._id}
                    className={`lab-card ${lab.isTemporarilyInactive ? 'disabled' : ''}`}
                    onClick={() => !lab.isTemporarilyInactive && handleLabSelect(lab._id)}
                  >
                    <div className="lab-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <h3>{lab.name}</h3>
                    <p>{lab.code}</p>
                    <p>{lab.workstations?.length || lab.capacity} Workstations</p>
                    {lab.location && (
                      <p className="lab-location">
                        {lab.location.building}, {lab.location.floor}
                      </p>
                    )}
                    {lab.rooms && lab.rooms.length > 0 && (
                      <div className="lab-rooms">
                        <p className="rooms-label">Rooms:</p>
                        <div className="rooms-list">
                          {lab.rooms.map(room => (
                            <button
                              key={room._id}
                              className="room-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isRoomAllowed(room)) {
                                  handleLabSelect(lab._id, room._id, room.name);
                                } else {
                                  alert('You do not have permission to book this room.');
                                }
                              }}
                              type="button"
                              disabled={!isRoomAllowed(room)}
                              style={!isRoomAllowed(room) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                              {room.name} ({room.capacity})
                            </button>
                          ))}
                        </div>
                        <button
                          className="room-btn lab-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!lab.isTemporarilyInactive) {
                              handleLabSelect(lab._id);
                            }
                          }}
                          type="button"
                          disabled={lab.isTemporarilyInactive}
                        >
                          {lab.isTemporarilyInactive ? 'Lab In Use Now' : 'Select Entire Lab'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="step-content">
            <h2>Select Date & Time</h2>
            <div className="booking-form-card">
              <div className="selected-lab-info">
                <span>Selected Lab:</span>
                <strong>{selectedLab?.name}</strong>
                {selectedRoomName && (
                  <span className="selected-room-info">
                    <span>Room:</span>
                    <strong>{selectedRoomName}</strong>
                  </span>
                )}
              </div>
              <form onSubmit={handleDateTimeSubmit}>
                <div className="form-group">
                  <label>Purpose of Booking</label>
                  <input
                    type="text"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="e.g., Programming assignment, Lab session"
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <select
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    >
                      <option value="">Select</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <select
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    >
                      <option value="">Select</option>
                      {timeSlots.filter(t => t > formData.startTime).map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-back" onClick={() => setStep(1)}>Back</button>
                  <button type="submit" className="btn-next">Continue</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Select Workstation */}
        {step === 3 && (
          <div className="step-content">
            <h2>Select a Workstation</h2>
            {!bookingLimit.allowed && (
              <div className="booking-limit-warning">
                <p>{bookingLimit.message}</p>
              </div>
            )}
            {reservationConflict && (
              <div className="booking-limit-warning">
                <p>This lab is reserved for a teacher class during your selected time. Please choose a different time slot.</p>
              </div>
            )}
            <div className="booking-summary">
              <div className="summary-item">
                <span>Lab:</span>
                <strong>{selectedLab?.name}</strong>
              </div>
              <div className="summary-item">
                <span>Date:</span>
                <strong>{formData.date}</strong>
              </div>
              <div className="summary-item">
                <span>Time:</span>
                <strong>{formData.startTime} - {formData.endTime}</strong>
              </div>
            </div>

            <div className="workstation-grid">
              {workstations.map((ws) => {
                const wsId = ws._id?.toString?.() || ws._id;
                const isBooked = bookedWorkstations.includes(wsId);
                const isUnavailable = ws.status !== 'available' || isBooked;
                return (
                  <div
                    key={wsId}
                    className={`workstation ${isUnavailable ? 'occupied' : 'available'} ${formData.workstationId === wsId ? 'selected' : ''}`}
                    onClick={() => !isUnavailable && handleWorkstationSelect(wsId)}
                  >
                    <div className="pc-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <span>{ws.workstationNumber}</span>
                    <small>{isUnavailable ? 'Unavailable' : 'Available'}</small>
                  </div>
                );
              })}
            </div>

            <div className="legend">
              <div className="legend-item">
                <span className="dot available"></span>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="dot occupied"></span>
                <span>Unavailable</span>
              </div>
              <div className="legend-item">
                <span className="dot selected"></span>
                <span>Selected</span>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-back" onClick={() => setStep(2)}>Back</button>
              <button
                className="btn-book"
                disabled={!formData.workstationId || loading}
                onClick={handleBooking}
              >
                {loading ? <span className="spinner"></span> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookWorkstation;
