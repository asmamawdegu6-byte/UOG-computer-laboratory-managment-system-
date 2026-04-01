import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './InventoryManagement.css';

const InventoryManagement = () => {
    const [inventory, setInventory] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'computer',
        labId: '',
        serialNumber: '',
        quantity: 1,
        status: 'operational'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [inventoryRes, labsRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/labs')
            ]);
            setInventory(inventoryRes.data.items || []);
            setLabs(labsRes.data.labs || []);
        } catch (err) {
            setError('Failed to fetch data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/inventory', {
                name: formData.name,
                code: formData.serialNumber,
                category: formData.category,
                lab: formData.labId,
                status: formData.status,
                specifications: { serialNumber: formData.serialNumber }
            });
            if (response.data.success) {
                setSuccessMessage('Equipment added successfully');
                setShowForm(false);
                setFormData({
                    name: '',
                    category: 'computer',
                    labId: '',
                    serialNumber: '',
                    quantity: 1,
                    status: 'operational'
                });
                fetchData();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to add equipment');
            console.error('Error adding equipment:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDelete = async (equipmentId) => {
        if (!window.confirm('Are you sure you want to delete this equipment?')) {
            return;
        }

        try {
            const response = await api.delete(`/inventory/${equipmentId}`);
            if (response.data.success) {
                setSuccessMessage('Equipment deleted successfully');
                fetchData();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete equipment');
            console.error('Error deleting equipment:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            operational: { bg: '#d1fae5', color: '#065f46' },
            maintenance: { bg: '#fef3c7', color: '#92400e' },
            broken: { bg: '#fee2e2', color: '#991b1b' },
            retired: { bg: '#f3f4f6', color: '#374151' }
        };

        const colors = statusColors[status] || statusColors.operational;

        return (
            <span
                style={{
                    backgroundColor: colors.bg,
                    color: colors.color,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                }}
            >
                {status}
            </span>
        );
    };

    const getCategoryIcon = (category) => {
        const icons = {
            computer: '💻',
            projector: '📽️',
            printer: '🖨️',
            network: '🌐',
            furniture: '🪑',
            other: '📦'
        };
        return icons[category] || icons.other;
    };

    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{getCategoryIcon(row.category)}</span>
                    <div>
                        <div style={{ fontWeight: '500' }}>{row.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.specifications?.serialNumber || row.code || 'N/A'}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Category',
            accessor: 'category',
            render: (row) => (
                <span style={{ textTransform: 'capitalize' }}>{row.category}</span>
            )
        },
        {
            header: 'Lab',
            accessor: 'lab.name',
            render: (row) => row.lab?.name || 'N/A'
        },
        {
            header: 'Quantity',
            accessor: 'quantity'
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            header: 'Added',
            accessor: 'createdAt',
            render: (row) => new Date(row.createdAt).toLocaleDateString()
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(row._id)}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="inventory-management">
                <div className="page-header">
                    <div>
                        <h1>Inventory Management</h1>
                        <p className="page-description">Manage lab equipment inventory</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'Add Equipment'}
                    </Button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                {showForm && (
                    <Card title="Add New Equipment" className="inventory-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Equipment Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g., Dell Optiplex 7090"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Serial Number</label>
                                    <input
                                        type="text"
                                        name="serialNumber"
                                        value={formData.serialNumber}
                                        onChange={handleChange}
                                        placeholder="e.g., SN123456789"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={handleChange} required>
                                        <option value="computer">Computer</option>
                                        <option value="projector">Projector</option>
                                        <option value="printer">Printer</option>
                                        <option value="network">Network Equipment</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Lab</label>
                                    <select name="labId" value={formData.labId} onChange={handleChange} required>
                                        <option value="">Select Lab</option>
                                        {labs.map(lab => (
                                            <option key={lab._id} value={lab._id}>{lab.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} required>
                                        <option value="operational">Operational</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="broken">Broken</option>
                                        <option value="retired">Retired</option>
                                    </select>
                                </div>
                            </div>

                            <Button type="submit" variant="primary">
                                Add Equipment
                            </Button>
                        </form>
                    </Card>
                )}

                <Card title="Equipment Inventory">
                    {loading ? (
                        <div className="loading">Loading inventory...</div>
                    ) : inventory.length === 0 ? (
                        <div className="empty-state">No equipment found</div>
                    ) : (
                        <Table columns={columns} data={inventory} />
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default InventoryManagement;
