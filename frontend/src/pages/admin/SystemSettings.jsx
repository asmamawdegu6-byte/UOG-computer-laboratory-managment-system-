import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './SystemSettings.css';

const DEFAULT_SETTINGS = {
    general: {
        systemName: 'CLM System',
        adminEmail: 'admin@clm.edu',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h'
    },
    booking: {
        maxBookingsPerUser: 5,
        maxBookingDuration: 4,
        minBookingDuration: 1,
        advanceBookingDays: 14,
        cancellationDeadline: 24,
        autoCancelNoShow: 30
    },
    notifications: {
        emailNotifications: true,
        bookingConfirmation: true,
        bookingReminder: true,
        faultReportNotification: true,
        maintenanceAlerts: true
    },
    security: {
        passwordMinLength: 8,
        requireSpecialChars: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 15
    },
    maintenance: {
        autoBackup: true,
        backupFrequency: 'daily',
        backupRetention: 30,
        maintenanceMode: false,
        maintenanceMessage: 'System is under maintenance. Please try again later.'
    }
};

const STORAGE_KEY = 'clm_system_settings';

const SystemSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }, []);

    useEffect(() => {
        try {
            setLoading(true);
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSettings(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            showMessage('success', 'Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('error', 'Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all settings to default?')) {
            setSettings(DEFAULT_SETTINGS);
            localStorage.removeItem(STORAGE_KEY);
            showMessage('success', 'Settings reset to defaults');
        }
    };

    if (loading) {
        return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="system-settings">
                <div className="page-header">
                    <div className="header-content">
                        <h1>System Settings</h1>
                        <p>Configure system parameters and preferences</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="secondary" onClick={handleReset}>Reset to Default</Button>
                        <Button variant="primary" onClick={handleSave} loading={saving}>Save Changes</Button>
                    </div>
                </div>

                {message.text && (
                    <div className={`${message.type}-message`}>{message.text}</div>
                )}

                <div className="settings-grid">
                    <Card className="settings-card">
                        <h2>General Settings</h2>
                        <div className="settings-form">
                            <div className="form-group">
                                <label htmlFor="systemName">System Name</label>
                                <input type="text" id="systemName" value={settings.general.systemName} onChange={(e) => handleInputChange('general', 'systemName', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="adminEmail">Admin Email</label>
                                <input type="email" id="adminEmail" value={settings.general.adminEmail} onChange={(e) => handleInputChange('general', 'adminEmail', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="timezone">Timezone</label>
                                <select id="timezone" value={settings.general.timezone} onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/Denver">Mountain Time</option>
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                    <option value="Europe/London">London</option>
                                    <option value="Europe/Paris">Paris</option>
                                    <option value="Asia/Tokyo">Tokyo</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="dateFormat">Date Format</label>
                                <select id="dateFormat" value={settings.general.dateFormat} onChange={(e) => handleInputChange('general', 'dateFormat', e.target.value)}>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="timeFormat">Time Format</label>
                                <select id="timeFormat" value={settings.general.timeFormat} onChange={(e) => handleInputChange('general', 'timeFormat', e.target.value)}>
                                    <option value="24h">24 Hour</option>
                                    <option value="12h">12 Hour</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card className="settings-card">
                        <h2>Booking Settings</h2>
                        <div className="settings-form">
                            <div className="form-group">
                                <label htmlFor="maxBookingsPerUser">Max Bookings Per User</label>
                                <input type="number" id="maxBookingsPerUser" value={settings.booking.maxBookingsPerUser} onChange={(e) => handleInputChange('booking', 'maxBookingsPerUser', parseInt(e.target.value))} min="1" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="maxBookingDuration">Max Booking Duration (hours)</label>
                                <input type="number" id="maxBookingDuration" value={settings.booking.maxBookingDuration} onChange={(e) => handleInputChange('booking', 'maxBookingDuration', parseInt(e.target.value))} min="1" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="minBookingDuration">Min Booking Duration (hours)</label>
                                <input type="number" id="minBookingDuration" value={settings.booking.minBookingDuration} onChange={(e) => handleInputChange('booking', 'minBookingDuration', parseInt(e.target.value))} min="1" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="advanceBookingDays">Advance Booking Days</label>
                                <input type="number" id="advanceBookingDays" value={settings.booking.advanceBookingDays} onChange={(e) => handleInputChange('booking', 'advanceBookingDays', parseInt(e.target.value))} min="1" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cancellationDeadline">Cancellation Deadline (hours)</label>
                                <input type="number" id="cancellationDeadline" value={settings.booking.cancellationDeadline} onChange={(e) => handleInputChange('booking', 'cancellationDeadline', parseInt(e.target.value))} min="1" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="autoCancelNoShow">Auto-Cancel No-Show (minutes)</label>
                                <input type="number" id="autoCancelNoShow" value={settings.booking.autoCancelNoShow} onChange={(e) => handleInputChange('booking', 'autoCancelNoShow', parseInt(e.target.value))} min="1" />
                            </div>
                        </div>
                    </Card>

                    <Card className="settings-card">
                        <h2>Notification Settings</h2>
                        <div className="settings-form">
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={settings.notifications.emailNotifications} onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)} />
                                    Enable Email Notifications
                                </label>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={settings.notifications.bookingConfirmation} onChange={(e) => handleInputChange('notifications', 'bookingConfirmation', e.target.checked)} />
                                    Booking Confirmation
                                </label>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={settings.notifications.bookingReminder} onChange={(e) => handleInputChange('notifications', 'bookingReminder', e.target.checked)} />
                                    Booking Reminder
                                </label>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={settings.notifications.faultReportNotification} onChange={(e) => handleInputChange('notifications', 'faultReportNotification', e.target.checked)} />
                                    Fault Report Notifications
                                </label>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={settings.notifications.maintenanceAlerts} onChange={(e) => handleInputChange('notifications', 'maintenanceAlerts', e.target.checked)} />
                                    Maintenance Alerts
                                </label>
                            </div>
                        </div>
                    </Card>

                    <Card className="settings-card">
                        <h2>Security Settings</h2>
                        <div className="settings-form">
                            <div className="form-group">
                                <label htmlFor="passwordMinLength">Password Min Length</label>
                                <input type="number" id="passwordMinLength" value={settings.security.passwordMinLength} onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))} min="6" />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={settings.security.requireSpecialChars} onChange={(e) => handleInputChange('security', 'requireSpecialChars', e.target.checked)} />
                                    Require Special Characters
                                </label>
                            </div>
                            <div className="form-group">
                                <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                                <input type="number" id="sessionTimeout" value={settings.security.sessionTimeout} onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))} min="5" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="maxLoginAttempts">Max Login Attempts</label>
                                <input type="number" id="maxLoginAttempts" value={settings.security.maxLoginAttempts} onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))} min="3" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lockoutDuration">Lockout Duration (minutes)</label>
                                <input type="number" id="lockoutDuration" value={settings.security.lockoutDuration} onChange={(e) => handleInputChange('security', 'lockoutDuration', parseInt(e.target.value))} min="5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="settings-card">
                        <h2>Maintenance Settings</h2>
                        <div className="settings-form">
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={settings.maintenance.autoBackup} onChange={(e) => handleInputChange('maintenance', 'autoBackup', e.target.checked)} />
                                    Enable Auto Backup
                                </label>
                            </div>
                            <div className="form-group">
                                <label htmlFor="backupFrequency">Backup Frequency</label>
                                <select id="backupFrequency" value={settings.maintenance.backupFrequency} onChange={(e) => handleInputChange('maintenance', 'backupFrequency', e.target.value)}>
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="backupRetention">Backup Retention (days)</label>
                                <input type="number" id="backupRetention" value={settings.maintenance.backupRetention} onChange={(e) => handleInputChange('maintenance', 'backupRetention', parseInt(e.target.value))} min="7" />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" checked={settings.maintenance.maintenanceMode} onChange={(e) => handleInputChange('maintenance', 'maintenanceMode', e.target.checked)} />
                                    Maintenance Mode
                                </label>
                            </div>
                            <div className="form-group">
                                <label htmlFor="maintenanceMessage">Maintenance Message</label>
                                <textarea id="maintenanceMessage" value={settings.maintenance.maintenanceMessage} onChange={(e) => handleInputChange('maintenance', 'maintenanceMessage', e.target.value)} rows="3" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SystemSettings;
