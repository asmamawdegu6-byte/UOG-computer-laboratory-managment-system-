import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import Notification from '../../components/ui/Notification';
import './MyProfile.css';

const MyProfile = () => {
    const { user, login, updateUser: updateAuthUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        campus: '',
        college: '',
        studentId: '',
        year: '',
        semester: ''
    });

    // Password change form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Editing state
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                department: user.department || '',
                campus: user.campus || '',
                college: user.college || '',
                studentId: user.studentId || '',
                year: user.year || '',
                semester: user.semester || ''
            });
        }
    }, [user]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('error', 'Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('error', 'Image size must be less than 5MB');
            return;
        }

        setPhotoUploading(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);

            const api = (await import('../../services/api')).default;
            const response = await api.post('/auth/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                showNotification('success', 'Profile photo updated successfully!');
                // Update local user data with new photo URL
                const updatedUser = { ...user, photoUrl: response.data.photoUrl };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                if (updateAuthUser) {
                    updateAuthUser(updatedUser);
                }
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            showNotification('error', error?.response?.data?.message || 'Failed to upload photo');
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updateData = {};
            if (profileForm.name) updateData.name = profileForm.name;
            if (profileForm.email) updateData.email = profileForm.email;
            if (profileForm.phone) updateData.phone = profileForm.phone;
            if (profileForm.department) updateData.department = profileForm.department;
            if (profileForm.campus) updateData.campus = profileForm.campus;
            if (profileForm.college) updateData.college = profileForm.college;

            const result = await userService.updateUser(user.id || user._id, updateData);
            if (result.success) {
                showNotification('success', 'Profile updated successfully!');
                setIsEditing(false);
                // Update local storage user data
                const updatedUser = { ...user, ...updateData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                showNotification('error', result.message || 'Failed to update profile');
            }
        } catch (error) {
            showNotification('error', error?.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword.length < 6) {
            showNotification('error', 'New password must be at least 6 characters');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showNotification('error', 'New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const api = (await import('../../services/api')).default;
            const result = await api.post('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            if (result.data.success) {
                showNotification('success', 'Password changed successfully!');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                showNotification('error', result.data.message || 'Failed to change password');
            }
        } catch (error) {
            showNotification('error', error?.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = (role) => {
        const labels = {
            student: 'Student',
            teacher: 'Teacher',
            technician: 'Technician',
            admin: 'Administrator',
            superadmin: 'Super Administrator'
        };
        return labels[role] || role;
    };

    const getRoleColor = (role) => {
        const colors = {
            student: '#3498db',
            teacher: '#2ecc71',
            technician: '#f39c12',
            admin: '#e74c3c',
            superadmin: '#9b59b6'
        };
        return colors[role] || '#3949ab';
    };

    return (
        <DashboardLayout>
            <div className="my-profile-page">
                {notification && (
                    <Notification
                        type={notification.type}
                        message={notification.message}
                        onClose={() => setNotification(null)}
                        position="top-right"
                    />
                )}

                <div className="profile-header">
                    <div className="profile-avatar-wrapper">
                        <div 
                            className="profile-avatar" 
                            style={{ backgroundColor: getRoleColor(user?.role) }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {user?.photoUrl ? (
                                <img 
                                    src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${user.photoUrl}`} 
                                    alt="Profile" 
                                    className="profile-photo"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = user?.name?.charAt(0)?.toUpperCase() || 'U';
                                    }}
                                />
                            ) : (
                                user?.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                            {photoUploading && (
                                <div className="photo-upload-overlay">
                                    <div className="spinner"></div>
                                </div>
                            )}
                        </div>
                        <button 
                            className="photo-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photoUploading}
                            title="Change profile photo"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>
                    <div className="profile-header-info">
                        <h1>{user?.name || 'User'}</h1>
                        <span className="profile-role-badge" style={{ backgroundColor: getRoleColor(user?.role) }}>
                            {getRoleLabel(user?.role)}
                        </span>
                        <p className="profile-username">@{user?.username || 'username'}</p>
                    </div>
                </div>

                <div className="profile-tabs">
                    <button
                        className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Profile Information
                    </button>
                    <button
                        className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Security
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <Card className="profile-card">
                        <div className="card-header">
                            <h2>Profile Information</h2>
                            {!isEditing && (
                                <Button variant="secondary" size="small" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={profileForm.name}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileForm.email}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profileForm.phone}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={profileForm.department}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        placeholder="Enter department"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Campus</label>
                                    <select
                                        name="campus"
                                        value={profileForm.campus}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                    >
                                        <option value="">Select Campus</option>
                                        <option value="Maraki">Maraki</option>
                                        <option value="Atse Tewodros">Atse Tewodros</option>
                                        <option value="Atse Fasil">Atse Fasil</option>
                                        <option value="Health Science College (GC)">Health Science College (GC)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>College</label>
                                    <input
                                        type="text"
                                        name="college"
                                        value={profileForm.college}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        placeholder="Enter college"
                                    />
                                </div>
                            </div>
                            {user?.role === 'student' && (
                                <>
                                    <div className="form-group">
                                        <label>Student ID</label>
                                        <input
                                            type="text"
                                            name="studentId"
                                            value={profileForm.studentId}
                                            disabled
                                            placeholder="Student ID"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Year</label>
                                            <input
                                                type="text"
                                                name="year"
                                                value={profileForm.year ? `Year ${profileForm.year}` : ''}
                                                disabled
                                                placeholder="Year"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Semester</label>
                                            <input
                                                type="text"
                                                name="semester"
                                                value={profileForm.semester ? `Semester ${profileForm.semester}` : ''}
                                                disabled
                                                placeholder="Semester"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            {isEditing && (
                                <div className="form-actions">
                                    <Button variant="secondary" type="button" onClick={() => {
                                        setIsEditing(false);
                                        setProfileForm({
                                            name: user?.name || '',
                                            email: user?.email || '',
                                            phone: user?.phone || '',
                                            department: user?.department || '',
                                            campus: user?.campus || '',
                                            college: user?.college || '',
                                            studentId: user?.studentId || '',
                                            year: user?.year || '',
                                            semester: user?.semester || ''
                                        });
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit" loading={loading}>
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </form>
                    </Card>
                )}

                {activeTab === 'security' && (
                    <Card className="profile-card">
                        <div className="card-header">
                            <h2>Change Password</h2>
                        </div>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={6}
                                        placeholder="Enter new password (min 6 characters)"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={6}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <Button variant="primary" type="submit" loading={loading}>
                                    Change Password
                                </Button>
                            </div>
                        </form>

                        <div className="security-info">
                            <h3>Account Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Username</span>
                                    <span className="info-value">{user?.username}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Role</span>
                                    <span className="info-value">{getRoleLabel(user?.role)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Account Status</span>
                                    <span className="info-value status-active">Active</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyProfile;
