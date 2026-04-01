import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { superadminService } from '../../services/superadminService';
import './SystemConfiguration.css';

const SystemConfiguration = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingConfig, setEditingConfig] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ key: '', value: '', category: 'system', description: '' });
    const [activeCategory, setActiveCategory] = useState('all');

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }, []);

    const fetchConfigs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await superadminService.getConfigs();
            setConfigs(data.configs || []);
        } catch (error) {
            showMessage('error', 'Failed to load configurations');
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

    const categories = ['all', ...new Set(configs.map(c => c.category))];

    const filteredConfigs = activeCategory === 'all'
        ? configs
        : configs.filter(c => c.category === activeCategory);

    const openEdit = (config) => {
        setEditingConfig(config);
        setEditValue(typeof config.value === 'object' ? JSON.stringify(config.value) : String(config.value));
    };

    const closeEdit = () => {
        setEditingConfig(null);
        setEditValue('');
    };

    const handleSave = async () => {
        if (!editingConfig) return;
        setSubmitting(true);
        try {
            let parsedValue = editValue;
            if (editValue === 'true') parsedValue = true;
            else if (editValue === 'false') parsedValue = false;
            else if (!isNaN(editValue) && editValue.trim() !== '') parsedValue = Number(editValue);

            const result = await superadminService.updateConfig(editingConfig.key, parsedValue);
            if (result.success) {
                showMessage('success', 'Configuration updated');
                closeEdit();
                fetchConfigs();
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to update');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let parsedValue = createForm.value;
            if (createForm.value === 'true') parsedValue = true;
            else if (createForm.value === 'false') parsedValue = false;
            else if (!isNaN(createForm.value) && createForm.value.trim() !== '') parsedValue = Number(createForm.value);

            const result = await superadminService.createConfig({
                key: createForm.key,
                value: parsedValue,
                category: createForm.category,
                description: createForm.description
            });
            if (result.success) {
                showMessage('success', 'Configuration created');
                setShowCreate(false);
                setCreateForm({ key: '', value: '', category: 'system', description: '' });
                fetchConfigs();
            }
        } catch (error) {
            showMessage('error', error?.response?.data?.message || 'Failed to create');
        } finally {
            setSubmitting(false);
        }
    };

    const getCategoryColor = (cat) => {
        const colors = { booking: '#3498db', system: '#9b59b6', notification: '#2ecc71', security: '#e74c3c', display: '#f39c12' };
        return colors[cat] || '#999';
    };

    const formatValue = (val) => {
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="sc-page">
                <div className="page-header">
                    <div>
                        <h1>System Configuration</h1>
                        <p>Advanced system configuration and settings</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowCreate(true)}>+ Add Config</Button>
                </div>

                {message.text && <div className={`${message.type}-message`}>{message.text}</div>}

                {/* Category Tabs */}
                <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`tab ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                            style={activeCategory === cat ? { backgroundColor: getCategoryColor(cat), borderColor: getCategoryColor(cat) } : {}}
                        >
                            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="sc-grid">
                    {filteredConfigs.map(config => (
                        <div key={config.key} className="sc-card">
                            <div className="sc-card-header">
                                <span className="sc-category" style={{ backgroundColor: getCategoryColor(config.category) + '20', color: getCategoryColor(config.category) }}>
                                    {config.category}
                                </span>
                                <Button variant="secondary" size="small" onClick={() => openEdit(config)}>Edit</Button>
                            </div>
                            <div className="sc-key">{config.key}</div>
                            <div className="sc-description">{config.description || 'No description'}</div>
                            <div className="sc-value">
                                <span className="sc-value-label">Value:</span>
                                <span className={`sc-value-display ${typeof config.value === 'boolean' ? (config.value ? 'sc-true' : 'sc-false') : ''}`}>
                                    {formatValue(config.value)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredConfigs.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No configurations found.</p>
                )}

                {/* Edit Modal */}
                <Modal isOpen={!!editingConfig} onClose={closeEdit} title="Edit Configuration" size="small">
                    {editingConfig && (
                        <div className="sc-edit-form">
                            <div className="form-group">
                                <label>Key</label>
                                <input value={editingConfig.key} disabled style={{ background: '#f5f5f5' }} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input value={editingConfig.description || ''} disabled style={{ background: '#f5f5f5' }} />
                            </div>
                            <div className="form-group">
                                <label>Value</label>
                                {typeof editingConfig.value === 'boolean' ? (
                                    <select value={editValue} onChange={(e) => setEditValue(e.target.value)}>
                                        <option value="true">true</option>
                                        <option value="false">false</option>
                                    </select>
                                ) : (
                                    <input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        type={typeof editingConfig.value === 'number' ? 'number' : 'text'}
                                    />
                                )}
                            </div>
                            <div className="form-actions">
                                <Button variant="secondary" onClick={closeEdit}>Cancel</Button>
                                <Button variant="primary" onClick={handleSave} loading={submitting}>Save</Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Create Modal */}
                <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Configuration" size="medium">
                    <form className="sc-edit-form" onSubmit={handleCreate}>
                        <div className="form-group">
                            <label>Key *</label>
                            <input
                                value={createForm.key}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, key: e.target.value }))}
                                placeholder="e.g., booking.maxPerUser"
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={createForm.category}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                                >
                                    <option value="system">System</option>
                                    <option value="booking">Booking</option>
                                    <option value="notification">Notification</option>
                                    <option value="security">Security</option>
                                    <option value="display">Display</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Value *</label>
                                <input
                                    value={createForm.value}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, value: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <input
                                value={createForm.description}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                        <div className="form-actions">
                            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button variant="primary" type="submit" loading={submitting}>Create</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default SystemConfiguration;
