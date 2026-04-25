import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import './ComputerStatus.css';

const ComputerStatus = () => {
    const getInitialCampus = () => {
        try {
            const stored = localStorage.getItem('selectedCampus');
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.name || 'Atse Tewodros';
            }
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.campus) return user.campus;
            }
        } catch (e) {
            console.error('Error getting initial campus:', e);
        }
        return 'Atse Tewodros';
    };

    const [campus, setCampus] = useState(getInitialCampus);
    const [labs, setLabs] = useState([]);
    const [selectedLab, setSelectedLab] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const labParam = searchParams.get('lab');

    const CAMPUS_OPTIONS = [
        { code: 'MAR', name: 'Maraki' },
        { code: 'ATW', name: 'Atse Tewodros' },
        { code: 'ATF', name: 'Atse Fasil' },
        { code: 'HSC', name: 'Health Science College (GC)' }
    ];

    useEffect(() => {
        if (labParam) {
            // Fetch lab directly to get its campus
            api.get(`/labs/${labParam}`)
                .then(response => {
                    if (response.data.success && response.data.lab) {
                        const lab = response.data.lab;
                        setCampus(lab.campus);
                        setSelectedLab(lab._id);
                    }
                })
                .catch(err => {
                    console.error('Error fetching lab for param:', err);
                });
        } else {
            fetchLabs();
        }
    }, [labParam]);

    useEffect(() => {
        console.log('selectedRoom changed to:', selectedRoom);
    }, [selectedRoom]);

    useEffect(() => {
        if (selectedLab) {
            fetchRooms(selectedLab);
        }
        // Reset selected room when lab changes
        setSelectedRoom(null);
    }, [selectedLab]);

    const fetchLabs = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/labs?campus=${encodeURIComponent(campus)}`);
            setLabs(response.data.labs || []);
            if (!selectedLab && response.data.labs?.length > 0) {
                setSelectedLab(response.data.labs[0]._id);
            }
        } catch (err) {
            console.error('Error fetching labs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async (labId) => {
        try {
            const response = await api.get(`/labs/${labId}/rooms`);
            console.log('Rooms API response:', JSON.stringify(response.data, null, 2).substring(0, 2000));
            setRooms(response.data.rooms || []);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    };

    const getStatusLabel = (type) => {
        const labels = {
            general: 'General',
            female_only: 'Female Only',
            male_only: 'Male Only',
            post: 'POST'
        };
        return labels[type] || type;
    };

    const getTotalStats = () => {
        const stats = { available: 0, occupied: 0, maintenance: 0, reserved: 0, total: 0 };
        rooms.forEach(room => {
            if (room.workstations) {
                room.workstations.forEach(ws => {
                    stats[ws.status] = (stats[ws.status] || 0) + 1;
                    stats.total++;
                });
            }
        });
        return stats;
    };

    const getPercentage = (value, total) => {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    };

    const stats = getTotalStats();

    const selectedRoomData = selectedRoom ? rooms.find(r => r._id === selectedRoom) : null;

    console.log('selectedRoomData:', selectedRoomData);
    console.log('rooms state:', rooms.map(r => ({ id: r._id, name: r.name, wsCount: r.workstations?.length })));

    return (
        <div className="computer-status-page">
            <div className="header">
                <div className="header-left">
                    <button className="back-button" onClick={() => navigate('/admin/labs')}>
                        ← Back to Labs
                    </button>
                    <div>
                        <h1>Computer Status Dashboard</h1>
                        <p>Monitor computer availability in real-time</p>
                    </div>
                </div>
            </div>

            <div className="campus-selector">
                <label>Select Campus:</label>
                <select value={campus} onChange={(e) => { setCampus(e.target.value); }}>
                    {CAMPUS_OPTIONS.map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="lab-selector">
                <label>Select Lab:</label>
                <select value={selectedLab || ''} onChange={(e) => setSelectedLab(e.target.value)}>
                    {labs.map(lab => (
                        <option key={lab._id} value={lab._id}>{lab.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className="content">
                    <div className="overall-stats">
                        <div className="stat-card available">
                            <div className="stat-number">{stats.available}</div>
                            <div className="stat-label">Available</div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${getPercentage(stats.available, stats.total)}%` }}></div>
                            </div>
                            <div className="stat-percentage">{getPercentage(stats.available, stats.total)}%</div>
                        </div>
                        <div className="stat-card occupied">
                            <div className="stat-number">{stats.occupied}</div>
                            <div className="stat-label">Occupied</div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${getPercentage(stats.occupied, stats.total)}%` }}></div>
                            </div>
                            <div className="stat-percentage">{getPercentage(stats.occupied, stats.total)}%</div>
                        </div>
                        <div className="stat-card maintenance">
                            <div className="stat-number">{stats.maintenance}</div>
                            <div className="stat-label">Maintenance</div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${getPercentage(stats.maintenance, stats.total)}%` }}></div>
                            </div>
                            <div className="stat-percentage">{getPercentage(stats.maintenance, stats.total)}%</div>
                        </div>
                        <div className="stat-card reserved">
                            <div className="stat-number">{stats.reserved}</div>
                            <div className="stat-label">Reserved</div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${getPercentage(stats.reserved, stats.total)}%` }}></div>
                            </div>
                            <div className="stat-percentage">{getPercentage(stats.reserved, stats.total)}%</div>
                        </div>
                    </div>

                    <div className="rooms-grid">
                        {rooms.map(room => (
                            <div
                                key={room._id}
                                className={`room-card ${selectedRoom === room._id ? 'selected' : ''}`}
                                onClick={() => {
                                    console.log('Room clicked:', room._id, room.name, 'workstations:', room.workstations?.length);
                                    setSelectedRoom(room._id);
                                    console.log('selectedRoom state set to:', room._id);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card className="room-card-inner">
                                    <div className="room-header">
                                        <h3>{room.name}</h3>
                                        <span className={`room-type ${room.type}`}>
                                            {getStatusLabel(room.type)}
                                        </span>
                                    </div>
                                    <div className="room-stats">
                                        <span className="capacity">Capacity: {room.capacity}</span>
                                    </div>
                                    <div className="computers-grid">
                                        {room.workstations && room.workstations.map(ws => (
                                            <div
                                                key={ws._id}
                                                className={`computer ${ws.status}`}
                                                title={`${ws.workstationNumber} - ${ws.status}`}
                                            >
                                                <span className="ws-number">{ws.workstationNumber}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="room-summary">
                                        <span style={{ color: '#10b981' }}>✓ {room.stats?.available || 0}</span>
                                        <span style={{ color: '#3b82f6' }}>● {room.stats?.occupied || 0}</span>
                                        <span style={{ color: '#f59e0b' }}>▲ {room.stats?.maintenance || 0}</span>
                                        <span style={{ color: '#8b5cf6' }}>◆ {room.stats?.reserved || 0}</span>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>

                    {selectedRoomData && (
                        <div className="selected-room-detail">
                            <div className="detail-header">
                                <h2>{selectedRoomData.name} - Computer Status</h2>
                                <button className="close-btn" onClick={() => setSelectedRoom(null)}>×</button>
                            </div>
                            <div className="detail-stats">
                                <div className="detail-stat available">
                                    <span className="stat-count">{selectedRoomData.stats?.available || 0}</span>
                                    <span className="stat-text">Available</span>
                                </div>
                                <div className="detail-stat occupied">
                                    <span className="stat-count">{selectedRoomData.stats?.occupied || 0}</span>
                                    <span className="stat-text">Occupied</span>
                                </div>
                                <div className="detail-stat maintenance">
                                    <span className="stat-count">{selectedRoomData.stats?.maintenance || 0}</span>
                                    <span className="stat-text">Maintenance</span>
                                </div>
                                <div className="detail-stat reserved">
                                    <span className="stat-count">{selectedRoomData.stats?.reserved || 0}</span>
                                    <span className="stat-text">Reserved</span>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem', color: '#6b7280' }}>
                                Total computers in this room: {selectedRoomData.workstations?.length || 0}
                            </div>
                            <div className="computer-grid-large">
                                {selectedRoomData.workstations && selectedRoomData.workstations.map(ws => (
                                    <div
                                        key={ws._id}
                                        className={`computer-large ${ws.status}`}
                                    >
                                        <div className="computer-icon">
                                            {ws.status === 'available' && '✓'}
                                            {ws.status === 'occupied' && '●'}
                                            {ws.status === 'maintenance' && '▲'}
                                            {ws.status === 'reserved' && '◆'}
                                        </div>
                                        <div className="computer-number">{ws.workstationNumber}</div>
                                        <div className="computer-status-label">{ws.status}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="legend">
                        <div className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                            <span>Available</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                            <span>Occupied</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                            <span>Maintenance</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></span>
                            <span>Reserved</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComputerStatus;