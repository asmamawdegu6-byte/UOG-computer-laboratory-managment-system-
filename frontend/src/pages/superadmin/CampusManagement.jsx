import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import './CampusManagement.css';

const CampusManagement = () => {
    const [campuses, setCampuses] = useState([
        { id: 1, name: 'Maraki', labs: 12, computers: 580, admin: 'Dr. Abebe' },
        { id: 2, name: 'Atse Tewodros', labs: 8, computers: 420, admin: 'Sara K.' },
        { id: 3, name: 'Atse Fasil', labs: 6, computers: 310, admin: 'Yonas T.' },
        { id: 4, name: 'Health Science College (GC)', labs: 7, computers: 360, admin: 'Mulugeta B.' }
    ]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCampus, setEditingCampus] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        labs: '',
        computers: '',
        admin: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const handleOpenAddModal = () => {
        setFormData({ name: '', labs: '', computers: '', admin: '' });
        setIsAddModalOpen(true);
    };

    const handleEditClick = (campus) => {
        setEditingCampus(campus);
        setFormData({
            name: campus.name,
            labs: campus.labs.toString(),
            computers: campus.computers.toString(),
            admin: campus.admin
        });
        setIsEditModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setFormData({ name: '', labs: '', computers: '', admin: '' });
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

    const handleAddCampus = () => {
        if (!formData.name.trim()) {
            showMessage('error', 'Campus name is required');
            return;
        }
        const newCampus = {
            id: Date.now(),
            name: formData.name,
            labs: parseInt(formData.labs, 10) || 0,
            computers: parseInt(formData.computers, 10) || 0,
            admin: formData.admin
        };
        setCampuses(prev => [...prev, newCampus]);
        showMessage('success', `Campus "${formData.name}" added successfully`);
        handleCloseAddModal();
    };

    const handleSave = () => {
        if (!editingCampus) return;
        const updatedCampuses = campuses.map(campus =>
            campus.id === editingCampus.id
                ? {
                    ...campus,
                    name: formData.name,
                    labs: parseInt(formData.labs, 10) || 0,
                    computers: parseInt(formData.computers, 10) || 0,
                    admin: formData.admin
                }
                : campus
        );
        setCampuses(updatedCampuses);
        showMessage('success', `Campus "${formData.name}" updated successfully`);
        setIsEditModalOpen(false);
        setEditingCampus(null);
    };

    const columns = [
        { accessor: 'name', header: 'Campus Name' },
        { accessor: 'labs', header: 'Total Labs' },
        { accessor: 'computers', header: 'Total Computers' },
        { accessor: 'admin', header: 'Lead Administrator' },
        {
            accessor: 'actions',
            header: 'Actions',
            render: (row) => (
                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleEditClick(row)}
                >
                    Edit
                </Button>
            )
        }
    ];

    return (
        <DashboardLayout>
            <div className="campus-management">
                <div className="page-header">
                    <div className="header-content">
                        <h1>Campus Management</h1>
                        <p>Manage university campuses across all locations</p>
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
