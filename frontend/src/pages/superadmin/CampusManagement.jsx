import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { superadminService } from '../../services/superadminService';
import { userService } from '../../services/userService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './CampusManagement.css';

const CampusManagement = () => {
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableAdmins, setAvailableAdmins] = useState([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCampus, setEditingCampus] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        city: '',
        contactEmail: '',
        contactPhone: '',
        description: '',
        admin: '',
        labs: '',
        computers: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const fetchCampuses = async () => {
        try {
            setLoading(true);
            const data = await superadminService.getCampuses();
            setCampuses(data.campuses || []);
        } catch (error) {
            console.error('Error fetching campuses:', error);
            showMessage('error', 'Failed to load campuses');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableAdmins = async () => {
        try {
            // Get users who can be admins (existing admins or users to promote)
            const data = await userService.getUsers({ limit: 1000 });
            // Filter to show only non-admin users that can be promoted
            const potentialAdmins = (data.users || []).filter(u => 
                ['student', 'teacher', 'technician'].includes(u.role)
            );
            setAvailableAdmins(potentialAdmins);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchCampuses();
        fetchAvailableAdmins();
    }, []);

    const handleOpenAddModal = () => {
        setFormData({
            name: '',
            code: '',
            address: '',
            city: '',
            contactEmail: '',
            contactPhone: '',
            description: '',
            admin: '',
            labs: '',
            computers: ''
        });
        setIsAddModalOpen(true);
    };

    const handleEditClick = (campus) => {
        setEditingCampus(campus);
        setFormData({
            name: campus.name || '',
            code: campus.code || '',
            address: campus.address || '',
            city: campus.city || '',
            contactEmail: campus.contactEmail || '',
            contactPhone: campus.contactPhone || '',
            description: campus.description || '',
            admin: campus.admin?._id || campus.admin || '',
            labs: campus.labCount?.toString() || '',
            computers: campus.computerCount?.toString() || campus.totalComputers?.toString() || ''
        });
        setIsEditModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setFormData({ name: '', code: '', address: '', city: '', contactEmail: '', contactPhone: '', description: '', admin: '', labs: '', computers: '' });
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingCampus(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddCampus = async () => {
        const name = formData.name.trim();
        const labs = formData.labs.trim();
        const computers = formData.computers.trim();
        const admin = formData.admin.trim();
        
        if (!name) {
            showMessage('error', 'Campus name is required');
            return;
        }
        if (!/^[a-zA-Z\s\-']+$/.test(name)) {
            showMessage('error', 'Campus name must contain only letters, spaces, hyphens, and apostrophes');
            return;
        }
        
        if (labs && !/^\d+$/.test(labs)) {
            showMessage('error', 'Total Labs must be a number');
            return;
        }
        
        if (computers && !/^\d+$/.test(computers)) {
            showMessage('error', 'Total Computers must be a number');
            return;
        }
        
        if (admin && !/^[a-zA-Z\s\-'.]+$/.test(admin)) {
            showMessage('error', 'Lead Administrator must contain only letters, spaces, hyphens, and apostrophes');
            return;
        }
        
        try {
            const selectedAdmin = availableAdmins.find(a => a._id === formData.admin);
            await superadminService.createCampus({
                ...formData,
                labs: labs ? parseInt(labs, 10) : 0,
                computers: computers ? parseInt(computers, 10) : 0,
                adminName: selectedAdmin ? selectedAdmin.name : admin
            });
            showMessage('success', `Campus "${name}" added successfully`);
            fetchCampuses();
            handleCloseAddModal();
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to add campus');
        }
    };

    const handleSave = async () => {
        if (!editingCampus) return;
        
        const name = formData.name.trim();
        const labs = formData.labs.trim();
        const computers = formData.computers.trim();
        const admin = formData.admin.trim();
        
        if (!name) {
            showMessage('error', 'Campus name is required');
            return;
        }
        if (!/^[a-zA-Z\s\-']+$/.test(name)) {
            showMessage('error', 'Campus name must contain only letters, spaces, hyphens, and apostrophes');
            return;
        }
        
        if (labs && !/^\d+$/.test(labs)) {
            showMessage('error', 'Total Labs must be a number');
            return;
        }
        
        if (computers && !/^\d+$/.test(computers)) {
            showMessage('error', 'Total Computers must be a number');
            return;
        }
        
        if (admin && !/^[a-zA-Z\s\-'.]+$/.test(admin)) {
            showMessage('error', 'Lead Administrator must contain only letters, spaces, hyphens, and apostrophes');
            return;
        }
        
        try {
            const selectedAdmin = availableAdmins.find(a => a._id === formData.admin);
            await superadminService.updateCampus(editingCampus._id, {
                ...formData,
                labs: labs ? parseInt(labs, 10) : 0,
                computers: computers ? parseInt(computers, 10) : 0,
                adminName: selectedAdmin ? selectedAdmin.name : admin
            });
            showMessage('success', `Campus "${name}" updated successfully`);
            fetchCampuses();
            setIsEditModalOpen(false);
            setEditingCampus(null);
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to update campus');
        }
    };

    const getCampusIcon = (index) => {
        const icons = ['🏛️', '👑', '🏰', '🏥'];
        return icons[index] || '🏢';
    };

    const getCampusStyle = (code) => {
        const styles = {
            MAR: { primary: '#1e3a8a', secondary: '#3b82f6', bg: '#eff6ff' },
            ATW: { primary: '#7c3aed', secondary: '#a78bfa', bg: '#f5f3ff' },
            ATF: { primary: '#059669', secondary: '#34d399', bg: '#ecfdf5' },
            HSC: { primary: '#dc2626', secondary: '#f87171', bg: '#fef2f2' }
        };
        return styles[code] || styles.MAR;
    };

    const columns = [
        { accessor: 'name', header: 'Campus Name' },
        { accessor: 'code', header: 'Code' },
        { accessor: 'labCount', header: 'Labs' },
        { accessor: 'userCount', header: 'Users' },
        { 
            accessor: 'adminInfo', 
            header: 'Lead Administrator',
            render: (row) => row.adminInfo?.name || 'Not Assigned'
        },
        {
            accessor: 'actions',
            header: 'Actions',
            render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                        variant="primary" 
                        size="small" 
                        onClick={() => handleEditClick(row)}
                        style={{ 
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            background: '#4f46e5'
                        }}
                    >
                        Edit
                    </Button>
                </div>
            )
        }
    ];

    if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="campus-management">
                <div className="page-header">
                    <div className="header-content">
                        <h1>Campus Management</h1>
                        <p>Manage university campuses across all locations</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                            <span style={{ 
                                background: '#4f46e5', 
                                color: 'white', 
                                padding: '4px 12px', 
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600'
                            }}>
                                {campuses.length} Campus{campuses.length !== 1 ? 'es' : ''}
                            </span>
                        </div>
                    </div>
                    <Button variant="primary" onClick={handleOpenAddModal}>
                        + Add Campus
                    </Button>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="campus-cards-grid">
                    {campuses.length > 0 ? campuses.map((campus, index) => {
                        const campusStyle = getCampusStyle(campus.code);
                        return (
                            <div 
                                key={campus._id} 
                                className="campus-card-clickable"
                                onClick={() => handleEditClick(campus)}
                                style={{ 
                                    borderLeft: `4px solid ${campusStyle.primary}`,
                                    background: campusStyle.bg
                                }}
                            >
                                <div className="campus-card-header">
                                    <span className="campus-card-icon">{getCampusIcon(index)}</span>
                                    <span 
                                        className="campus-card-code"
                                        style={{ background: campusStyle.primary }}
                                    >
                                        {campus.code}
                                    </span>
                                </div>
                                <h3 className="campus-card-name" style={{ color: campusStyle.primary }}>
                                    {campus.name}
                                </h3>
                                <p className="campus-card-info">
                                    {campus.city || 'Gondar'}
                                </p>
                                <div className="campus-card-stats">
                                    <div className="stat">
                                        <span className="stat-value">{campus.labCount || 0}</span>
                                        <span className="stat-label">Labs</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{campus.userCount || 0}</span>
                                        <span className="stat-label">Users</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{campus.adminInfo?.name ? '✓' : '—'}</span>
                                        <span className="stat-label">Admin</span>
                                    </div>
                                </div>
                                <div className="campus-card-action">
                                    Click to manage
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="no-campuses">
                            <p>No campuses found. Click "Add Campus" to create one.</p>
                        </div>
                    )}
                </div>

                <Card title="University of Gondar Campus Infrastructure">
                    <Table columns={columns} data={campuses} />
                </Card>

                {/* Add Campus Modal */}
                <Modal
                    isOpen={isAddModalOpen}
                    onClose={handleCloseAddModal}
                    title="Add New Campus"
                    size="large"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label htmlFor="add-name" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Campus Name *
                            </label>
                            <input
                                type="text"
                                id="add-name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g., Maraki Campus"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="add-labs" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Total Labs
                            </label>
                            <input
                                type="number"
                                id="add-labs"
                                name="labs"
                                value={formData.labs}
                                onChange={handleInputChange}
                                placeholder="e.g., 10"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="add-computers" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Total Computers
                            </label>
                            <input
                                type="number"
                                id="add-computers"
                                name="computers"
                                value={formData.computers}
                                onChange={handleInputChange}
                                placeholder="e.g., 500"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="add-admin" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Lead Administrator
                            </label>
                            <input
                                type="text"
                                id="add-admin"
                                name="admin"
                                value={formData.admin}
                                onChange={handleInputChange}
                                placeholder="e.g., Dr. Abebe"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <Button variant="secondary" onClick={handleCloseAddModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAddCampus}>
                            Add Campus
                        </Button>
                    </div>
                </Modal>

                {/* Edit Campus Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    title={`Edit Campus: ${editingCampus?.name || ''}`}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label htmlFor="name" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Campus Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="labs" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Total Labs
                            </label>
                            <input
                                type="number"
                                id="labs"
                                name="labs"
                                value={formData.labs}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="computers" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Total Computers
                            </label>
                            <input
                                type="number"
                                id="computers"
                                name="computers"
                                value={formData.computers}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label htmlFor="admin" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Lead Administrator
                            </label>
                            <input
                                type="text"
                                id="admin"
                                name="admin"
                                value={formData.admin}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <Button variant="secondary" onClick={handleCloseEditModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default CampusManagement;
