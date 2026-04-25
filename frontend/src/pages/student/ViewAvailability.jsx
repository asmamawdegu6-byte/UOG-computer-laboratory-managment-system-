import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import './ViewAvailability.css';

const ViewAvailability = () => {
  const navigate = useNavigate();
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showResults, setShowResults] = useState(false);
  const [labs, setLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [userGender, setUserGender] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Filter availability by selected room's workstations
  const getRoomAvailability = () => {
    if (!availabilityData || !selectedRoom) return null;
    
    // Get the room's index to map to lab workstations
    const labRooms = selectedLab.rooms || [];
    const roomIndex = labRooms.findIndex(r => r._id === selectedRoom._id);
    
    // Map lab workstations to this room based on capacity
    const roomCapacity = selectedRoom.capacity || 0;
    const startIdx = roomIndex >= 0 ? roomIndex * Math.ceil((selectedLab.workstations?.length || 0) / labRooms.length) : 0;
    const roomWorkstations = (availabilityData.availability || []).slice(startIdx, startIdx + roomCapacity);
    
    // If no workstations found from slice, take first N workstations
    const filtered = roomWorkstations.length > 0 ? roomWorkstations : (availabilityData.availability || []).slice(0, roomCapacity);
    
    // Calculate stats
    const available = filtered.filter(ws => ws.status === 'available').length;
    const occupied = filtered.filter(ws => ws.status === 'occupied').length;
    const maintenance = filtered.filter(ws => ws.status === 'maintenance').length;
    const reserved = filtered.filter(ws => ws.status === 'reserved').length;
    
    return {
      workstations: filtered,
      stats: { available, occupied, maintenance, reserved, total: filtered.length }
    };
  };

  // Get student's campus from user profile
  const getStudentCampus = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.campus) return user.campus;
      }
    } catch (e) {
      console.error('Error getting student campus:', e);
    }
    return null;
  };

  useEffect(() => {
    fetchLabs();
    // Get user gender from localStorage
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

  const fetchLabs = async () => {
    try {
      setLoadingLabs(true);
      const campus = getStudentCampus();
      if (!campus) {
        console.warn('No campus found for student');
        setLoadingLabs(false);
        return;
      }
      // Fetch ALL labs (including inactive) for availability view
      const response = await api.get(`/labs?campus=${encodeURIComponent(campus)}&all=true`);
      setLabs(response.data.labs || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoadingLabs(false);
    }
  };

  const handleLabSelect = (lab) => {
    setSelectedLab(lab);
    setSelectedRoom(null);
    setShowResults(false);
  };

  // Check if a room is allowed for the current user based on gender
  const isRoomAllowed = (room) => {
    if (room.isActive === false) return false;
    if (room.type === 'female_only') return userGender === 'female';
    if (room.type === 'male_only') return userGender === 'male';
    // All other room types (general, post, etc.) are allowed
    return true;
  };

  const handleRoomSelect = (room) => {
    if (!isRoomAllowed(room)) {
      alert('You do not have permission to book this room.');
      return;
    }
    setSelectedRoom(room);
    setShowResults(false);
  };

  const handleCheckAvailability = async () => {
    if (!selectedLab || !selectedRoom) return;
    setShowResults(true);
    setLoadingAvailability(true);
    try {
      const response = await api.get(`/labs/${selectedLab._id}/availability`, {
        params: { date: selectedDate }
      });
      setAvailabilityData(response.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailabilityData(null);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleBookNow = () => {
    if (!selectedLab || !selectedRoom || !selectedDate) return;
    if (!isRoomAllowed(selectedRoom)) {
      alert('You do not have permission to book this room.');
      return;
    }
    navigate(
      `/student/book?labId=${selectedLab._id}&roomId=${selectedRoom._id}&roomName=${encodeURIComponent(selectedRoom.name)}&labName=${encodeURIComponent(selectedLab.name)}&date=${selectedDate}`
    );
  };

   // Filter labs for student booking (IT, CS, Main Library, Veterinary)
   const studentLabs = labs.filter(lab => {
     const name = lab.name.toLowerCase();
     return name.includes('it lab') ||
            name.includes('cs lab') ||
            name.includes('main library') ||
            name.includes('veterinary');
   });

  return (
    <DashboardLayout>
      <div className="view-availability">
        <div className="page-header">
          <h1>View Lab Availability</h1>
          <p>Check real-time availability of computer labs and workstations</p>
        </div>

        {/* Labs Grid */}
        <div className="labs-grid">
          {loadingLabs ? (
            <p>Loading labs...</p>
          ) : studentLabs.length === 0 ? (
            <div className="empty-state">
              <p>No labs available for your campus. Please contact the administrator.</p>
            </div>
          ) : (
            studentLabs.map((lab) => (
              <div
                key={lab._id}
                className={`lab-card ${selectedLab?._id === lab._id ? 'selected' : ''}`}
                onClick={() => handleLabSelect(lab)}
              >
                <div className="lab-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h3>{lab.name}</h3>
                <p className="lab-location">
                  {lab.location?.building || 'Main Building'}, {lab.location?.floor || 'Floor 1'}
                </p>
                <span className="lab-capacity">{lab.rooms?.length || 0} Rooms</span>
                {lab.isTemporarilyInactive && <span className="gender-badge male">In Use Now</span>}
              </div>
            ))
          )}
        </div>

        {/* Rooms Section - Show when lab is selected */}
        {selectedLab && (
          <div className="rooms-section">
            <div className="rooms-header">
              <h2>{selectedLab.name} - Available Rooms</h2>
              <p>Select a room to check availability</p>
            </div>
            <div className="rooms-grid">
              {selectedLab.rooms?.map((room) => {
                const allowed = isRoomAllowed(room);
                return (
                  <div
                    key={room._id}
                    className={`room-card ${selectedRoom?._id === room._id ? 'selected' : ''} ${room.type === 'female_only' ? 'restricted-female' : room.type === 'male_only' ? 'restricted-male' : ''} ${!allowed ? 'disabled' : ''}`}
                    onClick={() => allowed && handleRoomSelect(room)}
                    style={{ cursor: allowed ? 'pointer' : 'not-allowed', opacity: allowed || selectedRoom?._id === room._id ? 1 : 0.6 }}
                  >
                    <div className="room-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    </div>
                    <h4>{room.name}</h4>
                    <p className="room-capacity">{room.capacity} Workstations</p>
                    {room.isActive === false && <span className="gender-badge male">In Use Now</span>}
                    {room.type === 'female_only' && <span className="gender-badge female">Female Only</span>}
                    {room.type === 'male_only' && <span className="gender-badge male">Male Only</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="date-section">
          <div className="date-card">
            <label>Select Date</label>
            <div className="date-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button
              className="check-btn"
              onClick={handleCheckAvailability}
              disabled={!selectedLab || !selectedRoom}
            >
              Check Availability
            </button>
          </div>
        </div>

        {/* Results Section */}
        {showResults && selectedLab && selectedRoom && (
          <div className="results-section">
            <div className="results-header">
              <div>
                <h2>Availability for {selectedLab.name} - {selectedRoom.name}</h2>
                {selectedRoom.type === 'female_only' && <span className="gender-badge female">Female Only</span>}
                {selectedRoom.type === 'male_only' && <span className="gender-badge male">Male Only</span>}
              </div>
              <span className="date-display">{selectedDate}</span>
            </div>

            {loadingAvailability ? (
              <div className="availability-loading">
                <p>Loading availability data...</p>
              </div>
            ) : availabilityData ? (
              <>
                {/* Availability Stats */}
                {(() => {
                  const roomAvail = getRoomAvailability();
                  return roomAvail ? (
                    <div className="availability-stats">
                      <div className="stat-item available">
                        <span className="stat-value">{roomAvail.stats.available}</span>
                        <span className="stat-label">Available</span>
                      </div>
                      <div className="stat-item occupied">
                        <span className="stat-value">{roomAvail.stats.occupied}</span>
                        <span className="stat-label">Occupied</span>
                      </div>
                      <div className="stat-item reserved">
                        <span className="stat-value">{roomAvail.stats.reserved}</span>
                        <span className="stat-label">Reserved</span>
                      </div>
                      <div className="stat-item maintenance">
                        <span className="stat-value">{roomAvail.stats.maintenance}</span>
                        <span className="stat-label">Maintenance</span>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Time Slots */}
                <div className="time-slots-grid">
                  <h3>Time Slots</h3>
                  <div className="time-slots">
                    {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => {
                      const hour = parseInt(time.split(':')[0]);
                      
                      // Get room workstations using same logic as getRoomAvailability
                      const labRooms = selectedLab.rooms || [];
                      const roomIndex = labRooms.findIndex(r => r._id === selectedRoom._id);
                      const roomCapacity = selectedRoom.capacity || 0;
                      const startIdx = roomIndex >= 0 ? roomIndex * Math.ceil((selectedLab.workstations?.length || 0) / labRooms.length) : 0;
                      let roomWorkstations = (availabilityData.availability || []).slice(startIdx, startIdx + roomCapacity);
                      if (roomWorkstations.length === 0) {
                        roomWorkstations = (availabilityData.availability || []).slice(0, roomCapacity);
                      }
                      const roomWsIds = roomWorkstations.map(ws => ws._id.toString());
                      
                      const availableCount = roomWorkstations.filter(ws => {
                        if (!ws.bookings || ws.bookings.length === 0) return true;
                        const hasConflict = ws.bookings.some(b => {
                          const bStart = new Date(b.startTime).getHours();
                          const bEnd = new Date(b.endTime).getHours();
                          return hour >= bStart && hour < bEnd;
                        });
                        return !hasConflict;
                      }).length;
                      const totalCount = roomWorkstations.length;
                      const isAvailable = availableCount > 0;
                      
                      return (
                        <div key={time} className={`time-slot ${isAvailable ? 'available' : 'unavailable'}`}>
                          <span className="slot-time">{time}</span>
                          <span className="slot-count">{availableCount}/{totalCount} available</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reservations info */}
                {availabilityData.reservations && availabilityData.reservations.length > 0 && (
                  <div className="reservations-info">
                    <h3>Scheduled Classes</h3>
                    {availabilityData.reservations.map((res, idx) => (
                      <div key={idx} className="reservation-item">
                        <span className="res-time">{res.startTime} - {res.endTime}</span>
                        <span className="res-course">{res.courseName} ({res.courseCode})</span>
                        <span className="res-teacher">{res.teacherName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="availability-error">
                <p>Unable to load availability data. Please try again.</p>
              </div>
            )}

            <div className="quick-book">
               <p>Ready to book? Select your time and proceed to workstation selection.</p>
               <button
                 className="book-now-btn"
                 onClick={handleBookNow}
                 disabled={!selectedLab || !selectedRoom || !isRoomAllowed(selectedRoom)}
                 style={(!selectedLab || !selectedRoom || !isRoomAllowed(selectedRoom)) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
               >
                 Book Workstation →
               </button>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewAvailability;
