import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './TechComputerCheck.css';

const TECH_STATUSES = [
  { value: 'available', label: 'Available', color: '#22c55e' },
  { value: 'occupied', label: 'Occupied', color: '#3b82f6' },
  { value: 'reserved', label: 'Reserved', color: '#f59e0b' },
  { value: 'maintenance', label: 'Maintenance', color: '#6b7280' },
  { value: 'broken', label: 'Broken', color: '#ef4444' }
];

const TechComputerCheck = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [workstations, setWorkstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState('');

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

  const campus = getTechnicianCampus();

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labs', { params: { campus, all: 'true' } });
      setLabs(response.data.labs || []);
      if (response.data.labs?.length > 0) {
        setSelectedLab(response.data.labs[0]);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLab) {
      fetchRooms(selectedLab._id);
    }
  }, [selectedLab]);

  const fetchRooms = async (labId) => {
    try {
      const response = await api.get(`/labs/${labId}/rooms`);
      const roomsData = response.data.rooms || [];
      setRooms(roomsData);
      
      if (roomsData.length > 0) {
        setSelectedRoom(roomsData[0]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchWorkstations();
    }
  }, [selectedRoom]);

  const fetchWorkstations = async () => {
    if (!selectedLab || !selectedRoom) return;
    
    try {
      const response = await api.get(`/labs/${selectedLab._id}/availability`, {
        params: { date: new Date().toISOString().split('T')[0] }
      });
      
      const allWorkstations = response.data.availability || [];
      
      const roomWs = allWorkstations.filter(ws => 
        ws.roomName === selectedRoom.name || 
        (!ws.roomName && selectedRoom.name)
      );
      
      if (roomWs.length === 0 && selectedRoom.workstations) {
        setWorkstations(selectedRoom.workstations);
      } else if (roomWs.length > 0) {
        setWorkstations(roomWs);
      } else {
        const startIdx = 0;
        const ws = (selectedRoom.workstations || []).slice(startIdx, startIdx + (selectedRoom.capacity || 40));
        setWorkstations(ws.length > 0 ? ws : allWorkstations.slice(0, selectedRoom.capacity || 40));
      }
    } catch (error) {
      console.error('Error fetching workstations:', error);
      if (selectedRoom.workstations) {
        setWorkstations(selectedRoom.workstations);
      }
    }
  };

  const handleStatusUpdate = async (workstationId, newStatus) => {
    if (!selectedLab) return;
    
    try {
      setUpdating(workstationId);
      const response = await api.put(`/labs/${selectedLab._id}/workstations/${workstationId}`, {
        status: newStatus
      });

      if (response.data.success) {
        setMessage('Computer status changed successfully');
        setTimeout(() => setMessage(''), 3000);
        
        setWorkstations(prev => prev.map(ws => 
          ws._id === workstationId ? { ...ws, status: newStatus } : ws
        ));
      }
    } catch (error) {
      console.error('Error updating workstation:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update computer status';
      setMessage(errorMsg);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = TECH_STATUSES.find(s => s.value === status);
    return statusConfig?.color || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const statusConfig = TECH_STATUSES.find(s => s.value === status);
    return statusConfig?.label || status;
  };

  const canUpdate = ['admin', 'superadmin', 'technician'].includes(user?.role);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="tech-computer-check">
          <div className="loading">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="tech-computer-check">
        <div className="page-header">
          <div>
            <h1>Computer Check - {campus}</h1>
            <p>Manually check and update computer status</p>
            {selectedLab && (
              <p className="lab-owner-info" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <strong>Lab Supervisor:</strong> {selectedLab.supervisor?.name || 'System'} 
                {!canUpdate && (
                  <span style={{ marginLeft: '10px', color: '#dc2626', fontWeight: '600' }}>
                    (Read-Only Mode)
                  </span>
                )}
              </p>
            )}
          </div>
          {message && <div className="status-message">{message}</div>}
        </div>

        {/* Lab Selection */}
        <Card title="Select Lab" className="lab-selector-card">
          <div className="lab-buttons">
            {labs.map(lab => (
              <button
                key={lab._id}
                className={`lab-button ${selectedLab?._id === lab._id ? 'active' : ''}`}
                onClick={() => setSelectedLab(lab)}
              >
                {lab.name}
              </button>
            ))}
          </div>
        </Card>

        {/* Room Selection */}
        {rooms.length > 0 && (
          <Card title="Select Room" className="room-selector-card">
            <div className="room-buttons">
              {rooms.map(room => (
                <button
                  key={room._id}
                  className={`room-button ${selectedRoom?._id === room._id ? 'active' : ''}`}
                  onClick={() => setSelectedRoom(room)}
                >
                  {room.name}
                  {room.type && <span className="room-type-badge">{room.type}</span>}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Computer Grid */}
        <Card title={`Computers - ${selectedLab?.name || ''} ${selectedRoom ? `- ${selectedRoom.name}` : ''}`} className="computer-grid-card">
          <div className="computer-stats">
            <span className="stat available">
              Available: {workstations.filter(w => w.status === 'available').length}
            </span>
            <span className="stat occupied">
              Occupied: {workstations.filter(w => w.status === 'occupied').length}
            </span>
            <span className="stat broken">
              Broken: {workstations.filter(w => w.status === 'broken').length}
            </span>
            <span className="stat maintenance">
              Maintenance: {workstations.filter(w => w.status === 'maintenance').length}
            </span>
          </div>

          <div className="computer-grid">
            {workstations.map((ws, idx) => (
              <div 
                key={ws._id || idx} 
                className={`computer-item ${ws.status}`}
                style={{ borderLeftColor: getStatusColor(ws.status) }}
              >
                <div className="computer-header">
                  <span className="computer-number">
                    {ws.workstationNumber || idx + 1}
                  </span>
                  <span 
                    className="computer-status"
                    style={{ backgroundColor: getStatusColor(ws.status) }}
                  >
                    {getStatusLabel(ws.status)}
                  </span>
                </div>
                
                <div className="computer-actions">
                  {TECH_STATUSES.map(status => (
                    <button
                      key={status.value}
                      className={`status-btn ${ws.status === status.value ? 'current' : ''}`}
                      style={{ 
                        backgroundColor: ws.status === status.value ? status.color : 'transparent',
                        color: ws.status === status.value ? 'white' : status.color,
                        borderColor: status.color,
                        opacity: !canUpdate && ws.status !== status.value ? 0.5 : 1
                      }}
                      onClick={() => handleStatusUpdate(ws._id, status.value)}
                      disabled={updating === ws._id || !canUpdate}
                      title={`Mark as ${status.label}`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {workstations.length === 0 && (
            <div className="empty-state">No computers found for this room</div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TechComputerCheck;