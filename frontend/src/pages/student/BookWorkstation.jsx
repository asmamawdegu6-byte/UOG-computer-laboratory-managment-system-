import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import Notification from '../../components/ui/Notification';
import './BookWorkstation.css';

const BookWorkstation = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    labId: '',
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

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

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
      const selectedLab = labs.find(l => l._id === formData.labId);
      if (selectedLab) {
        setWorkstations(selectedLab.workstations || []);
      }
    }
  }, [formData.labId, labs]);

  // Check for booked workstations when date/time changes
  const checkAvailability = useCallback(async () => {
    if (!formData.labId || !formData.date || !formData.startTime || !formData.endTime) return;

    try {
      const response = await api.get('/bookings', {
        params: {
          lab: formData.labId,
          date: formData.date,
          limit: 100
        }
      });

      const existingBookings = response.data.bookings || [];
      const booked = [];

      existingBookings.forEach(booking => {
        if (booking.status === 'cancelled') return;
        // Check if time overlaps
        if (formData.startTime < booking.endTime && formData.endTime > booking.startTime) {
          booked.push(booking.workstation?.workstationId);
        }
      });

      setBookedWorkstations(booked);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  }, [formData.labId, formData.date, formData.startTime, formData.endTime]);

  useEffect(() => {
    if (step === 3) {
      checkAvailability();
    }
  }, [step, checkAvailability]);

  const handleLabSelect = (labId) => {
    setFormData({ ...formData, labId });
    setStep(2);
  };

  const handleDateTimeSubmit = (e) => {
    e.preventDefault();
    if (!formData.purpose.trim()) {
      showNotification('error', 'Please enter the purpose of your booking');
      return;
    }
    setStep(3);
  };

  const handleWorkstationSelect = (workstationId) => {
    setFormData({ ...formData, workstationId });
  };

  const handleBooking = async () => {
    if (!formData.workstationId) {
      showNotification('error', 'Please select a workstation');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/bookings', {
        labId: formData.labId,
        workstationId: formData.workstationId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose
      });

      if (response.data.success) {
        setBookingResult(response.data.booking);
        setSuccess(true);
        showNotification('success', 'Booking created successfully!');
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create booking';
      showNotification('error', errorMessage);
      
      // If conflict detected, show specific message
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
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
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
            {labs.length === 0 ? (
              <div className="empty-state">
                <p>No labs available. Please contact the administrator.</p>
              </div>
            ) : (
              <div className="labs-grid">
                {labs.map((lab) => (
                  <div
                    key={lab._id}
                    className="lab-card"
                    onClick={() => handleLabSelect(lab._id)}
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
                const isBooked = bookedWorkstations.includes(ws._id);
                const isUnavailable = ws.status !== 'available' || isBooked;
                return (
                  <div
                    key={ws._id}
                    className={`workstation ${isUnavailable ? 'occupied' : 'available'} ${formData.workstationId === ws._id ? 'selected' : ''}`}
                    onClick={() => !isUnavailable && handleWorkstationSelect(ws._id)}
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
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookWorkstation;
