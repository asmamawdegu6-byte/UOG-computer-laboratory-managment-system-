import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { userService } from '../../services/userService';
import './UserManagement.css';

const emptyForm = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    name: '',
    campus: 'Maraki',
    role: 'student',
    department: '',
    studentId: '',
    phone: ''
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [activeTab, setActiveTab] = useState('all');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [modalMode, setModalMode] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await userService.getUsers({ limit: 1000 });
            setUsers(data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            showMessage('error', error?.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const pendingUsers = users.filter(u => u.approvalStatus === 'pending');

    const filteredUsers = users.filter(user => {
        const term = searchTerm.toLowerCase();
        const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.toLowerCase() : (user.name || '').toLowerCase();
        const matchesSearch = fullName.includes(term) ||
            (user.firstName || '').toLowerCase().includes(term) ||
            (user.lastName || '').toLowerCase().includes(term) ||
            (user.email || '').toLowerCase().includes(term) ||
            (user.username || '').toLowerCase().includes(term);
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesTab = activeTab === 'all' || user.approvalStatus === activeTab;
        return matchesSearch && matchesRole && matchesTab;
    });

    const openAddModal = () => {
        setFormData(emptyForm);
        setModalMode('add');
    };

    const openEditModal = (user) => {
        const nameParts = (user.name || '').split(' ');
        setFormData({
            username: user.username || '',
            email: user.email || '',
            password: '',
            firstName: user.firstName || nameParts[0] || '',
            lastName: user.lastName || nameParts.slice(1).join(' ') || '',
            name: user.name || '',
            role: user.role || 'student',
            department: user.department || '',
            studentId: user.studentId || '',
            phone: user.phone || '',
            campus: user.campus || 'Maraki',
            college: user.college || '',
            _id: user._id
        });
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setFormData(emptyForm);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (newData.firstName || newData.lastName) {
                newData.name = `${newData.firstName || ''} ${newData.lastName || ''}`.trim();
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const username = formData.username.trim();
        const email = formData.email.trim();
        const password = formData.password;
        const role = formData.role;
        const department = formData.department.trim();
        const campus = formData.campus.trim();
        const studentId = formData.studentId.trim();
        const phone = formData.phone.trim();
        
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
        
        if (!['student', 'teacher', 'technician'].includes(role)) {
            showMessage('error', 'Role must be student, teacher, or technician');
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
        
        if (modalMode === 'add') {
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
        }
        
        if (!campus) {
            showMessage('error', 'Campus location is required');
            return;
        }
        
        if (department && !/^[a-zA-Z\s\-']+$/.test(department)) {
            showMessage('error', 'Department must contain only letters, spaces, hyphens, and apostrophes');
            return;
        }
        
        if (studentId && !/^[A-Za-z0-9\/]+$/.test(studentId)) {
            showMessage('error', 'Student ID must be in format UOG/2020/001');
            return;
        }
        
        if (phone) {
            if (!/^\d{10}$/.test(phone)) {
                showMessage('error', 'Phone number must be exactly 10 digits');
                return;
            }
        }
        
        setSubmitting(true);
        try {
            if (modalMode === 'add') {
                const createData = {
                    username,
                    email,
                    password,
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    role,
                    department,
                    studentId,
                    phone,
                    campus,
                    college: formData.college
                };
                const result = await userService.createUser(createData);
                if (result.success) {
                    showMessage('success', result.message || 'User created successfully');
                    closeModal();
                    fetchUsers();
                } else {
                    showMessage('error', result.message || 'Failed to create user');
                }
            } else if (modalMode === 'edit') {
                const { _id, username, password, role, ...rest } = formData;
                const updateData = {};
                if (formData.firstName) updateData.firstName = formData.firstName;
                if (formData.lastName) updateData.lastName = formData.lastName;
                if (formData.name) updateData.name = formData.name;
                if (rest.email) updateData.email = rest.email;
                if (rest.department) updateData.department = rest.department;
                if (rest.studentId) updateData.studentId = rest.studentId;
                if (rest.phone) updateData.phone = rest.phone;
                if (rest.campus) updateData.campus = rest.campus;
                if (rest.college) updateData.college = rest.college;

                const result = await userService.updateUser(_id, updateData);
                if (result.success) {
                    showMessage('success', result.message || 'User updated successfully');
                    closeModal();
                    fetchUsers();
                } else {
                    showMessage('error', result.message || 'Failed to update user');
                }
            }
        } catch (error) {
            const errMsg = error?.response?.data?.message || 'Operation failed';
            showMessage('error', errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            const result = await userService.approveUser(userId);
            if (result.success) {
                showMessage('success', result.message || 'User approved successfully');
                fetchUsers();
            } else {
                showMessage('error', result.message || 'Failed to approve user');
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to approve user');
        }
    };

    const handleReject = async (userId) => {
        if (!window.confirm('Are you sure you want to reject this user?')) return;
        try {
            const result = await userService.rejectUser(userId);
            if (result.success) {
                showMessage('success', result.message || 'User rejected successfully');
                fetchUsers();
            } else {
                showMessage('error', result.message || 'Failed to reject user');
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to reject user');
        }
    };

    const handleDeactivate = async (userId) => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;
        try {
            const result = await userService.deleteUser(userId);
            if (result.success) {
                showMessage('success', result.message || 'User deactivated successfully');
                fetchUsers();
            } else {
                showMessage('error', result.message || 'Failed to deactivate user');
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to deactivate user');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const result = await userService.updateUserRole(userId, newRole);
            if (result.success) {
                showMessage('success', 'Role updated successfully');
                fetchUsers();
            } else {
                showMessage('error', result.message || 'Failed to update role');
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to update role');
        }
    };

    const openResetPasswordModal = (user) => {
        setResetPasswordUser(user);
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            showMessage('error', 'Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage('error', 'Passwords do not match');
            return;
        }
        setSubmitting(true);
        try {
            const result = await userService.resetUserPassword(resetPasswordUser._id, newPassword);
            if (result.success) {
                showMessage('success', result.message || 'Password reset successfully');
                setResetPasswordUser(null);
                setNewPassword('');
                setConfirmPassword('');
            } else {
                showMessage('error', result.message || 'Failed to reset password');
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    };

    const pendingColumns = [
        { 
            accessor: 'name', header: 'Name',
            render: (value, row) => {
                const fullName = row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : (value || 'N/A');
                return fullName;
            }
        },
        { accessor: 'email', header: 'Email' },
        { accessor: 'role', header: 'Requested Role' },
        { accessor: 'campus', header: 'Campus', render: (row) => (typeof row === 'object' ? row.campus : row) || '-' },
        {
            accessor: 'createdAt', header: 'Registered',
            render: (row) => {
                const date = typeof row === 'object' ? row.createdAt : row;
                return date ? new Date(date).toLocaleDateString() : '-';
            }
        },
        {
            accessor: 'actions', header: 'Actions', render: (_, row) => (
                <div className="action-buttons">
                    <Button variant="secondary" size="small" onClick={() => setViewingUser(row)}>View</Button>
                    <Button variant="primary" size="small" onClick={() => handleApprove(row._id)}>Approve</Button>
                    <Button variant="danger" size="small" onClick={() => handleReject(row._id)}>Reject</Button>
                </div>
            )
        }
    ];

    const allColumns = [
        {
            accessor: 'name',
            header: 'Name',
            render: (value, row) => {
                const fullName = row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : (value || 'Unknown');
                return (
                    <button className="link-button" onClick={() => setViewingUser(row)}>
                        {fullName}
                    </button>
                );
            }
        },
        { accessor: 'username', header: 'Username' },
        { accessor: 'email', header: 'Email' },
        {
            accessor: 'role', header: 'Role', render: (value, row) => {
                const userRole = typeof value === 'object' ? value.role : value;
                const userId = typeof value === 'object' ? value._id : row?._id;

                if (userRole === 'superadmin') return <span className="role-label">{userRole}</span>;
                return (
                    <select
                        className="role-select"
                        value={userRole}
                        onChange={(e) => handleRoleChange(userId, e.target.value)}
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="technician">Technician</option>
                        <option value="admin">Admin</option>
                    </select>
                );
            }
        },
        { accessor: 'department', header: 'Department', render: (row) => (typeof row === 'object' ? row.department : row) || '-' },
        {
            accessor: 'isActive', header: 'Active', render: (value, row) => {
                const active = typeof value === 'object' ? value.isActive : value;
                return (
                    <span className={`status-badge ${active ? 'approved' : 'rejected'}`}>
                        {active ? 'Active' : 'Inactive'}
                    </span>
                );
            }
        },
        {
            accessor: 'approvalStatus', header: 'Approval', render: (value) => {
                const status = typeof value === 'object' ? value.approvalStatus : value;
                return (
                    <span className={`status-badge ${status}`}>{status}</span>
                );
            }
        },
        {
            accessor: 'createdAt', header: 'Created',
            render: (value) => {
                const date = typeof value === 'object' ? value.createdAt : value;
                return date ? new Date(date).toLocaleDateString() : '-';
            }
        },
        {
            accessor: 'actions', header: 'Actions', render: (_, row) => (
                <div className="action-buttons">
                    {row.approvalStatus === 'pending' && (
                        <>
                            <Button variant="primary" size="small" onClick={() => handleApprove(row._id)}>Approve</Button>
                            <Button variant="danger" size="small" onClick={() => handleReject(row._id)}>Reject</Button>
                        </>
                    )}
                    <Button variant="secondary" size="small" onClick={() => setViewingUser(row)}>View</Button>
                    <Button variant="secondary" size="small" onClick={() => openEditModal(row)}>Edit</Button>
                    {row.role !== 'superadmin' && (
                        <Button variant="warning" size="small" onClick={() => openResetPasswordModal(row)}>Reset Password</Button>
                    )}
                    {row.role !== 'superadmin' && row.isActive && (
                        <Button variant="danger" size="small" onClick={() => handleDeactivate(row._id)}>Deactivate</Button>
                    )}
                </div>
            )
        }
    ];

    if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="user-management">
                <div className="page-header">
                    <div>
                        <h1>User Management</h1>
                        <p>Manage system users, roles, and permissions</p>
                    </div>
                    <Button variant="primary" onClick={openAddModal}>+ Add User</Button>
                </div>

                {message.text && (
                    <div className={`${message.type}-message`}>{message.text}</div>
                )}

                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Users ({users.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Approval ({pendingUsers.length})
                    </button>
                </div>

                {activeTab === 'pending' && (
                    <Card className="management-card">
                        {pendingUsers.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                No pending user registrations.
                            </p>
                        ) : (
                            <Table columns={pendingColumns} data={pendingUsers} />
                        )}
                    </Card>
                )}

                {activeTab === 'all' && (
                    <Card className="management-card">
                        <div className="toolbar">
                            <div className="search-filter">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                    <option value="technician">Technician</option>
                                </select>
                            </div>
                        </div>
                        <Table columns={allColumns} data={filteredUsers} />
                    </Card>
                )}

                <Modal
                    isOpen={modalMode !== null}
                    onClose={closeModal}
                    title={modalMode === 'add' ? 'Add New User' : 'Edit User'}
                    size="medium"
                >
                    <form className="user-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input name="firstName" value={formData.firstName} onChange={handleFormChange} required placeholder="letters only" />
                            </div>
                            <div className="form-group">
                                <label>Last Name *</label>
                                <input name="lastName" value={formData.lastName} onChange={handleFormChange} required placeholder="letters only" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username *</label>
                                <input name="username" value={formData.username} onChange={handleFormChange} required minLength={3} disabled={modalMode === 'edit'} placeholder="letters, numbers, underscore" />
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="name" value={formData.name} onChange={handleFormChange} disabled placeholder="Auto-generated from First & Last Name" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email *</label>
                                <input name="email" type="email" value={formData.email} onChange={handleFormChange} required placeholder="admin@uog.edu.et" />
                            </div>
                            {modalMode === 'add' && (
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input name="password" type="password" value={formData.password} onChange={handleFormChange} required minLength={6} placeholder="Letter, number, special char" />
                                </div>
                            )}
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Role *</label>
                                <select name="role" value={formData.role} onChange={handleFormChange} required>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="technician">Technician</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Campus Location *</label>
                                <select name="campus" value={formData.campus} onChange={handleFormChange} required>
                                    <option value="Maraki">Maraki</option>
                                    <option value="Atse Tewodros">Atse Tewodros</option>
                                    <option value="Atse Fasil">Atse Fasil</option>
                                    <option value="Health Science College (GC)">Health Science College (GC)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <input name="department" value={formData.department} onChange={handleFormChange} placeholder="e.g., Computer Science" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Student ID</label>
                                <input name="studentId" value={formData.studentId} onChange={handleFormChange} placeholder="e.g., UOG/2020/001" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input name="phone" value={formData.phone} onChange={handleFormChange} placeholder="10 digit number" />
                            </div>
                        </div>
                        <div className="form-actions">
                            <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
                            <Button variant="primary" type="submit" loading={submitting}>
                                {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                <Modal
                    isOpen={viewingUser !== null}
                    onClose={() => setViewingUser(null)}
                    title="User Profile Details"
                >
                    {viewingUser && (
                        <div className="detail-view">
                            <div className="detail-header">
                                <div className="user-avatar-large">{(viewingUser.firstName || viewingUser.name)?.charAt(0)}</div>
                                <h2>{viewingUser.firstName && viewingUser.lastName ? `${viewingUser.firstName} ${viewingUser.lastName}` : viewingUser.name}</h2>
                                <span className={`role-badge ${viewingUser.role}`}>{viewingUser.role}</span>
                            </div>
                            <div className="detail-grid">
                                <div className="detail-item"><strong>First Name:</strong> {viewingUser.firstName || 'N/A'}</div>
                                <div className="detail-item"><strong>Last Name:</strong> {viewingUser.lastName || 'N/A'}</div>
                                <div className="detail-item"><strong>Username:</strong> {viewingUser.username}</div>
                                <div className="detail-item"><strong>Email:</strong> {viewingUser.email}</div>
                                <div className="detail-item"><strong>Campus:</strong> {viewingUser.campus || 'N/A'}</div>
                                <div className="detail-item"><strong>Department:</strong> {viewingUser.department || 'N/A'}</div>
                                <div className="detail-item"><strong>Student ID:</strong> {viewingUser.studentId || 'N/A'}</div>
                                <div className="detail-item"><strong>Phone:</strong> {viewingUser.phone || 'N/A'}</div>
                                <div className="detail-item"><strong>Status:</strong> {viewingUser.isActive ? 'Active' : 'Inactive'}</div>
                                <div className="detail-item"><strong>Approval:</strong> {viewingUser.approvalStatus}</div>
                                <div className="detail-item"><strong>Member Since:</strong> {new Date(viewingUser.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <Button variant="secondary" onClick={() => setViewingUser(null)}>Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal
                    isOpen={resetPasswordUser !== null}
                    onClose={() => { setResetPasswordUser(null); setNewPassword(''); setConfirmPassword(''); }}
                    title={`Reset Password - ${resetPasswordUser?.name || ''}`}
                    size="small"
                >
                    {resetPasswordUser && (
                        <form className="user-form" onSubmit={handleResetPassword}>
                            <p style={{ marginBottom: '1rem', color: '#666' }}>
                                Reset password for user: <strong>{resetPasswordUser.username}</strong>
                            </p>
                            <div className="form-group">
                                <label>New Password *</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Enter new password (min 6 characters)"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password *</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div className="form-actions">
                                <Button variant="secondary" type="button" onClick={() => { setResetPasswordUser(null); setNewPassword(''); setConfirmPassword(''); }}>Cancel</Button>
                                <Button variant="primary" type="submit" loading={submitting}>Reset Password</Button>
                            </div>
                        </form>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default UserManagement;
