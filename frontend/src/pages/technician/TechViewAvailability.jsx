import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import '../../pages/student/ViewAvailability.css';

const TechViewAvailability = () => {
  const navigate = useNavigate();
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showResults, setShowResults] = useState(false);
  const [labs, setLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [labStats, setLabStats] = useState({});

  const getTechnicianCampus = () => {
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

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      setLoadingLabs(true);
      const campus = getTechnicianCampus();
      const response = await api.get('/labs', { params: { campus, all: 'true' } });
      const allLabs = response.data.labs || [];
      setLabs(allLabs);
      
      const stats = {};
      for (const lab of allLabs) {
        const available = lab.workstations?.filter(ws => ws.status === 'available').length || 0;
        const occupied = lab.workstations?.filter(ws => ws.status === 'occupied').length || 0;
        const maintenance = lab.workstations?.filter(ws => ws.status === 'maintenance').length || 0;
        const total = lab.workstations?.length || 0;
        stats[lab._id] = { available, occupied, maintenance, total };
      }
      setLabStats(stats);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoadingLabs(false);
    }
  };

  const handleLabSelect = async (lab) => {
    setSelectedLab(lab);
    setSelectedRoom(null);
    setShowResults(true);
    await checkAvailability(lab._id, selectedDate);
  };

  const handleRoomSelect = async (room) => {
    setSelectedRoom(room);
    if (selectedLab) {
      await checkAvailability(selectedLab._id, selectedDate);
    }
  };

  const checkAvailability = async (labId, date) => {
    try {
      setLoadingAvailability(true);
      const response = await api.get(`/labs/${labId}/availability`, {
        params: { date }
      });
      setAvailabilityData(response.data);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const getRoomStats = (room) => {
    if (!availabilityData) return { available: 0, occupied: 0, maintenance: 0, total: 0 };
    
    const roomWorkstations = (availabilityData.availability || []).filter(ws => 
      ws.roomName === room.name
    );
    
    const available = roomWorkstations.filter(ws => ws.status === 'available').length;
    const occupied = roomWorkstations.filter(ws => ws.status === 'occupied' || ws.status === 'reserved').length;
    const maintenance = roomWorkstations.filter(ws => ws.status === 'maintenance').length;
    
    return { available, occupied, maintenance, total: roomWorkstations.length };
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#22c55e',
      occupied: '#ef4444',
      reserved: '#f59e0b',
      maintenance: '#6b7280'
    };
    return colors[status] || colors.available;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="view-availability">
        <div className="page-header">
          <div>
            <h1>Lab Availability - {getTechnicianCampus()}</h1>
            <p>View all labs and computer status for your campus</p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              if (selectedLab) checkAvailability(selectedLab._id, e.target.value);
            }}
            min={today}
            className="date-picker"
          />
        </div>

        {loadingLabs ? (
          <div className="loading">Loading labs...</div>
        ) : (
          <>
            {/* Lab Stats Overview */}
            <div className="lab-stats-overview">
              <Card className="stats-card">
                <h3>All Labs Summary</h3>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-value">{Object.values(labStats).reduce((a, b) => a + b.total, 0)}</span>
                    <span className="stat-label">Total PCs</span>
                  </div>
                  <div className="stat-item available">
                    <span className="stat-value">{Object.values(labStats).reduce((a, b) => a + b.available, 0)}</span>
                    <span className="stat-label">Available</span>
                  </div>
                  <div className="stat-item occupied">
                    <span className="stat-value">{Object.values(labStats).reduce((a, b) => a + b.occupied, 0)}</span>
                    <span className="stat-label">Occupied</span>
                  </div>
                  <div className="stat-item maintenance">
                    <span className="stat-value">{Object.values(labStats).reduce((a, b) => a + b.maintenance, 0)}</span>
                    <span className="stat-label">Maintenance</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Labs Grid */}
            <div className="labs-section">
              <h2>Select a Lab</h2>
              <div className="labs-grid">
                {labs.map((lab) => {
                  const stats = labStats[lab._id] || { available: 0, occupied: 0, maintenance: 0, total: 0 };
                  const isSelected = selectedLab?._id === lab._id;
                  
                  return (
                    <div
                      key={lab._id}
                      className={`lab-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleLabSelect(lab)}
                    >
                      <div className="lab-header">
                        <h3>{lab.name}</h3>
                        <span className="campus-badge">{lab.campus}</span>
                      </div>
                      <div className="lab-info">
                        <p>{lab.location?.building || 'N/A'} - {lab.location?.floor || 'N/A'}</p>
                      </div>
                      <div className="lab-stats">
                        <div className="lab-stat available">
                          <span className="count">{stats.available}</span>
                          <span className="label">Available</span>
                        </div>
                        <div className="lab-stat occupied">
                          <span className="count">{stats.occupied}</span>
                          <span className="label">Occupied</span>
                        </div>
                        <div className="lab-stat maintenance">
                          <span className="count">{stats.maintenance}</span>
                          <span className="label">Maintenance</span>
                        </div>
                      </div>
                      <div className="lab-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill available" 
                            style={{ width: `${stats.total > 0 ? (stats.available / stats.total) * 100 : 0}%` }}
                          />
                          <div 
                            className="progress-fill occupied" 
                            style={{ width: `${stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0}%` }}
                          />
                          <div 
                            className="progress-fill maintenance" 
                            style={{ width: `${stats.total > 0 ? (stats.maintenance / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rooms Section - Show when lab is selected */}
            {selectedLab && selectedLab.rooms && selectedLab.rooms.length > 0 && (
              <div className="rooms-section">
                <h2>{selectedLab.name} - Rooms</h2>
                <div className="rooms-grid">
                  {selectedLab.rooms.map((room) => {
                    const roomStats = getRoomStats(room);
                    const isSelected = selectedRoom?._id === room._id;
                    
                    return (
                      <div
                        key={room._id}
                        className={`room-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="room-header">
                          <h4>{room.name}</h4>
                          {room.type && (
                            <span className={`room-type ${room.type}`}>
                              {room.type === 'female_only' ? 'Female Only' : 
                               room.type === 'male_only' ? 'Male Only' : 
                               room.type}
                            </span>
                          )}
                        </div>
                        <div className="room-stats">
                          <span className="stat">
                            <span className="dot available"></span>
                            {roomStats.available} Available
                          </span>
                          <span className="stat">
                            <span className="dot occupied"></span>
                            {roomStats.occupied} Occupied
                          </span>
                          <span className="stat">
                            <span className="dot maintenance"></span>
                            {roomStats.maintenance} Maintenance
                          </span>
                        </div>
                        <div className="room-capacity">
                          Capacity: {room.capacity || 0}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Workstation Availability Grid */}
            {showResults && availabilityData && (
              <Card title={`Workstation Availability - ${selectedDate}`} className="availability-card">
                {loadingAvailability ? (
                  <div className="loading">Loading availability...</div>
                ) : (
                  <>
                    <div className="workstation-grid">
                      {(availabilityData.availability || []).map((ws, idx) => (
                        <div
                          key={ws._id || idx}
                          className={`workstation ${ws.status}`}
                          title={`PC #${ws.workstationNumber || idx + 1} - ${ws.status}`}
                        >
                          <span className="ws-number">{ws.workstationNumber || idx + 1}</span>
                          <span 
                            className="ws-status-dot"
                            style={{ backgroundColor: getStatusColor(ws.status) }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="availability-legend">
                      <span><span className="dot" style={{ backgroundColor: '#22c55e' }}></span> Available</span>
                      <span><span className="dot" style={{ backgroundColor: '#ef4444' }}></span> Occupied</span>
                      <span><span className="dot" style={{ backgroundColor: '#f59e0b' }}></span> Reserved</span>
                      <span><span className="dot" style={{ backgroundColor: '#6b7280' }}></span> Maintenance</span>
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* Reservations Info */}
            {showResults && availabilityData && availabilityData.reservations && availabilityData.reservations.length > 0 && (
              <Card title="Scheduled Classes/Trainings" className="reservations-card">
                <div className="reservations-list">
                  {availabilityData.reservations.map((res, idx) => (
                    <div key={idx} className="reservation-item">
                      <span className="res-time">{res.startTime} - {res.endTime}</span>
                      <span className="res-course">{res.courseName}</span>
                      <span className="res-teacher">{res.teacherName}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TechViewAvailability;