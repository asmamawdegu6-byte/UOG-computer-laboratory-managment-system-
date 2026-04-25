import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { labService } from '../../services/labService';
import { inventoryService } from '../../services/inventoryService';
import './WorkstationManagement.css';

const WorkstationManagement = () => {
    const [workstations, setWorkstations] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLab, setFilterLab] = useState('all');
    const [filterCampus, setFilterCampus] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeTab, setActiveTab] = useState('workstations');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'computer',
        lab: '',
        status: 'operational',
        condition: 'good',
        location: '',
        notes: ''
    });

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [labsData, inventoryData] = await Promise.allSettled([
                labService.getAllLabs(),
                inventoryService.getAllItems({ limit: 1000 })
            ]);

            if (labsData.status === 'fulfilled') {
                const labsList = labsData.value.labs || [];
                setLabs(labsList);
                // Flatten workstations from all labs
                const allWorkstations = [];
                labsList.forEach(lab => {
                    if (lab.workstations && lab.workstations.length > 0) {
                        lab.workstations.forEach(ws => {
                            allWorkstations.push({
                                ...ws,
                                labName: lab.name,
                                labId: lab._id,
                                labCode: lab.code,
                                campus: lab.campus || lab.location?.campus || 'Main Campus'
                            });
                        });
                    }
                });
                setWorkstations(allWorkstations);
            }

            if (inventoryData.status === 'fulfilled') {
                setEquipment(inventoryData.value.items || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showMessage('error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (activeTab === 'equipment') {
                const itemData = {
                    name: formData.name,
                    code: formData.code,
                    category: formData.category,
                    lab: formData.lab || undefined,
                    status: formData.status,
                    condition: formData.condition,
                    location: formData.location,
                    notes: formData.notes
                };

                if (editingItem) {
                    const result = await inventoryService.updateItem(editingItem._id, itemData);
                    if (result.success) {
                        showMessage('success', 'Equipment updated successfully');
                        closeModal();
                        fetchData();
                    }
                } else {
                    const result = await inventoryService.createItem(itemData);
                    if (result.success) {
                        showMessage('success', 'Equipment added successfully');
                        closeModal();
                        fetchData();
                    }
                }
            } else {
                showMessage('info', 'Workstation management is done through Lab Management. Use the equipment tab to add standalone equipment.');
            }
        } catch (error) {
            console.error('Error saving:', error);
            showMessage('error', error?.response?.data?.message || 'Failed to save');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            category: 'computer',
            lab: '',
            status: 'operational',
            condition: 'good',
            location: '',
            notes: ''
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        resetForm();
    };

    const handleEditEquipment = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name || '',
            code: item.code || '',
            category: item.category || 'computer',
            lab: item.lab?._id || '',
            status: item.status || 'operational',
            condition: item.condition || 'good',
            location: item.location || '',
            notes: item.notes || ''
        });
        setShowModal(true);
    };

    const handleDeleteEquipment = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this equipment?')) return;
        try {
            const result = await inventoryService.deleteItem(itemId);
            if (result.success) {
                showMessage('success', 'Equipment removed successfully');
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting equipment:', error);
            showMessage('error', 'Failed to delete equipment');
        }
    };

    const handleWorkstationStatusChange = async (labId, workstationId, newStatus) => {
        try {
            const lab = labs.find(l => l._id === labId);
            if (!lab) return;

            const updatedWorkstations = lab.workstations.map(ws =>
                ws._id === workstationId ? { ...ws, status: newStatus } : ws
            );

            const result = await labService.updateLab(labId, { workstations: updatedWorkstations });
            if (result.success) {
                showMessage('success', `Workstation status changed to ${newStatus}`);
                fetchData();
            }
        } catch (error) {
            console.error('Error updating workstation:', error);
            showMessage('error', 'Failed to update workstation status');
        }
    };

    const filteredWorkstations = workstations.filter(ws => {
        const matchesSearch = (ws.workstationNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLab = filterLab === 'all' || ws.labName === filterLab;
        const matchesCampus = filterCampus === 'all' || ws.campus === filterCampus;
        const matchesStatus = filterStatus === 'all' || ws.status === filterStatus;
        return matchesSearch && matchesLab && matchesCampus && matchesStatus;
    });

    const filteredEquipment = equipment.filter(eq => {
        const matchesSearch = (eq.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (eq.code || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLab = filterLab === 'all' || eq.lab?.name === filterLab;
        const matchesCampus = filterCampus === 'all' || (eq.lab?.campus || eq.lab?.location?.campus) === filterCampus;
        const matchesStatus = filterStatus === 'all' || eq.status === filterStatus;
        return matchesSearch && matchesLab && matchesCampus && matchesStatus;
    });

    const uniqueLabs = [...new Set([
        ...workstations.map(ws => ws.labName),
        ...equipment.map(eq => eq.lab?.name).filter(Boolean)
    ])];

    const uniqueCampuses = [...new Set([
        ...workstations.map(ws => ws.campus),
        ...equipment.map(eq => eq.lab?.campus || eq.lab?.location?.campus).filter(Boolean)
    ])];

    const stats = {
        total: filteredWorkstations.length + filteredEquipment.length,
        operational: filteredWorkstations.filter(ws => ws.status === 'available').length + filteredEquipment.filter(eq => eq.status === 'operational').length,
        maintenance: filteredWorkstations.filter(ws => ws.status === 'maintenance').length + filteredEquipment.filter(eq => eq.status === 'maintenance').length,
        occupied: filteredWorkstations.filter(ws => ws.status === 'occupied').length,
        faulty: filteredEquipment.filter(eq => eq.status === 'retired' || eq.status === 'disposed').length
    };

    const workstationColumns = [
        { accessor: 'campus', header: 'Campus' },
        {
            accessor: 'workstationNumber',
            header: 'Name',
            render: (value, row) => (
                <button className="link-button" onClick={() => setViewingItem({ ...row, type: 'workstation' })}>
                    {value}
                </button>
            )
        },
        { accessor: 'labName', header: 'Lab' },
        {
            accessor: 'specifications',
            header: 'Specifications',
            render: (row) => {
                const specs = row.specifications;
                if (!specs) return '-';
                return (
                    <div className="specs-cell">
                        {specs.cpu && <span>{specs.cpu}</span>}
                        {specs.ram && <span>{specs.ram}</span>}
                        {specs.storage && <span>{specs.storage}</span>}
                    </div>
                );
            }
        },
        {
            accessor: 'status',
            header: 'Status',
            render: (row) => {
                const getStatusColor = (status) => {
                    switch (status) {
                        case 'available': return '#2ecc71';
                        case 'occupied': return '#e74c3c';
                        case 'maintenance': return '#f1c40f';
                        default: return '#95a5a6';
                    }
                };
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(row.status),
                            boxShadow: `0 0 5px ${getStatusColor(row.status)}`
                        }}></div>
                        <span className={`status-badge ${row.status}`} style={{ textTransform: 'capitalize' }}>{row.status}</span>
                    </div>
                );
            }
        },
        {
            accessor: 'actions',
            header: 'Actions',
            render: (row) => (
                <div className="action-buttons">
                    <Button variant="secondary" size="small" onClick={() => setViewingItem({ ...row, type: 'workstation' })}>View</Button>
                    {row.status === 'available' && (
                        <Button variant="secondary" size="small" onClick={() => handleWorkstationStatusChange(row.labId, row._id, 'maintenance')}>Set Maintenance</Button>
                    )}
                    {row.status === 'maintenance' && (
                        <Button variant="primary" size="small" onClick={() => handleWorkstationStatusChange(row.labId, row._id, 'available')}>Set Available</Button>
                    )}
                </div>
            )
        }
    ];

    const equipmentColumns = [
        {
            accessor: 'name',
            header: 'Name',
            render: (value, row) => (
                <button className="link-button" onClick={() => setViewingItem({ ...row, type: 'equipment' })}>
                    {value}
                </button>
            )
        },
        { accessor: 'code', header: 'Code' },
        { accessor: 'category', header: 'Category', render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.category}</span> },
        { accessor: 'lab', header: 'Lab', render: (row) => row.lab?.name || 'N/A' },
        {
            accessor: 'status',
            header: 'Status',
            render: (row) => {
                const getStatusColor = (status) => {
                    if (status === 'operational') return '#2ecc71';
                    if (status === 'maintenance') return '#f1c40f';
                    return '#e74c3c';
                };
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getStatusColor(row.status) }}></div>
                        <span className={`status-badge ${row.status}`} style={{ textTransform: 'capitalize' }}>{row.status}</span>
                    </div>
                );
            }
        },
        {
            accessor: 'actions',
            header: 'Actions',
            render: (row) => (
                <div className="action-buttons">
                    <Button variant="secondary" size="small" onClick={() => setViewingItem({ ...row, type: 'equipment' })}>View</Button>
                    <Button variant="secondary" size="small" onClick={() => handleEditEquipment(row)}>Edit</Button>
                    <Button variant="danger" size="small" onClick={() => handleDeleteEquipment(row._id)}>Delete</Button>
                </div>
            )
        }
    ];

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="workstation-management">
                <div className="page-header">
                    <h1>Workstation Management</h1>
                    <p>Manage workstation inventory and specifications</p>
                </div>

                {message.text && (
                    <div className={`${message.type}-message`}>{message.text}</div>
                )}

                <div className="stats-row">
                    <Card className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Items</div>
                    </Card>
                    <Card className="stat-card operational">
                        <div className="stat-value">{stats.operational}</div>
                        <div className="stat-label">Available</div>
                    </Card>
                    <Card className="stat-card maintenance">
                        <div className="stat-value">{stats.maintenance}</div>
                        <div className="stat-label">Maintenance</div>
                    </Card>
                    <Card className="stat-card occupied">
                        <div className="stat-value">{stats.occupied}</div>
                        <div className="stat-label">Occupied</div>
                    </Card>
                </div>

                <div className="management-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="tabs" style={{ margin: 0 }}>
                        <button className={`tab ${activeTab === 'workstations' ? 'active' : ''}`} onClick={() => setActiveTab('workstations')}>
                            Lab Workstations ({workstations.length})
                        </button>
                        <button className={`tab ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>
                            Equipment ({equipment.length})
                        </button>
                    </div>
                    {activeTab === 'workstations' && (
                        <div className="view-toggle" style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button
                                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                                size="small"
                                onClick={() => setViewMode('list')}
                            >
                                List View
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                                size="small"
                                onClick={() => setViewMode('grid')}
                            >
                                Visual Status Grid
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="management-card">
                    <div className="toolbar">
                        <div className="search-filter">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <select value={filterCampus} onChange={(e) => setFilterCampus(e.target.value)} className="filter-select">
                                <option value="all">All Campuses</option>
                                <option value="Maraki">Maraki</option>
                                <option value="Atse Tewodros">Atse Tewodros</option>
                                <option value="Atse Fasil">Atse Fasil</option>
                                <option value="Health Science College (GC)">Health Science College (GC)</option>
                            </select>
                            <select value={filterLab} onChange={(e) => setFilterLab(e.target.value)} className="filter-select">
                                <option value="all">All Labs</option>
                                {uniqueLabs.map(lab => (
                                    <option key={lab} value={lab}>{lab}</option>
                                ))}
                            </select>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                                <option value="all">All Status</option>
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="operational">Operational</option>
                            </select>
                        </div>
                        {activeTab === 'equipment' && (
                            <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>
                                + Add Equipment
                            </Button>
                        )}
                    </div>

                    {activeTab === 'workstations' ? (
                        viewMode === 'list' ? (
                            <Table columns={workstationColumns} data={filteredWorkstations} />
                        ) : (
                            <div className="campus-visual-status">
                                {['Maraki', 'Atse Tewodros', 'Atse Fasil', 'Health Science College (GC)'].filter(c => filterCampus === 'all' || c === filterCampus).map(campus => {
                                    const campusLabs = labs.filter(l => (l.campus === campus) && (filterLab === 'all' || l.name === filterLab));
                                    if (campusLabs.length === 0) return null;
                                    return (
                                        <div key={campus} className="campus-group" style={{ marginBottom: '2rem' }}>
                                            <h2 style={{ borderBottom: '2px solid #eef2f7', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#1a237e' }}>{campus} Campus</h2>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                                {campusLabs.map(lab => (
                                                    <Card key={lab._id} title={lab.name} className="lab-status-card">
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20px, 1fr))', gap: '8px', marginTop: '10px' }}>
                                                            {lab.workstations?.map(ws => {
                                                                const getStatusColor = (status) => {
                                                                    switch (status) {
                                                                        case 'available': return '#2ecc71';
                                                                        case 'occupied': return '#e74c3c';
                                                                        case 'maintenance': return '#f1c40f';
                                                                        default: return '#95a5a6';
                                                                    }
                                                                };
                                                                return (
                                                                    <div
                                                                        key={ws._id}
                                                                        style={{
                                                                            width: '20px',
                                                                            height: '20px',
                                                                            borderRadius: '4px',
                                                                            backgroundColor: getStatusColor(ws.status),
                                                                            cursor: 'help'
                                                                        }}
                                                                        title={`Workstation ${ws.workstationNumber} - ${ws.status}`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>
                                                            {lab.workstations?.filter(w => w.status === 'available').length || 0} / {lab.workstations?.length || 0} Available
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <Table columns={equipmentColumns} data={filteredEquipment} />
                    )}
                </Card>

                <Modal isOpen={showModal} onClose={closeModal} title={editingItem ? 'Edit Equipment' : 'Add Equipment'}>
                    <form onSubmit={handleSubmit} className="workstation-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Name *</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="code">Code *</label>
                                <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select id="category" name="category" value={formData.category} onChange={handleInputChange} required>
                                    <option value="computer">Computer</option>
                                    <option value="laptop">Laptop</option>
                                    <option value="printer">Printer</option>
                                    <option value="projector">Projector</option>
                                    <option value="network">Network</option>
                                    <option value="furniture">Furniture</option>
                                    <option value="peripheral">Peripheral</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="lab">Lab</label>
                                <select id="lab" name="lab" value={formData.lab} onChange={handleInputChange}>
                                    <option value="">No Lab</option>
                                    {labs.map(lab => (
                                        <option key={lab._id} value={lab._id}>{lab.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="status">Status</label>
                                <select id="status" name="status" value={formData.status} onChange={handleInputChange}>
                                    <option value="operational">Operational</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="retired">Retired</option>
                                    <option value="disposed">Disposed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="condition">Condition</label>
                                <select id="condition" name="condition" value={formData.condition} onChange={handleInputChange}>
                                    <option value="excellent">Excellent</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Notes</label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows="3" />
                        </div>

                        <div className="form-actions">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" variant="primary" loading={submitting}>
                                {editingItem ? 'Update Equipment' : 'Add Equipment'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={viewingItem !== null}
                    onClose={() => setViewingItem(null)}
                    title={viewingItem?.type === 'workstation' ? 'Workstation Specs' : 'Equipment Details'}
                >
                    {viewingItem && (
                        <div className="detail-view">
                            <h2>{viewingItem.workstationNumber || viewingItem.name}</h2>
                            <div className="detail-grid">
                                <div className="detail-item"><strong>Campus:</strong> {viewingItem.campus}</div>
                                <div className="detail-item"><strong>Lab:</strong> {viewingItem.labName || viewingItem.lab?.name}</div>
                                <div className="detail-item"><strong>Status:</strong> {viewingItem.status}</div>
                                {viewingItem.type === 'equipment' && (
                                    <>
                                        <div className="detail-item"><strong>Code:</strong> {viewingItem.code}</div>
                                        <div className="detail-item"><strong>Category:</strong> {viewingItem.category}</div>
                                        <div className="detail-item"><strong>Condition:</strong> {viewingItem.condition}</div>
                                    </>
                                )}
                            </div>
                            {viewingItem.specifications && (
                                <div className="specs-section" style={{ marginTop: '1.5rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                                    <h3>Technical Specifications</h3>
                                    <p><strong>CPU:</strong> {viewingItem.specifications.cpu || 'N/A'}</p>
                                    <p><strong>RAM:</strong> {viewingItem.specifications.ram || 'N/A'}</p>
                                    <p><strong>Storage:</strong> {viewingItem.specifications.storage || 'N/A'}</p>
                                </div>
                            )}
                            <div style={{ marginTop: '1rem' }}>
                                <strong>Notes:</strong>
                                <p>{viewingItem.notes || 'No maintenance notes available.'}</p>
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <Button variant="secondary" onClick={() => setViewingItem(null)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default WorkstationManagement;
