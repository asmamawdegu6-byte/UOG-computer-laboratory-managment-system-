import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import './InventoryManagement.css';

const initialForm = {
    serialNumber: '',
    computerTag: '',
    processor: '',
    storage: '',
    ram: '',
    labId: '',
    location: '',
    status: 'operational',
    owner: '',
    notes: ''
};

const statusLabels = {
    operational: 'Operational',
    maintenance: 'Maintenance',
    broken: 'Broken',
    retired: 'Retired',
    disposed: 'Disposed'
};

const InventoryManagement = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(false); // Set to false initially, as fetchData will set it to true
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(initialForm);

    const location = useLocation();

    useEffect(() => {
        fetchData();
        if (location.state?.openAddForm) {
            setShowForm(true);
            setIsEditMode(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const fetchData = async () => {
        try {
            setLoading(true);
            const [inventoryRes, labsRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/labs', { params: { all: 'true' } })
            ]);
            setInventory(inventoryRes.data.items || []);
            setLabs(labsRes.data.labs || []);
        } catch (err) {
            setError('Failed to fetch inventory data');
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            serialNumber: item.specifications?.serialNumber || '',
            computerTag: item.specifications?.specifications?.computerTag || item.code || '',
            processor: item.specifications?.specifications?.processor || '',
            storage: item.specifications?.specifications?.storage || '',
            ram: item.specifications?.specifications?.ram || '',
            labId: item.lab?._id || '',
            location: item.location || '',
            status: item.status || 'operational',
            owner: item.specifications?.specifications?.owner || item.lab?.supervisor?.name || '',
            notes: item.notes || ''
        });
        setShowForm(true);
        setIsEditMode(true);
    };

    const handleView = (item) => {
        setViewingItem(item);
    };

    const handleExport = async (format) => {
        try {
            setExporting(true);
            const today = new Date().toISOString().split('T')[0];
            
            // Use 'equipment' for inventory data export as per API mapping
            const url = `/reports/export/${format}?type=equipment`;
            
            const response = await api.get(url, {
                responseType: 'blob'
            });
            
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `hardware_inventory_${today}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            
            setSuccessMessage(`Inventory exported as ${format.toUpperCase()} successfully`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(`Failed to export as ${format.toUpperCase()}`);
        } finally {
            setExporting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedLab = labs.find(lab => lab._id === formData.labId);
            const fallbackOwner = formData.owner.trim() || selectedLab?.supervisor?.name || '';
            
            const payload = {
                name: formData.computerTag || `Computer ${formData.serialNumber}`,
                code: formData.computerTag || formData.serialNumber,
                category: 'computer',
                lab: formData.labId,
                location: formData.location,
                status: formData.status,
                notes: formData.notes,
                specifications: {
                    serialNumber: formData.serialNumber,
                    specifications: {
                        computerTag: formData.computerTag,
                        processor: formData.processor,
                        storage: formData.storage,
                        ram: formData.ram,
                        owner: fallbackOwner
                    }
                }
            };

            let response;
            if (isEditMode) {
                response = await api.put(`/inventory/${editingItem._id}`, payload);
                setSuccessMessage('Hardware inventory record updated successfully');
            } else {
                response = await api.post('/inventory', payload);
                setSuccessMessage('Hardware inventory record added successfully');
            }

            if (response.data.success) { // Assuming API returns success field
                setShowForm(false);
                setIsEditMode(false);
                setEditingItem(null);
                setFormData(initialForm); // Reset form to initial state
                fetchData(); // Re-fetch data to update the table
                setTimeout(() => setSuccessMessage(''), 3000); // Clear success message after 3 seconds
            }
        } catch (err) {
            const serverMessage = err.response?.data?.message;
            setError(serverMessage || 'Server error');
            console.error('Error adding inventory:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDelete = async (equipmentId) => {
        if (!window.confirm('Are you sure you want to remove this hardware record?')) return;

        try {
            const response = await api.delete(`/inventory/${equipmentId}`);
            if (response.data.success) {
                setSuccessMessage('Hardware record removed successfully');
                fetchData();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to remove hardware record');
            console.error('Error deleting inventory:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const filteredInventory = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return inventory;

        return inventory.filter(item => {
            const specs = item.specifications?.specifications || {};
            const haystack = [
                item.specifications?.serialNumber,
                item.code,
                item.name,
                item.location,
                item.lab?.name,
                specs.computerTag,
                specs.processor,
                specs.storage,
                specs.ram,
                specs.owner
            ].join(' ').toLowerCase();

            return haystack.includes(term);
        });
    }, [inventory, searchTerm]);

    return (
        <DashboardLayout>
            <div className="inventory-management">
                <div className="page-header inventory-page-header">
                    <div>
                        <h1>Manual Hardware Inventory</h1>
                        <p className="page-description">Track desktop hardware in a spreadsheet-style register.</p>
                    </div>
                    <div className="inventory-top-actions">
                        <Button 
                            variant={!showForm ? 'primary' : 'secondary'} 
                            onClick={() => { setShowForm(false); setIsEditMode(false); }}
                        >
                            Show Data
                        </Button>
                        <Button 
                            variant={showForm && !isEditMode ? 'primary' : 'secondary'} 
                            onClick={() => { setShowForm(true); setIsEditMode(false); setFormData(initialForm); }}
                        >
                            Add Data
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('csv')} loading={exporting}>
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('pdf')} loading={exporting}>
                            Export PDF
                        </Button>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                {showForm && (
                    <Card title={isEditMode ? "Edit Hardware Inventory Record" : "Add Manual Hardware Inventory Record"} className="inventory-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="form-row form-row-3">
                                <div className="form-group">
                                    <label>Serial Number</label>
                                    <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Computer Tag</label>
                                    <input name="computerTag" value={formData.computerTag} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Processor</label>
                                    <input name="processor" value={formData.processor} onChange={handleChange} placeholder="e.g. 3.70 GHz" />
                                </div>
                            </div>

                            <div className="form-row form-row-3">
                                <div className="form-group">
                                    <label>SSD/HDD</label>
                                    <input name="storage" value={formData.storage} onChange={handleChange} placeholder="e.g. 500 GB (HDD)" />
                                </div>
                                <div className="form-group">
                                    <label>RAM</label>
                                    <input name="ram" value={formData.ram} onChange={handleChange} placeholder="e.g. 8 GB" />
                                </div>
                                <div className="form-group">
                                    <label>Location / Room</label>
                                    <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. IT LAB 001" />
                                </div>
                            </div>

                            <div className="form-row form-row-3">
                                <div className="form-group">
                                    <label>Lab</label>
                                    <select name="labId" value={formData.labId} onChange={handleChange} required>
                                        <option value="">Select Lab</option>
                                        {labs.map(lab => (
                                            <option key={lab._id} value={lab._id}>{lab.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Current Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} required>
                                        <option value="operational">Operational</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="broken">Broken</option>
                                        <option value="retired">Retired</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Lab Owner</label>
                                    <input name="owner" value={formData.owner} onChange={handleChange} placeholder="Owner / supervisor name" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Optional notes" />
                            </div>

                            <Button type="submit" variant="primary">{isEditMode ? 'Update Record' : 'Save Inventory Record'}</Button>
                        </form>
                    </Card>
                )}

                <Card className="spreadsheet-card">
                    <div className="sheet-toolbar">
                        <div>
                            <h3>Hardware Register</h3>
                            <p>{filteredInventory.length} records</p>
                        </div>
                        <input
                            className="sheet-search"
                            type="text"
                            placeholder="Search serial, tag, room, owner..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="loading">Loading hardware inventory...</div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="empty-state">No hardware inventory records found</div>
                    ) : (
                        <div className="sheet-table-wrap">
                            <table className="sheet-table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Serial Number</th>
                                        <th>Name</th>
                                        <th>Computer Tag</th>
                                        <th>Processor</th>
                                        <th>SSD/HDD</th>
                                        <th>RAM</th>
                                        <th>Location/Room</th>
                                        <th>Current Status</th>
                                        <th>Lab Owner</th>
                                        <th>Lab</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInventory.map((item, index) => {
                                        const specs = item.specifications?.specifications || {};
                                        const owner = specs.owner || item.lab?.supervisor?.name || item.assignedTo?.name || 'N/A';
                                        return (
                                            <tr key={item._id}>
                                                <td>{index + 1}</td>
                                                <td>{item.specifications?.serialNumber || item.code || 'N/A'}</td>
                                                <td>{item.name || 'N/A'}</td>
                                                <td>{specs.computerTag || item.code || item.name}</td>
                                                <td>{specs.processor || 'N/A'}</td>
                                                <td>{specs.storage || 'N/A'}</td>
                                                <td>{specs.ram || 'N/A'}</td>
                                                <td>{item.location || 'N/A'}</td>
                                                <td><span className={`sheet-status ${item.status}`}>{statusLabels[item.status] || item.status}</span></td>
                                                <td>{owner}</td>
                                                <td>{item.lab?.name || 'N/A'}</td>
                                                <td>
                                                    <div className="sheet-actions">
                                                        <Button variant="secondary" size="small" onClick={() => handleView(item)}>
                                                            Detail
                                                        </Button>
                                                        <Button variant="primary" size="small" onClick={() => handleEdit(item)}>
                                                            Edit
                                                        </Button>
                                                        <Button variant="danger" size="small" onClick={() => handleDelete(item._id)}>
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Hardware Detail Modal */}
                <Modal
                    isOpen={viewingItem !== null}
                    onClose={() => setViewingItem(null)}
                    title="Hardware Inventory Detail"
                >
                    {viewingItem && (
                        <div className="detail-view">
                            <div className="detail-grid">
                                <div className="detail-item"><strong>Name</strong><span>{viewingItem.name}</span></div>
                                <div className="detail-item"><strong>Serial Number</strong><span>{viewingItem.specifications?.serialNumber || 'N/A'}</span></div>
                                <div className="detail-item"><strong>Computer Tag</strong><span>{viewingItem.specifications?.specifications?.computerTag || viewingItem.code || 'N/A'}</span></div>
                                <div className="detail-item"><strong>Processor</strong><span>{viewingItem.specifications?.specifications?.processor || 'N/A'}</span></div>
                                <div className="detail-item"><strong>RAM</strong><span>{viewingItem.specifications?.specifications?.ram || 'N/A'}</span></div>
                                <div className="detail-item"><strong>Storage</strong><span>{viewingItem.specifications?.specifications?.storage || 'N/A'}</span></div>
                                <div className="detail-item"><strong>Location</strong><span>{viewingItem.location || 'N/A'}</span></div>
                                <div className="detail-item"><strong>Lab</strong><span>{viewingItem.lab?.name || 'N/A'}</span></div>
                                <div className="detail-item"><strong>Status</strong><span className={`sheet-status ${viewingItem.status}`}>{statusLabels[viewingItem.status]}</span></div>
                                <div className="detail-item"><strong>Lab Owner</strong><span>{viewingItem.specifications?.specifications?.owner || viewingItem.lab?.supervisor?.name || 'N/A'}</span></div>
                            </div>
                            <div className="detail-notes">
                                <strong>Notes</strong>
                                <p>{viewingItem.notes || 'No additional notes.'}</p>
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <Button variant="secondary" onClick={() => setViewingItem(null)}>Close</Button>
                                <Button variant="primary" onClick={() => { handleEdit(viewingItem); setViewingItem(null); }}>Edit Record</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default InventoryManagement;
