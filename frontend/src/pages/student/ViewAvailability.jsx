import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import './ViewAvailability.css';

const ViewAvailability = () => {
  const [selectedLab, setSelectedLab] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Mock labs data
  const labs = [
    { id: 'lab-a', name: 'Computer Lab A', location: 'Main Building, Floor 1', totalPCs: 40 },
    { id: 'lab-b', name: 'Computer Lab B', location: 'Main Building, Floor 2', totalPCs: 35 },
    { id: 'lab-c', name: 'Computer Lab C', location: 'Science Block, Floor 1', totalPCs: 30 },
    { id: 'lab-d', name: 'Multimedia Lab', location: 'Arts Building, Floor 2', totalPCs: 25 },
    { id: 'lab-e', name: 'Programming Lab', location: 'IT Center, Floor 3', totalPCs: 45 },
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

  const handleCheckAvailability = () => {
    if (!selectedLab) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 800);
  };

  const selectedLabData = labs.find(lab => lab.id === selectedLab);

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
              onClick={() => setSelectedLab(lab.id)}
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
              <span className="lab-capacity">{lab.totalPCs} Workstations</span>
            </div>
          ))}
        </div>

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
              disabled={!selectedLab || loading}
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
        {showResults && selectedLabData && (
          <div className="results-section">
            <div className="results-header">
              <h2>Availability for {selectedLabData.name}</h2>
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
                        width: `${(slot.available / selectedLabData.totalPCs) * 100}%`,
                        backgroundColor: slot.available < 10 ? '#e74c3c' : slot.available < 20 ? '#f39c12' : '#2ecc71'
                      }}
                    />
                  </div>
                  <div className="availability-count">
                    {slot.available} / {selectedLabData.totalPCs} available
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
              <a href="/student/book" className="book-now-btn">Book Workstation →</a>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewAvailability;
