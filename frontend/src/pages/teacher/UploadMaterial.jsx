import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import api from '../../services/api';
import './UploadMaterial.css';

const UploadMaterial = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: '',
        category: 'programming',
        fileType: 'pdf',
        file: null
    });

    const [previewUrl, setPreviewUrl] = useState(null);

    const getAcceptType = (fileType) => {
        const types = {
            pdf: '.pdf',
            doc: '.doc,.docx',
            ppt: '.ppt,.pptx',
            xls: '.xls,.xlsx',
            mp4: 'video/*',
            mp3: 'audio/*',
            jpg: 'image/*'
        };
        return types[fileType] || '*';
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const response = await api.get('/materials/my-materials');
            setMaterials(response.data.materials || []);
        } catch (err) {
            setError('Failed to fetch materials');
            console.error('Error fetching materials:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFormData({ ...formData, file: selectedFile });

        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.file) {
            setError('Please select a file to upload');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('course', formData.course);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('fileType', formData.fileType);
            formDataToSend.append('file', formData.file);

            const response = await api.post('/materials', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setSuccessMessage('Material uploaded successfully');
                setShowForm(false);
                setFormData({
                    title: '',
                    description: '',
                    course: '',
                    category: 'programming',
                    fileType: 'pdf',
                    file: null
                });
                setPreviewUrl(null);
                fetchMaterials(); // Refresh the list
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to upload material');
            console.error('Error uploading material:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDelete = async (materialId) => {
        if (!window.confirm('Are you sure you want to delete this material?')) {
            return;
        }

        try {
            const response = await api.delete(`/materials/${materialId}`);
            if (response.data.success) {
                setSuccessMessage('Material deleted successfully');
                fetchMaterials(); // Refresh the list
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to delete material');
            console.error('Error deleting material:', err);
            setTimeout(() => setError(''), 3000);
        }
    };

    const getFileTypeIcon = (fileType) => {
        const icons = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            ppt: '📊',
            pptx: '📊',
            xls: '📈',
            xlsx: '📈',
            zip: '📦',
            rar: '📦',
            mp4: '🎥',
            mp3: '🎵',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️'
        };
        return icons[fileType] || '📁';
    };

    const columns = [
        {
            header: 'Title',
            accessor: 'title',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{getFileTypeIcon(row.fileType)}</span>
                    <div>
                        <div style={{ fontWeight: '500' }}>{row.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.course}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Description',
            accessor: 'description',
            render: (row) => (
                <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.description || 'No description'}
                </div>
            )
        },
        {
            header: 'File Type',
            accessor: 'fileType',
            render: (row) => (
                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '600' }}>
                    {row.fileType}
                </span>
            )
        },
        {
            header: 'Downloads',
            accessor: 'downloadCount'
        },
        {
            header: 'Uploaded',
            accessor: 'createdAt',
            render: (row) => new Date(row.createdAt).toLocaleDateString()
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => window.open(row.fileUrl, '_blank')}
                    >
                        View
                    </Button>
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
            <div className="upload-material">
                <div className="page-header">
                    <div>
                        <h1>Upload Materials</h1>
                        <p className="page-description">Upload and manage course materials for students</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : 'Upload Material'}
                    </Button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                {showForm && (
                    <Card title="Upload New Material" className="upload-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Lecture 1 - Introduction to Programming"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Course</label>
                                <input
                                    type="text"
                                    name="course"
                                    value={formData.course}
                                    onChange={handleChange}
                                    placeholder="e.g., CS101 - Introduction to Programming"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} required>
                                    <option value="programming">Programming</option>
                                    <option value="database">Database</option>
                                    <option value="networking">Networking</option>
                                    <option value="multimedia">Multimedia</option>
                                    <option value="documentation">Documentation</option>
                                    <option value="lab-manual">Lab Manual</option>
                                    <option value="ppt">Presentation (PPT)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief description of the material..."
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>File Type</label>
                                    <select name="fileType" value={formData.fileType} onChange={handleChange} required>
                                        <option value="pdf">PDF</option>
                                        <option value="doc">Word Document</option>
                                        <option value="ppt">PowerPoint</option>
                                        <option value="xls">Excel</option>
                                        <option value="zip">ZIP Archive</option>
                                        <option value="mp4">Video</option>
                                        <option value="mp3">Audio</option>
                                        <option value="jpg">Image</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>File</label>
                                    <input
                                        type="file"
                                        name="file"
                                        accept={getAcceptType(formData.fileType)}
                                        onChange={handleFileChange}
                                        required
                                    />
                                    {previewUrl && (
                                        <div className="image-preview-container" style={{ marginTop: '1rem' }}>
                                            <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" variant="primary">
                                Upload Material
                            </Button>
                        </form>
                    </Card>
                )}

                <Card title="My Materials">
                    {loading ? (
                        <div className="loading">Loading materials...</div>
                    ) : materials.length === 0 ? (
                        <div className="empty-state">
                            <p>No materials uploaded yet.</p>
                        </div>
                    ) : (
                        <Table columns={columns} data={materials} />
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default UploadMaterial;
