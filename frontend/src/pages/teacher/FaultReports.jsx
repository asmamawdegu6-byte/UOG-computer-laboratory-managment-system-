import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './FaultReports.css';

const FaultReports = () => {
    const [faults, setFaults] = useState([]);
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        labId: '',
        title: '',
        category: 'hardware',
        severity: 'medium',
        description: '',
        submittedTo: 'technician'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [faultsRes, labsRes] = await Promise.all([
                api.get('/maintenance/faults'),
                api.get('/labs')
            ]);
            setFaults(faultsRes.data.faults || []);
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
            const response = await api.post('/maintenance/faults', formData);
            if (response.data.success) {
                setSuccessMessage('Fault report submitted successfully');
                setShowForm(false);
                setFormData({
                    labId: '',
                    title: '',
                    category: 'hardware',
                    severity: 'medium',
                    description: '',
                    submittedTo: 'technician'
                });
                fetchData(); // Refresh the list
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to submit fault report');
            console.error('Error submitting fault:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            open: { bg: '#fef3c7', color: '#92400e' },
            'in-progress': { bg: '#dbeafe', color: '#1e40af' },
            resolved: { bg: '#d1fae5', color: '#065f46' },
            closed: { bg: '#f3f4f6', color: '#374151' }
        };

        const colors = statusColors[status] || statusColors.open;

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

    const getSeverityBadge = (severity) => {
        const severityColors = {
            low: { bg: '#f3f4f6', color: '#374151' },
            medium: { bg: '#fef3c7', color: '#92400e' },
            high: { bg: '#fee2e2', color: '#991b1b' },
            critical: { bg: '#dc2626', color: '#ffffff' }
        };

        const colors = severityColors[severity] || severityColors.medium;

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
                {severity}
            </span>
        );
    };

    const columns = [
        {
            header: 'Lab',
            accessor: 'lab.name',
            render: (row) => row.lab?.name || 'N/A'
        },
        {
            header: 'Title',
            accessor: 'title'
        },
        {
            header: 'Category',
            accessor: 'category',
            render: (row) => (
                <span style={{ textTransform: 'capitalize' }}>{row.category}</span>
            )
        },
        {
            header: 'Severity',
            accessor: 'severity',
            render: (row) => getSeverityBadge(row.severity)
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => getStatusBadge(row.status)
        },
        {
            header: 'Submitted To',
            accessor: 'submittedTo',
            render: (row) => {
                const roleLabels = {
                    technician: { label: 'Technician', color: '#2563eb', bg: '#dbeafe' },
                    admin: { label: 'Admin', color: '#7c3aed', bg: '#ede9fe' },
                    superadmin: { label: 'Super Admin', color: '#dc2626', bg: '#fee2e2' }
                };
                const info = roleLabels[row.submittedTo] || roleLabels.technician;
                return (
                    <span
                        style={{
                            backgroundColor: info.bg,
                            color: info.color,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                        }}
                    >
                        {info.label}
                    </span>
                );
            }
        },
        {
            header: 'Reported',
            accessor: 'createdAt',
            render: (row) => new Date(row.createdAt).toLocaleDateString()
        }
    ];

    return (
        <DashboardLayout>
            <div className="fault-reports">
                <div className="page-header">
                    <div>
                        <h1>Fault Reports</h1>
                        <p className="page-description">View and report equipment faults</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'Report Fault'}
                    </Button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                {showForm && (
                    <Card title="Report New Fault" className="fault-form-card">
                        <form onSubmit={handleSubmit}>
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
                                <label>Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Computer #5 not working, Projector malfunction"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select name="category" value={formData.category} onChange={handleChange} required>
                                        <option value="hardware">Hardware</option>
                                        <option value="software">Software</option>
                                        <option value="network">Network</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Severity</label>
                                    <select name="severity" value={formData.severity} onChange={handleChange} required>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe the issue in detail..."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Submit To</label>
                                <select name="submittedTo" value={formData.submittedTo} onChange={handleChange} required>
                                    <option value="technician">Technician</option>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>

                            <Button type="submit" variant="primary">
                                Submit Report
                            </Button>
                        </form>
                    </Card>
                )}

                <Card title="All Fault Reports">
                    {loading ? (
                        <div className="loading">Loading fault reports...</div>
                    ) : faults.length === 0 ? (
                        <div className="empty-state">
                            <p>No fault reports found.</p>
                        </div>
                    ) : (
                        <Table columns={columns} data={faults} />
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default FaultReports;
