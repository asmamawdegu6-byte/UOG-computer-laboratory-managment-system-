import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { labService } from '../../services/labService';
import './LabManagement.css';

const LabManagement = () => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLab, setEditingLab] = useState(null);
    const [viewingLab, setViewingLab] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        campus: 'Maraki',
        building: '',
        floor: '',
        roomNumber: '',
        capacity: '',
        facilities: [],
        description: '',
        openingHours: {
            monday: { open: '08:00', close: '18:00' },
            tuesday: { open: '08:00', close: '18:00' },
            wednesday: { open: '08:00', close: '18:00' },
            thursday: { open: '08:00', close: '18:00' },
            friday: { open: '08:00', close: '17:00' },
            saturday: { open: '09:00', close: '13:00' },
            sunday: { open: 'closed', close: 'closed' }
        }
    });

    const availableFacilities = ['projector', 'whiteboard', 'ac', 'internet', 'printer', 'scanner'];

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }, []);

    const fetchLabs = useCallback(async () => {
        try {
            setLoading(true);
            // Get logged in user's campus for filtering
            const userStr = localStorage.getItem('user');
            let campusFilter = {};
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.campus) {
                    campusFilter = { campus: user.campus };
                }
            }
            // Superadmin sees all campuses, others see only their campus
            const data = await labService.getAllLabs({ all: true, ...campusFilter });
            setLabs(data.labs || []);
        } catch (error) {
            console.error('Error fetching labs:', error);
            showMessage('error', 'Failed to load labs');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => {
        fetchLabs();
    }, [fetchLabs]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFacilityToggle = (facility) => {
        setFormData(prev => ({
            ...prev,
            facilities: prev.facilities.includes(facility)
                ? prev.facilities.filter(f => f !== facility)
                : [...prev.facilities, facility]
        }));
    };

    const handleHoursChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [day]: {
                    ...prev.openingHours[day],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const name = formData.name.trim();
        const code = formData.code.trim();
        const campus = formData.campus.trim();
        const building = formData.building.trim();
        const floor = formData.floor.trim();
        const roomNumber = formData.roomNumber.trim();
        const capacity = formData.capacity.trim();
        const description = formData.description.trim();
        
        if (!name) {
            showMessage('error', 'Lab name is required');
            return;
        }
        if (!/^[a-zA-Z\s\-']+$/.test(name)) {
            showMessage('error', 'Lab name must contain only letters, spaces, hyphens, and apostrophes');
            return;
        }
        
        if (!code) {
            showMessage('error', 'Lab code is required');
            return;
        }
        if (!/^[A-Za-z]{3}\d{3}$/.test(code)) {
            showMessage('error', 'Lab code must be 3 letters followed by 3 numbers (e.g., LAB101)');
            return;
        }
        
        if (!campus) {
            showMessage('error', 'Campus is required');
            return;
        }
        
        if (!building) {
            showMessage('error', 'Building is required');
            return;
        }
        if (!/^[a-zA-Z\s\-']+$/.test(building)) {
            showMessage('error', 'Building must contain only letters, spaces, hyphens, and apostrophes');
            return;
        }
        
        if (!floor) {
            showMessage('error', 'Floor is required');
            return;
        }
        if (!/^\d+$/.test(floor)) {
            showMessage('error', 'Floor must be a number');
            return;
        }
        
        if (!roomNumber) {
            showMessage('error', 'Room number is required');
            return;
        }
        if (!/^\d+$/.test(roomNumber)) {
            showMessage('error', 'Room number must be a number');
            return;
        }
        
        if (!capacity) {
            showMessage('error', 'Capacity is required');
            return;
        }
        if (!/^\d+$/.test(capacity)) {
            showMessage('error', 'Capacity must be a number');
            return;
        }
        
        if (description && !/^[a-zA-Z\s\-'.0-9]+$/.test(description)) {
            showMessage('error', 'Description must contain only letters, numbers, spaces, hyphens, and apostrophes');
            return;
        }
        
        setSubmitting(true);
        try {
            const labData = {
                name,
                code: code.toUpperCase(),
                campus,
                location: {
                    building,
                    floor,
                    roomNumber
                },
                capacity: parseInt(capacity, 10),
                facilities: formData.facilities,
                description,
                openingHours: formData.openingHours
            };

            if (editingLab) {
                const result = await labService.updateLab(editingLab._id, labData);
                if (result.success) {
                    showMessage('success', result.message || 'Lab updated successfully');
                    closeModal();
                    fetchLabs();
                } else {
                    showMessage('error', result.message || 'Failed to update lab');
                }
            } else {
                const result = await labService.createLab(labData);
                if (result.success) {
                    showMessage('success', result.message || 'Lab created successfully');
                    closeModal();
                    fetchLabs();
                } else {
                    showMessage('error', result.message || 'Failed to create lab');
                }
            }
        } catch (error) {
            console.error('Error saving lab:', error);
            showMessage('error', error?.response?.data?.message || 'Failed to save lab');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            campus: 'Maraki',
            building: '',
            floor: '',
            roomNumber: '',
            capacity: '',
            facilities: [],
            description: '',
            openingHours: {
                monday: { open: '08:00', close: '18:00' },
                tuesday: { open: '08:00', close: '18:00' },
                wednesday: { open: '08:00', close: '18:00' },
                thursday: { open: '08:00', close: '18:00' },
                friday: { open: '08:00', close: '17:00' },
                saturday: { open: '09:00', close: '13:00' },
                sunday: { open: 'closed', close: 'closed' }
            }
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingLab(null);
        resetForm();
    };

    const handleEdit = (lab) => {
        setEditingLab(lab);
        setFormData({
            name: lab.name || '',
            code: lab.code || '',
            campus: lab.campus || 'Maraki',
            building: lab.location?.building || '',
            floor: lab.location?.floor || '',
            roomNumber: lab.location?.roomNumber || '',
            capacity: lab.capacity?.toString() || '',
            facilities: lab.facilities || [],
            description: lab.description || '',
            openingHours: lab.openingHours || {
                monday: { open: '08:00', close: '18:00' },
                tuesday: { open: '08:00', close: '18:00' },
                wednesday: { open: '08:00', close: '18:00' },
                thursday: { open: '08:00', close: '18:00' },
                friday: { open: '08:00', close: '17:00' },
                saturday: { open: '09:00', close: '13:00' },
                sunday: { open: 'closed', close: 'closed' }
            }
        });
        setShowModal(true);
    };

     const handleDelete = async (labId) => {
         if (!window.confirm('Are you sure you want to delete this lab?')) return;
         try {
             const result = await labService.deleteLab(labId);
             if (result.success) {
                 showMessage('success', result.message || 'Lab deleted successfully');
                 fetchLabs();
             } else {
                 showMessage('error', result.message || 'Failed to delete lab');
             }
         } catch (error) {
             console.error('Error deleting lab:', error);
             showMessage('error', 'Failed to delete lab');
         }
     };

     const handleDeleteRoom = async (labId, roomId) => {
         if (!window.confirm('Are you sure you want to delete this room? All its workstations will be removed.')) return;
         try {
             const result = await labService.deleteRoom(labId, roomId);
             if (result.success) {
                 showMessage('success', result.message || 'Room deleted successfully');
                 setViewingLab(result.lab);
                 fetchLabs();
             } else {
                 showMessage('error', result.message || 'Failed to delete room');
             }
         } catch (error) {
             console.error('Error deleting room:', error);
             showMessage('error', 'Failed to delete room');
         }
     };

    const handleToggleStatus = async (lab) => {
        try {
            const newStatus = lab.status === 'active' ? 'maintenance' : 'active';
            const result = await labService.updateLab(lab._id, { status: newStatus });
            if (result.success) {
                showMessage('success', `Lab status changed to ${newStatus}`);
                fetchLabs();
            }
        } catch (error) {
            console.error('Error toggling lab status:', error);
            showMessage('error', 'Failed to update lab status');
        }
    };

    const filteredLabs = labs.filter(lab =>
        lab.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { accessor: 'campus', header: 'Campus' },
        {
            accessor: 'name',
            header: 'Lab Name',
            render: (value, row) => (
                <button className="link-button" onClick={() => setViewingLab(row)}>
                    {typeof value === 'object' ? value.name : value}
                </button>
            )
        },
        { accessor: 'code', header: 'Code' },
        {
            accessor: 'location',
            header: 'Location',
            render: (value, row) => {
                const loc = typeof value === 'object' && value.building ? value : row?.location;
                if (loc) {
                    return `${loc.building} Bldg, ${loc.roomNumber}`;
                }
                return '-';
            }
        },
        { accessor: 'capacity', header: 'Capacity' },
        {
            accessor: 'availability',
            header: 'Availability',
            render: (_, row) => {
                const workstations = row?.workstations || [];
                const total = workstations.length;
                const available = workstations.filter(ws => ws.status === 'available').length;
                return `${available}/${total} available`;
            }
        },
        {
            accessor: 'status',
            header: 'Status',
            render: (value, row) => {
                const isActive = typeof value === 'object' ? value.isActive : value;
                return (
                    <span className={`status-badge ${isActive !== false ? 'active' : 'inactive'}`}>
                        {isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                );
            }
        },
        {
            accessor: 'actions',
            header: 'Actions',
            render: (_, row) => (
                <div className="action-buttons">
                    <Button variant="secondary" size="small" onClick={() => setViewingLab(row)}>View</Button>
                    <Button variant="secondary" size="small" onClick={() => navigate(`/admin/computer-status?lab=${row._id}`)}>Monitor</Button>
                    <Button variant="secondary" size="small" onClick={() => handleEdit(row)}>Edit</Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(row._id)}>Delete</Button>
                </div>
            )
        }
    ];

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="lab-management">
                <div className="page-header">
                    <div>
                        <h1>Lab Management</h1>
                        <p>Configure and manage computer labs and workstations</p>
                    </div>
                    <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        + Add Lab
                    </Button>
                </div>

                {message.text && (
                    <div className={`${message.type}-message`}>{message.text}</div>
                )}

                <Card className="management-card">
                    <div className="toolbar">
                        <div className="search-filter">
                            <input
                                type="text"
                                placeholder="Search labs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <Table columns={columns} data={filteredLabs} />
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title={editingLab ? 'Edit Lab' : 'Add New Lab'}
                >
                    <form onSubmit={handleSubmit} className="lab-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Lab Name *</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="code">Lab Code *</label>
                                <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} required placeholder="e.g., LAB101 (3 letters + 3 numbers)" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="campus">Campus *</label>
                            <select id="campus" name="campus" value={formData.campus} onChange={handleInputChange} required>
                                <option value="Maraki">Maraki</option>
                                <option value="Atse Tewodros">Atse Tewodros</option>
                                <option value="Atse Fasil">Atse Fasil</option>
                                <option value="Health Science College (GC)">Health Science College (GC)</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="building">Building *</label>
                                <input type="text" id="building" name="building" value={formData.building} onChange={handleInputChange} required placeholder="e.g., Science Building" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="floor">Floor *</label>
                                <input type="number" id="floor" name="floor" value={formData.floor} onChange={handleInputChange} required min="1" placeholder="e.g., 1" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="roomNumber">Room Number *</label>
                                <input type="number" id="roomNumber" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} required min="1" placeholder="e.g., 101" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="capacity">Capacity (workstations) *</label>
                            <input type="number" id="capacity" name="capacity" value={formData.capacity} onChange={handleInputChange} required min="1" />
                        </div>

                        <div className="form-group">
                            <label>Facilities</label>
                            <div className="facilities-grid">
                                {availableFacilities.map(facility => (
                                    <label key={facility} className="facility-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.facilities.includes(facility)}
                                            onChange={() => handleFacilityToggle(facility)}
                                        />
                                        <span>{facility}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                        </div>

                        <div className="form-group">
                            <label>Opening Hours</label>
                            <div className="hours-grid">
                                {Object.entries(formData.openingHours).map(([day, hours]) => (
                                    <div key={day} className="hours-row">
                                        <span className="day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                        <input type="time" value={hours.open} onChange={(e) => handleHoursChange(day, 'open', e.target.value)} disabled={hours.open === 'closed'} />
                                        <span>to</span>
                                        <input type="time" value={hours.close} onChange={(e) => handleHoursChange(day, 'close', e.target.value)} disabled={hours.close === 'closed'} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="primary" loading={submitting}>
                                {editingLab ? 'Update Lab' : 'Create Lab'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={viewingLab !== null}
                    onClose={() => setViewingLab(null)}
                    title="Laboratory Information"
                >
                    {viewingLab && (
                        <div className="detail-view">
                            <h2>{viewingLab.name} ({viewingLab.code})</h2>
                            <div className="detail-grid">
                                <div className="detail-item"><strong>Campus:</strong> {viewingLab.campus}</div>
                                <div className="detail-item"><strong>Location:</strong> {viewingLab.location?.building} Bldg, Floor {viewingLab.location?.floor}, Room {viewingLab.location?.roomNumber}</div>
                                <div className="detail-item"><strong>Capacity:</strong> {viewingLab.capacity} Workstations</div>
                                <div className="detail-item"><strong>Supervisor:</strong> {viewingLab.supervisor?.name || 'Unassigned'}</div>
                                <div className="detail-item"><strong>Status:</strong> {viewingLab.isActive ? 'Active' : 'Maintenance'}</div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <strong>Description:</strong>
                                <p>{viewingLab.description || 'No description provided.'}</p>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <strong>Facilities:</strong>
                                <div className="facilities-tags">
                                    {viewingLab.facilities?.map(f => (
                                        <span key={f} className="badge-tag">{f}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="lab-rooms-section" style={{ marginTop: '2rem' }}>
                                <h4>Rooms ({viewingLab.rooms?.length || 0})</h4>
                                <div className="rooms-list">
                                    {viewingLab.rooms?.map(room => (
                                        <div key={room._id} className="room-item">
                                            <div className="room-info">
                                                <strong>{room.name}</strong>
                                                <span className="room-type-badge">{room.type}</span>
                                                <span className="room-capacity">Capacity: {room.capacity}</span>
                                                <span className="workstation-count">{room.workstations?.length || 0} computers</span>
                                            </div>
                                            <Button
                                                variant="danger"
                                                size="small"
                                                onClick={() => handleDeleteRoom(viewingLab._id, room._id)}
                                            >
                                                Delete Room
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <Button variant="primary" onClick={() => { setEditingLab(viewingLab); handleEdit(viewingLab); setViewingLab(null); }}>Edit Lab</Button>
                                <Button variant="secondary" onClick={() => setViewingLab(null)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default LabManagement;
