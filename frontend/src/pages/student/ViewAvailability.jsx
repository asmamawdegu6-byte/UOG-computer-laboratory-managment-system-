import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import './ViewAvailability.css';

const ViewAvailability = () => {
  const navigate = useNavigate();
  const [selectedLab, setSelectedLab] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Labs data with rooms
  const labs = [
    {
      id: 'it-lab',
      name: 'IT Lab',
      location: 'Main Building, Floor 1',
      totalPCs: 140,
      rooms: [
        { id: 'lab-a', name: 'Lab A', totalPCs: 40, genderRestriction: null },
        { id: 'lab-b', name: 'Lab B', totalPCs: 35, genderRestriction: null },
        { id: 'lab-c', name: 'Lab C', totalPCs: 30, genderRestriction: null },
        { id: 'post-lab', name: 'Post Lab', totalPCs: 35, genderRestriction: null }
      ]
    },
    {
      id: 'cs-lab',
      name: 'CS Lab',
      location: 'Main Building, Floor 2',
      totalPCs: 110,
      rooms: [
        { id: 'lab-d', name: 'Lab D', totalPCs: 40, genderRestriction: null },
        { id: 'lab-e', name: 'Lab E', totalPCs: 35, genderRestriction: null },
        { id: 'cs-post-lab', name: 'Post Lab', totalPCs: 35, genderRestriction: null }
      ]
    },
    {
      id: 'main-library-lab',
      name: 'Main Library Lab',
      location: 'Library Building, Floor 1',
      totalPCs: 160,
      rooms: [
        { id: 'room-1', name: 'Room 1', totalPCs: 40, genderRestriction: null },
        { id: 'room-2', name: 'Room 2', totalPCs: 40, genderRestriction: null },
        { id: 'room-3', name: 'Room 3', totalPCs: 40, genderRestriction: 'Female Only' },
        { id: 'room-4', name: 'Room 4', totalPCs: 40, genderRestriction: null }
      ]
    },
    {
      id: 'veterinary-lab',
      name: 'Veterinary Lab',
      location: 'Veterinary Building, Floor 1',
      totalPCs: 80,
      rooms: [
        { id: 'vet-room-1', name: 'Room 1', totalPCs: 40, genderRestriction: 'Male Only' },
        { id: 'vet-room-2', name: 'Room 2', totalPCs: 40, genderRestriction: 'Female Only' }
      ]
    }
  ];

  // Time slots
  const timeSlots = [
    { time: '08:00 - 09:00', available: 12 },
    { time: '09:00 - 10:00', available: 8 },
    { time: '10:00 - 11:00', available: 15 },
    { time: '11:00 - 12:00', available: 20 },
    { time: '12:00 - 13:00', available: 35 },
    { time: '13:00 - 14:00', available: 28 },
    { time: '14:00 - 15:00', available: 18 },
    { time: '15:00 - 16:00', available: 10 },
    { time: '16:00 - 17:00', available: 22 },
    { time: '17:00 - 18:00', available: 30 },
  ];

  const handleLabSelect = (labId) => {
    setSelectedLab(labId);
    setSelectedRoom('');
    setShowResults(false);
  };

  const handleRoomSelect = (roomId) => {
    setSelectedRoom(roomId);
    setShowResults(false);
  };

  const handleCheckAvailability = () => {
    if (!selectedLab || !selectedRoom) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 800);
  };

  const selectedLabData = labs.find(lab => lab.id === selectedLab);
  const selectedRoomData = selectedLabData?.rooms.find(room => room.id === selectedRoom);

  return (
    <DashboardLayout>
      <div className="view-availability">
        <div className="page-header">
          <h1>View Lab Availability</h1>
          <p>Check real-time availability of computer labs and workstations</p>
        </div>

        {/* Lab Selection Cards */}
        <div className="labs-grid">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className={`lab-card ${selectedLab === lab.id ? 'selected' : ''}`}
              onClick={() => handleLabSelect(lab.id)}
            >
              <div className="lab-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3>{lab.name}</h3>
              <p className="lab-location">{lab.location}</p>
              <span className="lab-capacity">{lab.rooms.length} Rooms</span>
            </div>
          ))}
        </div>

        {/* Rooms Section - Show when lab is selected */}
        {selectedLabData && (
          <div className="rooms-section">
            <div className="rooms-header">
              <h2>{selectedLabData.name} - Available Rooms</h2>
              <p>Select a room to check availability</p>
            </div>
            <div className="rooms-grid">
              {selectedLabData.rooms.map((room) => (
                <div
                  key={room.id}
                  className={`room-card ${selectedRoom === room.id ? 'selected' : ''} ${room.genderRestriction ? 'restricted' : ''}`}
                  onClick={() => handleRoomSelect(room.id)}
                >
                  <div className="room-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                  <h4>{room.name}</h4>
                  <p className="room-capacity">{room.totalPCs} Workstations</p>
                  {room.genderRestriction && (
                    <span className={`gender-badge ${room.genderRestriction === 'Female Only' ? 'female' : 'male'}`}>
                      {room.genderRestriction}
                    </span>
                  )}
                </div>
              ))}
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
              />
            </div>
            <button
              className="check-btn"
              onClick={handleCheckAvailability}
              disabled={!selectedLab || !selectedRoom || loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Check Availability
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {showResults && selectedLabData && selectedRoomData && (
          <div className="results-section">
            <div className="results-header">
              <div>
                <h2>Availability for {selectedLabData.name} - {selectedRoomData.name}</h2>
                {selectedRoomData.genderRestriction && (
                  <span className={`gender-badge ${selectedRoomData.genderRestriction === 'Female Only' ? 'female' : 'male'}`}>
                    {selectedRoomData.genderRestriction}
                  </span>
                )}
              </div>
              <span className="date-display">{selectedDate}</span>
            </div>

            <div className="time-slots-grid">
              {timeSlots.map((slot, index) => (
                <div key={index} className={`time-slot ${slot.available < 10 ? 'limited' : ''}`}>
                  <div className="time-label">{slot.time}</div>
                  <div className="availability-bar">
                    <div
                      className="availability-fill"
                      style={{
                        width: `${(slot.available / selectedRoomData.totalPCs) * 100}%`,
                        backgroundColor: slot.available < 10 ? '#e74c3c' : slot.available < 20 ? '#f39c12' : '#2ecc71'
                      }}
                    />
                  </div>
                  <div className="availability-count">
                    {slot.available} / {selectedRoomData.totalPCs} available
                  </div>
                </div>
              ))}
            </div>

            <div className="legend">
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#2ecc71' }}></span>
                <span>{'Good Availability (>20)'}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#f39c12' }}></span>
                <span>Limited (10-20)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: '#e74c3c' }}></span>
                <span>{'Nearly Full (<10)'}</span>
              </div>
            </div>

            <div className="quick-book">
              <p>Found a suitable time? Book your workstation now!</p>
              <button
                className="book-now-btn"
                onClick={() => {
                  const selectedLabData = labs.find(lab => lab.id === selectedLab);
                  const selectedRoomData = selectedLabData?.rooms.find(room => room.id === selectedRoom);
                  navigate(`/student/book?labName=${encodeURIComponent(selectedLabData?.name || '')}&roomName=${encodeURIComponent(selectedRoomData?.name || '')}&date=${selectedDate}`);
                }}
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
