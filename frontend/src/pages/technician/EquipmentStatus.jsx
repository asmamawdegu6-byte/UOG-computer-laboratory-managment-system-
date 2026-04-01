import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './EquipmentStatus.css';

const EquipmentStatus = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const response = await api.get('/maintenance/equipment');
            setEquipment(response.data.equipment || []);
        } catch (err) {
            setError('Failed to fetch equipment');
            console.error('Error fetching equipment:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (equipmentId, newStatus) => {
        try {
            const response = await api.patch(`/maintenance/equipment/${equipmentId}`, {
                status: newStatus
            });

            if (response.data.success) {
                setSuccessMessage('Equipment status updated successfully');
                fetchEquipment();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to update equipment status');
            console.error('Error updating equipment:', err);
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

    const filteredEquipment = filterStatus === 'all'
        ? equipment
        : equipment.filter(e => e.status === filterStatus);

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
            header: 'Status',
            accessor: 'status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            header: 'Last Maintenance',
            accessor: 'lastMaintenance',
            render: (row) => {
                if (row.maintenanceRecords && row.maintenanceRecords.length > 0) {
                    const lastRecord = row.maintenanceRecords[row.maintenanceRecords.length - 1];
                    return new Date(lastRecord.date).toLocaleDateString();
                }
                return 'Never';
            }
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {row.status === 'operational' && (
                        <Button
                            variant="warning"
                            size="small"
                            onClick={() => handleStatusUpdate(row._id, 'maintenance')}
                        >
                            Set Maintenance
                        </Button>
                    )}
                    {row.status === 'maintenance' && (
                        <Button
                            variant="success"
                            size="small"
                            onClick={() => handleStatusUpdate(row._id, 'operational')}
                        >
                            Mark Operational
                        </Button>
                    )}
                    {row.status === 'broken' && (
                        <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleStatusUpdate(row._id, 'maintenance')}
                        >
                            Start Repair
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="equipment-status">
                <div className="page-header">
                    <div>
                        <h1>Equipment Status</h1>
                        <p className="page-description">Monitor and manage equipment health</p>
                    </div>
                    <div className="filter-controls">
                        <label>Filter by Status:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Equipment</option>
                            <option value="operational">Operational</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="broken">Broken</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <Card>
                    {loading ? (
                        <div className="loading">Loading equipment...</div>
                    ) : filteredEquipment.length === 0 ? (
                        <div className="empty-state">No equipment found</div>
                    ) : (
                        <Table columns={columns} data={filteredEquipment} />
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default EquipmentStatus;
