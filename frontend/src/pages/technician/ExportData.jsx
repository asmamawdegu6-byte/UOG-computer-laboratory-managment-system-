import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useLocation } from 'react-router-dom';
import './ExportData.css';

const initialForm = {
  title: '',
  category: 'lab-summary',
  labName: '',
  dateRange: 'this-week',
  format: 'pdf',
  summary: '',
  details: '',
  includeSchedule: true,
  includeComputerStatus: true,
  includeInventory: false,
  includeMaintenance: true
};

const getTechnicianCampus = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.campus || user.campusCode || 'Atse Tewodros';
    }
  } catch (error) {
    console.error('Error getting campus:', error);
  }
  return 'Atse Tewodros';
};


const ExportData = () => {
  const [form, setForm] = useState(initialForm);
  const [labs, setLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [exporting, setExporting] = useState(false);
  const location = useLocation();


  const campus = getTechnicianCampus();

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoadingLabs(true);
        const response = await api.get('/labs', { params: { campus, all: 'true' } });
        const labsData = response.data.labs || [];
        setLabs(labsData);
        if (labsData.length > 0) {
          setForm(prev => ({ ...prev, labName: labsData[0].name }));
        }
      } catch (error) {
        console.error('Error loading labs:', error);
        setMessage({ type: 'error', text: 'Failed to load labs' });
      } finally {
        setLoadingLabs(false);
      }
    };

    // Check for pre-selected category from navigation state
    if (location.state?.category) {
      setForm(prev => ({ ...prev, category: location.state.category }));
    }

    fetchLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus]);

const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDirectExport = async (type) => {
    try {
      setExporting(true);
      setMessage({ type: '', text: '' });
      
      // Map category to export type
      const exportTypeMap = {
        'lab-summary': 'bookings',
        'computer-status': 'bookings',
        'schedule': 'reservations',
        'maintenance': 'faults',
        'inventory': 'equipment'
      };
      
      const exportType = exportTypeMap[form.category] || 'bookings';
      const format = form.format || 'csv';
      
      // Build URL with parameters
      let url = `/reports/export/${format}?type=${exportType}`;
      if (form.labName) {
        // Need to get lab ID from name
        const lab = labs.find(l => l.name === form.labName);
        if (lab) url += `&lab=${lab._id}`;
      }
      
      // For date range
      const today = new Date().toISOString().split('T')[0];
      if (form.dateRange === 'today') {
        url += `&startDate=${today}&endDate=${today}`;
      } else if (form.dateRange === 'this-week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        url += `&startDate=${weekAgo.toISOString().split('T')[0]}&endDate=${today}`;
      } else if (form.dateRange === 'this-month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        url += `&startDate=${monthAgo.toISOString().split('T')[0]}&endDate=${today}`;
      }
      
      // Download the file
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Set filename
      const filename = `${form.category}_${form.labName || 'all'}_${today}.${format === 'csv' ? 'csv' : 'html'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setMessage({
        type: 'success',
        text: `Exported ${form.category} data successfully`
      });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to export data'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      setSubmitting(true);
      const response = await api.post('/notifications/export-data', form);
      setMessage({
        type: 'success',
        text: response.data.message || 'Export data request sent to admin and super admin'
      });
      setForm(prev => ({
        ...initialForm,
        labName: prev.labName
      }));
    } catch (error) {
      console.error('Error submitting export data request:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send export data request'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="export-data-page">
        <div className="page-header">
          <div>
            <h1>Export Data</h1>
            <p className="page-description">Send lab export data requests to admin and super admin</p>
          </div>
        </div>

        {message.text && (
          <div className={`export-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <Card className="export-data-card" title="Export Data Form">
          <form className="export-data-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Weekly lab export"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Data Type</label>
                <select id="category" name="category" value={form.category} onChange={handleChange}>
                  <option value="lab-summary">Lab Summary</option>
          
                  <option value="computer-status">Computer Status</option>
                  <option value="schedule">Schedule</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inventory">Inventory</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="labName">Lab</label>
                <select
                  id="labName"
                  name="labName"
                  value={form.labName}
                  onChange={handleChange}
                  disabled={loadingLabs || labs.length === 0}
                >
                  {labs.length === 0 ? (
                    <option value="">No lab found</option>
                  ) : (
                    labs.map(lab => (
                      <option key={lab._id} value={lab.name}>{lab.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dateRange">Date Range</label>
                <select id="dateRange" name="dateRange" value={form.dateRange} onChange={handleChange}>
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="semester">Semester</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="format">Format</label>
                <select id="format" name="format" value={form.format} onChange={handleChange}>
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="summary">Summary</label>
                <input
                  id="summary"
                  name="summary"
                  type="text"
                  value={form.summary}
                  onChange={handleChange}
                  required
                  placeholder="Short summary for admin review"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="details">Details</label>
              <textarea
                id="details"
                name="details"
                rows="5"
                value={form.details}
                onChange={handleChange}
                placeholder="Add notes, date details, or any specific export requirement"
              />
            </div>

            <div className="export-checklist">
              <label>
                <input type="checkbox" name="includeSchedule" checked={form.includeSchedule} onChange={handleChange} />
                Schedule
              </label>
              <label>
                <input type="checkbox" name="includeComputerStatus" checked={form.includeComputerStatus} onChange={handleChange} />
                Computer Status
              </label>
              <label>
                <input type="checkbox" name="includeInventory" checked={form.includeInventory} onChange={handleChange} />
                Inventory
              </label>
              <label>
                <input type="checkbox" name="includeMaintenance" checked={form.includeMaintenance} onChange={handleChange} />
                Maintenance
              </label>
            </div>

<div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setForm({ ...initialForm, labName: form.labName })}>
                Reset
              </Button>
              <Button type="button" variant="outline" onClick={() => handleDirectExport('csv')} loading={exporting} disabled={!form.category}>
                Export CSV
              </Button>
              <Button type="button" variant="outline" onClick={() => handleDirectExport('pdf')} loading={exporting} disabled={!form.category}>
                Export PDF
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                Send to Admin
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExportData;
