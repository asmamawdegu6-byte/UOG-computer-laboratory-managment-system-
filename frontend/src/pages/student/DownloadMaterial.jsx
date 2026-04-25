import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import './DownloadMaterial.css';

const DownloadMaterial = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [downloading, setDownloading] = useState(null);

  const categories = [
    { id: 'all', name: 'All Materials', icon: '📁' },
    { id: 'programming', name: 'Programming', icon: '💻' },
    { id: 'database', name: 'Database', icon: '🗄️' },
    { id: 'networking', name: 'Networking', icon: '🌐' },
    { id: 'multimedia', name: 'Multimedia', icon: '🎨' },
    { id: 'documentation', name: 'Documentation', icon: '📄' },
    { id: 'lab-manual', name: 'Lab Manuals', icon: '📖' },
    { id: 'ppt', name: 'Presentations', icon: '📊' },
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/materials');
      setMaterials(response.data.materials || []);
    } catch (err) {
      setError('Failed to fetch materials');
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch =
      (material.title && material.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.course && material.course.toLowerCase().includes(searchTerm.toLowerCase()));

    // If the material has a category field, match it. 
    // Otherwise, show it under 'all' or if the search matches.
    const matchesCategory = selectedCategory === 'all' ||
      (material.category && material.category === selectedCategory) ||
      (material.fileType && selectedCategory === 'documentation' && material.fileType === 'pdf');

    return matchesSearch && matchesCategory;
  });

  const handleDownload = async (materialId, fileName) => {
    try {
      setDownloading(materialId);
      const response = await api.get(`/materials/${materialId}/download`, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });

      if (!response || !response.data) {
        throw new Error('No data received from server');
      }

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      if (contentType.includes('application/json')) {
        const text = await new Response(response.data).text();
        const data = JSON.parse(text);
        throw new Error(data.message || 'Download failed');
      }

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'material-download';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Download failed:', err);
      let errorMessage = 'Failed to download file. Please try again.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
    } finally {
      setDownloading(null);
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      pdf: '📕',
      doc: '📘',
      docx: '📘',
      ppt: '📊',
      pptx: '📊',
      xls: '📗',
      xlsx: '📗',
      zip: '📦',
      rar: '📦',
      mp4: '🎥',
      mp3: '🎵',
      jpg: '🖼️',
    };
    return icons[fileType.toLowerCase()] || '📄';
  };

  return (
    <DashboardLayout>
      <div className="download-material">
        <div className="page-header">
          <h1>Download Materials</h1>
          <p>Access course materials, tutorials, and lab resources</p>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-section">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="results-count">
          Showing {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Materials Grid */}
        <div className="materials-grid">
          {loading ? (
            <div className="loading">Loading materials...</div>
          ) : filteredMaterials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No materials found</h3>
              <p>Try adjusting your search or category filter</p>
            </div>
          ) : (
            filteredMaterials.map(material => {
              const fileSizeMB = material.fileSize
                ? (material.fileSize / (1024 * 1024)).toFixed(2) + ' MB'
                : 'Unknown size';

              return (
                <div key={material._id} className="material-card">
                  <div className="material-header">
                    <div className="file-icon">{getFileIcon(material.fileType)}</div>
                    <div className="file-meta">
                      <span className="file-type">{material.fileType.toUpperCase()}</span>
                      <span className="file-size">{fileSizeMB}</span>
                    </div>
                  </div>

                  <h3 className="material-title">{material.title}</h3>
                  <div className="course-badge">{material.course}</div>
                  <p className="material-description">{material.description || 'No description provided.'}</p>

                  <div className="material-info">
                    <div className="info-item">
                      <span className="label">Uploaded by:</span>
                      <span>{material.uploadedBy?.name || 'Instructor'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Date:</span>
                      <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Downloads:</span>
                      <span>{material.downloadCount || 0}</span>
                    </div>
                  </div>

                  <button
                    className="download-btn"
                    onClick={() => handleDownload(material._id, material.fileName)}
                    disabled={downloading === material._id}
                  >
                    {downloading === material._id ? (
                      <>
                        <span className="spinner"></span>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DownloadMaterial;
