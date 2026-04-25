import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './LabReservation.css';

const CAMPUS_CODES = ['MAR', 'ATF', 'HSC', 'ATW'];

const LabReservationWizard = ({ onClose, onSuccess }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userCampus = user.campus || 'ATW';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    courseName: '',
    courseCode: '',
    numberOfStudents: '',
    requiredWorkstations: '',
    description: '',
    semester: '',
    academicYear: '',
    year: '',
    section: '',
    program: ''
  });

  useEffect(() => {
    fetchLabs();
  }, []);

   useEffect(() => {
     if (selectedLab) {
       fetchRooms(selectedLab._id);
     } else {
       setRooms([]);
       setSelectedRoom(null);
     }
     setAvailability(null); // Clear schedule when lab changes
   }, [selectedLab]);

   useEffect(() => {
     setAvailability(null); // Clear schedule when room changes
   }, [selectedRoom]);

  const fetchLabs = async () => {
    try {
      const res = await api.get(`/labs?campus=${userCampus}&all=false`);
      setLabs(res.data.labs || []);
    } catch (err) {
      console.error('Error fetching labs:', err);
      setError('Failed to load labs');
    }
  };

  const fetchRooms = async (labId) => {
    try {
      const res = await api.get(`/labs/${labId}/rooms`);
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRooms([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear availability when date or time changes to avoid stale data
    if (name === 'date' || name === 'startTime' || name === 'endTime') {
      setAvailability(null);
    }
  };

  const checkAvailability = async () => {
    if (!selectedLab || !formData.date || !formData.startTime || !formData.endTime) {
      setError('Please select lab, date, start time, and end time');
      return;
    }

    setAvailabilityLoading(true);
    setError(null);
    try {
      const params = {
        labId: selectedLab._id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime
      };
      if (selectedRoom) {
        params.roomId = selectedRoom._id;
      }

      const res = await api.get('/reservations/check-availability', { params });
      setAvailability(res.data);
      
      if (!res.data.available) {
        if (!res.data.durationValid) {
          setError(`Duration exceeds 3 hour maximum (${res.data.durationHours || 0}h / ${res.data.maxHours}h max)`);
        } else {
          setError('Selected time slot conflicts with existing reservation(s)');
        }
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Availability check error:', err);
      setError(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };

   const submitReservation = async () => {
     if (!availability?.available) {
       setError('Please check availability first');
       return;
     }

     setSubmissionLoading(true);
     setError(null);
     try {
       const payload = {
         labId: selectedLab._id,
         roomId: selectedRoom ? selectedRoom._id : null,
         date: formData.date,
         startTime: formData.startTime,
         endTime: formData.endTime,
         courseName: formData.courseName,
         courseCode: formData.courseCode,
         numberOfStudents: parseInt(formData.numberOfStudents) || 1,
         requiredWorkstations: parseInt(formData.requiredWorkstations) || 1,
         description: formData.description,
         semester: formData.semester,
         academicYear: formData.academicYear,
         year: formData.year ? parseInt(formData.year) : undefined,
         section: formData.section,
         program: formData.program
       };

       const res = await api.post('/reservations', payload);
       
       // Callback to parent to refresh data
       if (onSuccess) onSuccess();
       
       setSuccess('Reservation request submitted successfully!');
       setStep(5); // Success step
     } catch (err) {
       console.error('Reservation submission error:', err);
       setError(err.response?.data?.message || 'Failed to submit reservation');
     } finally {
       setSubmissionLoading(false);
     }
   };

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    return `${h}:${m}`;
  };

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return null;
    const [h1, m1] = formData.startTime.split(':').map(Number);
    const [h2, m2] = formData.endTime.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins <= 0) return null;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  };

  const getDurationHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    const [h1, m1] = formData.startTime.split(':').map(Number);
    const [h2, m2] = formData.endTime.split(':').map(Number);
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
  };

  return (
    <div className="lab-reservation-wizard">
      {/* Progress Steps */}
      <div className="wizard-steps">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`wizard-step ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
            <span className="step-number">{step > s ? '✓' : s}</span>
            <span className="step-label">
              {s === 1 ? 'Select Lab' : s === 2 ? 'Select Room' : s === 3 ? 'Set Times' : s === 4 ? 'Review' : 'Done'}
            </span>
          </div>
        ))}
      </div>

      {/* Success */}
      {step === 5 && success && (
        <Card title="Reservation Submitted" className="success-card">
          <div className="success-message">
            <span className="success-icon">✓</span>
            <p>{success}</p>
            <p className="success-note">Your reservation request has been submitted and is pending approval.</p>
          </div>
          <div className="wizard-actions" style={{ marginTop: '1rem' }}>
            <Button variant="primary" onClick={onClose}>Close</Button>
          </div>
        </Card>
      )}

      {/* Step 1: Select Lab */}
      {step === 1 && (
        <Card title="Step 1: Select Lab" className="wizard-card">
          <div className="lab-grid">
            {labs.map(lab => (
              <div
                key={lab._id}
                className={`lab-card ${selectedLab?._id === lab._id ? 'selected' : ''}`}
                onClick={() => setSelectedLab(lab)}
              >
                <h4>{lab.name}</h4>
                <p>{lab.code}</p>
                <p className="lab-capacity">Capacity: {lab.capacity}</p>
                <p className="lab-rooms">{lab.rooms.length} rooms</p>
              </div>
            ))}
          </div>
          <div className="wizard-actions">
            <Button 
              variant="primary" 
              disabled={!selectedLab}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Select Room */}
      {step === 2 && (
        <Card title={`Step 2: Select Room - ${selectedLab?.name}`} className="wizard-card">
          <div className="room-grid">
            {rooms.map(room => (
              <div
                key={room._id}
                className={`room-card ${selectedRoom?._id === room._id ? 'selected' : ''} ${room.isActive === false ? 'disabled' : ''}`}
                onClick={() => room.isActive !== false && setSelectedRoom(room)}
              >
                <h4>{room.name}</h4>
                <p>Type: {room.type.replace('_', ' ')}</p>
                <p>Capacity: {room.capacity}</p>
                <p>Workstations: {room.workstations?.length || 0}</p>
                {room.isActive === false && <p>Currently inactive due to approved class time</p>}
              </div>
            ))}
          </div>
          <div className="wizard-actions">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button 
              variant="primary" 
              onClick={() => setStep(3)}
              disabled={!selectedRoom}
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Set Date & Time */}
      {step === 3 && (
        <Card title="Step 3: Date & Time" className="wizard-card">
          <div className="form-grid">
            <div className="form-group">
              <label>Date *</label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>Start Time *</label>
              <input 
                type="time" 
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>End Time * (max 3 hours)</label>
              <input 
                type="time" 
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
              />
            </div>
            {formData.startTime && formData.endTime && (
              <div className="duration-display">
                Duration: <strong>{calculateDuration()}</strong>
                {getDurationHours() > 3 && <span className="duration-error"> (exceeds 3 hour limit)</span>}
              </div>
            )}
          </div>

          <div className="form-section">
            <h4>Course Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Course Name *</label>
                <input 
                  type="text" 
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Programming"
                />
              </div>
              <div className="form-group">
                <label>Course Code *</label>
                <input 
                  type="text" 
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="form-group">
                <label>Number of Students *</label>
                <input 
                  type="number" 
                  name="numberOfStudents"
                  value={formData.numberOfStudents}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Required Workstations</label>
                <input 
                  type="number" 
                  name="requiredWorkstations"
                  value={formData.requiredWorkstations}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <input 
                  type="text" 
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  placeholder="e.g., Fall 2024"
                />
              </div>
              <div className="form-group">
                <label>Academic Year</label>
                <input 
                  type="text" 
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  placeholder="e.g., 2024/25"
                />
               </div>
             </div>
           </div>

            {/* Day Schedule - shown after availability check */}
           {availability && availability.daySchedule && (
             <div className="schedule-section" style={{ marginTop: '1.5rem' }}>
               <h4>Existing Reservations for {formData.date ? new Date(formData.date).toLocaleDateString() : ''}</h4>
               <p className="schedule-note">
                 {selectedRoom ? `Room: ${selectedRoom.name} (Capacity: ${selectedRoom?.capacity})` : `${selectedLab?.name} - All Rooms`}
               </p>
               
                {availability.daySchedule.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1rem' }}>No reservations for this day yet</div>
                ) : (
                  <div className="schedule-list">
                    {availability.daySchedule.map((slot) => (
                      <div 
                        key={slot.id} 
                        className={`schedule-item ${slot.isMine ? 'mine' : ''} status-${slot.status}`}
                      >
                        <div className="schedule-item-header">
                          <strong>{slot.courseName}</strong> 
                          <span className="schedule-course-code">({slot.courseCode})</span>
                          {slot.isMine && <span className="mine-badge">Yours</span>}
                        </div>
                        <div className="schedule-item-details">
                          <span className="schedule-time">⏰ {slot.startTime} - {slot.endTime}</span>
                          <span className="schedule-teacher">👤 {slot.teacher}</span>
                          <span className={`schedule-status status-${slot.status}`}>{slot.status}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show user's proposed slot if available */}
                    {availability.available && formData.startTime && formData.endTime && (
                      <div className="schedule-item proposed">
                        <div className="schedule-item-header">
                          <strong>{formData.courseName || 'Your Reservation'}</strong> 
                          <span className="schedule-course-code">({formData.courseCode || 'New'})</span>
                          <span className="proposed-badge">Proposed</span>
                        </div>
                        <div className="schedule-item-details">
                          <span className="schedule-time">⏰ {formData.startTime} - {formData.endTime}</span>
                          <span className="schedule-teacher">👤 You</span>
                          <span className="schedule-status status-pending">Pending Approval</span>
                        </div>
                      </div>
                    )}
                  </div>
                 )}
              </div>
            )}

           <div className="wizard-actions">
             <Button variant="secondary" onClick={() => {
               setStep(2);
               setAvailability(null); // Clear schedule when going back
             }}>Back</Button>
             <Button 
               variant="primary" 
               onClick={checkAvailability}
               loading={availabilityLoading}
             >
               {availability ? 'Refresh Schedule' : 'Check Availability'}
             </Button>
             {availability && availability.available && (
               <Button 
                 variant="success" 
                 onClick={() => setStep(4)}
               >
                 Continue to Review
               </Button>
             )}
           </div>

           {error && <div className="error-message">{error}</div>}
        </Card>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 4 && availability && (
        <Card title="Step 4: Review Reservation" className="wizard-card">
          {error && <div className="error-message">{error}</div>}
          {availability && !availability.available && (
            <div className="error-message">
              This time slot is not available. Conflicts: {availability.conflicts?.map(c => 
                `${c.courseName} (${c.startTime}-${c.endTime})`
              ).join(', ')}
            </div>
          )}

          {availability && availability.available && (
            <>
              <div className="review-section">
                <h4>Selected Lab & Room</h4>
                <p><strong>{selectedLab.name}</strong> ({selectedLab.code})</p>
                {selectedRoom && <p>Room: {selectedRoom.name} (Capacity: {selectedRoom.capacity})</p>}
                
                <h4>Schedule</h4>
                <p>Date: {new Date(formData.date).toLocaleDateString()}</p>
                <p>Time: {formatTime(formData.startTime)} - {formatTime(formData.endTime)}</p>
                <p>Duration: {availability.durationHours} hours (max {availability.maxHours})</p>

                <h4>Course Details</h4>
                <p>{formData.courseName} ({formData.courseCode})</p>
                <p>Students: {formData.numberOfStudents}</p>
                {formData.description && <p>{formData.description}</p>}
              </div>

              <div className="wizard-actions">
                <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
                <Button 
                  variant="primary" 
                  onClick={submitReservation}
                  loading={submissionLoading}
                >
                  Submit Reservation Request
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Error display for other steps */}
      {step !== 4 && step !== 5 && error && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
};

export default LabReservationWizard;
