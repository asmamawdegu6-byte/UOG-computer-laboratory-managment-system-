import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { superadminService } from '../../services/superadminService';
import { userService } from '../../services/userService';
import './UserRoleManagement.css';

const emptyAdminForm = {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    campus: 'Maraki'
};

const UserRoleManagement = () => {
    const [distribution, setDistribution] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleUsers, setRoleUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [adminForm, setAdminForm] = useState(emptyAdminForm);

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await superadminService.getRoleDistribution();
            setDistribution(data.distribution || []);

            const usersData = await userService.getUsers({ limit: 1000 });
            setAllUsers(usersData.users || []);
        } catch (error) {
            showMessage('error', 'Failed to load role data');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const selectRole = async (role) => {
        setSelectedRole(role);
        setLoadingUsers(true);
        try {
            const dist = distribution.find(d => d.role === role);
            setRoleUsers(dist?.users || []);
        } catch (error) {
            showMessage('error', 'Failed to load users for role');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const result = await superadminService.changeUserRole(userId, newRole);
            if (result.success) {
                showMessage('success', `Role changed to ${newRole}`);
                fetchData();
                if (selectedRole) {
                    setTimeout(() => selectRole(selectedRole), 500);
                }
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to change role');
        }
    };

    const openAddAdminModal = () => {
        setAdminForm(emptyAdminForm);
        setShowAddAdminModal(true);
    };

    const handleAdminFormChange = (e) => {
        const { name, value } = e.target;
        setAdminForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        
        const firstName = adminForm.firstName.trim();
        const lastName = adminForm.lastName.trim();
        const email = adminForm.email.trim();
        const username = adminForm.username.trim();
        const password = adminForm.password;
        const campus = adminForm.campus.trim();
        
        if (!firstName) {
            showMessage('error', 'First name is required');
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(firstName)) {
            showMessage('error', 'First name must contain only letters');
            return;
        }
        
        if (!lastName) {
            showMessage('error', 'Last name is required');
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(lastName)) {
            showMessage('error', 'Last name must contain only letters');
            return;
        }
        
        if (!username) {
            showMessage('error', 'Username is required');
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showMessage('error', 'Username must contain only letters, numbers, and underscores');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            showMessage('error', 'Email is required');
            return;
        }
        if (!emailRegex.test(email)) {
            showMessage('error', 'Please enter a valid email address');
            return;
        }
        
        if (password.length < 6) {
            showMessage('error', 'Password must be at least 6 characters');
            return;
        }
        if (!/[a-zA-Z]/.test(password)) {
            showMessage('error', 'Password must contain at least one letter');
            return;
        }
        if (!/[0-9]/.test(password)) {
            showMessage('error', 'Password must contain at least one number');
            return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            showMessage('error', 'Password must contain at least one special character');
            return;
        }
        
        if (!campus) {
            showMessage('error', 'Campus is required');
            return;
        }
        
        setSubmitting(true);
        try {
            const fullName = `${firstName} ${lastName}`;
            const userData = {
                name: fullName,
                firstName,
                lastName,
                email,
                username,
                password,
                campus,
                role: 'admin'
            };
            const result = await userService.createUser(userData);
            if (result.success) {
                showMessage('success', `Admin "${fullName}" created successfully`);
                setShowAddAdminModal(false);
                setAdminForm(emptyAdminForm);
                fetchData();
            } else {
                showMessage('error', result.message || 'Failed to create admin');
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to create admin');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = allUsers.filter(u => {
        const term = searchTerm.toLowerCase();
        return (
            (u.name || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term) ||
            (u.username || '').toLowerCase().includes(term)
        );
    });

    const roleColors = {
        superadmin: '#9b59b6',
        admin: '#e74c3c',
        teacher: '#2ecc71',
        student: '#3498db',
        technician: '#f39c12'
    };

    const allUserColumns = [
        { accessor: 'name', header: 'Name', render: (value) => <strong>{typeof value === 'object' ? value.name : value}</strong> },
        { accessor: 'username', header: 'Username' },
        { accessor: 'email', header: 'Email' },
        {
            accessor: 'role', header: 'Role', render: (value, row) => {
                const userRole = typeof value === 'object' ? value.role : value;
                if (userRole === 'superadmin') {
                    return <span className="urm-role-badge" style={{ backgroundColor: roleColors.superadmin, color: 'white' }}>{userRole}</span>;
                }
                return (
                    <select
                        className="role-select"
                        value={userRole}
                        onChange={(e) => handleRoleChange(row._id, e.target.value)}
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="technician">Technician</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                    </select>
                );
            }
        },
        {
            accessor: 'isActive', header: 'Status', render: (value) => {
                const isActive = typeof value === 'object' ? value.isActive : value;
                return (
                    <span className={`urm-status ${isActive ? 'urm-active' : 'urm-inactive'}`}>{isActive ? 'Active' : 'Inactive'}</span>
                );
            }
        },
        {
            accessor: 'approvalStatus', header: 'Approval', render: (value) => {
                const status = typeof value === 'object' ? value.approvalStatus : value;
                return (
                    <span className={`urm-approval urm-${status}`}>{status}</span>
                );
            }
        },
        {
            accessor: 'actions', header: 'Actions', render: (_, row) => {
                if (row.role === 'superadmin') return null;
                return null;
            }
        }
    ];

    if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="urm-page">
                <div className="page-header">
                    <div>
                        <h1>Role Management</h1>
                        <p>Configure user roles and permissions across the system</p>
                    </div>
                    <Button variant="primary" onClick={openAddAdminModal}>+ Add Admin</Button>
                </div>

                {message.text && <div className={`${message.type}-message`}>{message.text}</div>}

                {/* Role Distribution Cards */}
                <div className="urm-role-cards">
                    {distribution.map(dist => (
                        <div
                            key={dist.role}
                            className={`urm-role-card ${selectedRole === dist.role ? 'urm-selected' : ''}`}
                            style={{ borderColor: roleColors[dist.role] }}
                            onClick={() => selectRole(dist.role)}
                        >
                            <div className="urm-role-icon" style={{ backgroundColor: roleColors[dist.role] + '20', color: roleColors[dist.role] }}>
                                {dist.role.charAt(0).toUpperCase()}
                            </div>
                            <div className="urm-role-info">
                                <div className="urm-role-name" style={{ color: roleColors[dist.role] }}>{dist.role}</div>
                                <div className="urm-role-count">{dist.count} users</div>
                                <div className="urm-role-active">{dist.activeCount} active</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selected Role Users */}
                {selectedRole && (
                    <Card className="management-card" style={{ marginTop: '1.5rem' }}>
                        <div className="sa-section-header">
                            <h2>Users with role: {selectedRole}</h2>
                            <button className="urm-close-btn" onClick={() => setSelectedRole(null)}>✕</button>
                        </div>
                        {loadingUsers ? (
                            <LoadingSpinner />
                        ) : roleUsers.length === 0 ? (
                            <p className="sa-empty">No users with this role.</p>
                        ) : (
                             <Table
                                columns={[
                                    { accessor: 'name', header: 'Name', render: (v) => <strong>{typeof v === 'object' ? v.name : v}</strong> },
                                    { accessor: 'username', header: 'Username' },
                                    { accessor: 'email', header: 'Email' },
                                    {
                                        accessor: 'isActive', header: 'Status', render: (v) => {
                                            const active = typeof v === 'object' ? v.isActive : v;
                                            return <span className={`urm-status ${active ? 'urm-active' : 'urm-inactive'}`}>{active ? 'Active' : 'Inactive'}</span>;
                                        }
                                    },
                                    {
                                        accessor: 'createdAt', header: 'Joined', render: (v) => {
                                            const date = typeof v === 'object' ? v.createdAt : v;
                                            return date ? new Date(date).toLocaleDateString() : '-';
                                        }
                                    },
                                    {
                                        accessor: 'actions', header: 'Actions', render: (_, row) => {
                                            if (row.role === 'superadmin') return null;
                                            return null;
                                        }
                                    }
                                ]}
                                data={roleUsers}
                            />
                        )}
                    </Card>
                )}

                {/* All Users with Role Editor */}
                <Card className="management-card" style={{ marginTop: '1.5rem' }}>
                    <div className="sa-section-header">
                        <h2>All Users - Change Roles</h2>
                    </div>
                    <div className="toolbar">
                        <div className="search-filter">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                    <Table columns={allUserColumns} data={filteredUsers} />
                </Card>

                <Modal
                    isOpen={showAddAdminModal}
                    onClose={() => { setShowAddAdminModal(false); setAdminForm(emptyAdminForm); }}
                    title="Add New Admin"
                    size="medium"
                >
                    <form className="user-form" onSubmit={handleCreateAdmin}>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>
                            Create a new admin account with full management privileges.
                        </p>
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input
                                    name="firstName"
                                    value={adminForm.firstName}
                                    onChange={handleAdminFormChange}
                                    required
                                    placeholder="Enter first name (letters only)"
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name *</label>
                                <input
                                    name="lastName"
                                    value={adminForm.lastName}
                                    onChange={handleAdminFormChange}
                                    required
                                    placeholder="Enter last name (letters only)"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    name="username"
                                    value={adminForm.username}
                                    onChange={handleAdminFormChange}
                                    required
                                    minLength={3}
                                    placeholder="Enter username (letters, numbers, _)"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={adminForm.email}
                                    onChange={handleAdminFormChange}
                                    required
                                    placeholder="admin@uog.edu.et"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                name="password"
                                type="password"
                                value={adminForm.password}
                                onChange={handleAdminFormChange}
                                required
                                minLength={6}
                                placeholder="Min 6 chars with letter, number, special char"
                            />
                        </div>
                        <div className="form-group">
                            <label>Campus *</label>
                            <select
                                name="campus"
                                value={adminForm.campus}
                                onChange={handleAdminFormChange}
                                required
                            >
                                <option value="Maraki">Maraki</option>
                                <option value="Atse Tewodros">Atse Tewodros</option>
                                <option value="Atse Fasil">Atse Fasil</option>
                                <option value="Health Science College (GC)">Health Science College (GC)</option>
                            </select>
                        </div>
                        <div className="form-actions">
                            <Button variant="secondary" type="button" onClick={() => { setShowAddAdminModal(false); setAdminForm(emptyAdminForm); }}>Cancel</Button>
                            <Button variant="primary" type="submit" loading={submitting}>Create Admin</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default UserRoleManagement;
