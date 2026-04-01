import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import './ReportFault.css';

const ReportFault = () => {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [formData, setFormData] = useState({
    labId: '',
    workstation: '',
    faultType: '',
    severity: 'medium',
    title: '',
    description: '',
    submittedTo: 'technician'
  });
  const [labs, setLabs] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faultId, setFaultId] = useState('');

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await api.get('/labs');
      setLabs(response.data.labs || []);
    } catch (err) {
      console.error('Error fetching labs:', err);
    }
  };

  const faultTypes = [
    { id: 'hardware', name: 'Hardware Issue', icon: '🔧' },
    { id: 'software', name: 'Software Problem', icon: '💻' },
    { id: 'network', name: 'Network Issue', icon: '🌐' },
    { id: 'peripheral', name: 'Peripheral Problem', icon: '🖱️' },
    { id: 'other', name: 'Other', icon: '⚠️' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFaultTypeSelect = (typeId) => {
    setFormData({ ...formData, faultType: typeId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.faultType) {
      setError('Please select a fault type');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title for the fault');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/maintenance/faults', {
        labId: formData.labId,
        workstation: formData.workstation,
        category: formData.faultType,
        severity: formData.severity,
        title: formData.title,
        description: formData.description,
        submittedTo: formData.submittedTo
      });

      if (response.data.success) {
        setFaultId(response.data.fault?._id || '');
        setSubmitted(true);
        addToast({
          type: 'success',
          title: 'Fault Reported',
          message: 'Your fault report has been submitted successfully.',
          duration: 5000
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit fault report. Please try again.');
      console.error('Error submitting fault:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="report-fault">
          <div className="success-container">
            <div className="success-icon">✓</div>
            <h1>Fault Reported Successfully!</h1>
            <p>Thank you for reporting. Our technicians will look into this issue.</p>
            <div className="ticket-info">
              <div className="ticket-number">
                <span>Fault ID</span>
                <strong>{faultId || 'N/A'}</strong>
              </div>
            </div>
            <div className="success-actions">
              <button onClick={() => { setSubmitted(false); setFormData({ labId: '', workstation: '', faultType: '', severity: 'medium', title: '', description: '', submittedTo: 'technician' }); setError(''); }} className="btn-primary">
                Report Another Fault
              </button>
              <button onClick={() => navigate('/student/dashboard')} className="btn-secondary">Back to Dashboard</button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="report-fault">
        <div className="page-header">
          <h1>Report a Fault</h1>
          <p>Report hardware or software issues in the computer labs</p>
        </div>

        <div className="fault-form-container">
          {error && <div className="error-message">{error}</div>}

          {/* Severity Level Info */}
          <div className="severity-info">
            <h3>Severity Levels</h3>
            <div className="severity-levels">
              <div className="severity-item low">
                <span className="dot"></span>
                <div>
                  <strong>Low</strong>
                  <p>Minor issues that don't affect work</p>
                </div>
              </div>
              <div className="severity-item medium">
                <span className="dot"></span>
                <div>
                  <strong>Medium</strong>
                  <p>Issues affecting some functionality</p>
                </div>
              </div>
              <div className="severity-item high">
                <span className="dot"></span>
                <div>
                  <strong>High</strong>
                  <p>Critical issues preventing work</p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Form */}
          <form onSubmit={handleSubmit} className="fault-form">
            <div className="form-section">
              <h3>Location Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Lab *</label>
                  <select
                    name="labId"
                    required
                    value={formData.labId}
                    onChange={handleChange}
                  >
                    <option value="">Choose a lab...</option>
                    {labs.map(lab => (
                      <option key={lab._id} value={lab._id}>{lab.name} ({lab.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Workstation ID</label>
                  <input
                    type="text"
                    name="workstation"
                    placeholder="e.g., PC-12"
                    value={formData.workstation}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Fault Details</h3>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Brief summary of the issue (e.g., Computer #5 not booting)"
                  required
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Fault Type *</label>
                <div className="fault-type-grid">
                  {faultTypes.map(type => (
                    <div
                      key={type.id}
                      className={`fault-type-card ${formData.faultType === type.id ? 'selected' : ''}`}
                      onClick={() => handleFaultTypeSelect(type.id)}
                    >
                      <span className="fault-icon">{type.icon}</span>
                      <span>{type.name}</span>
                    </div>
                  ))}
                </div>
                <input type="hidden" name="faultType" value={formData.faultType} required />
              </div>

              <div className="form-group">
                <label>Severity Level *</label>
                <div className="severity-selector">
                  <label className={`severity-option ${formData.severity === 'low' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="severity"
                      value="low"
                      checked={formData.severity === 'low'}
                      onChange={handleChange}
                    />
                    <span className="severity-label low">Low</span>
                  </label>
                  <label className={`severity-option ${formData.severity === 'medium' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="severity"
                      value="medium"
                      checked={formData.severity === 'medium'}
                      onChange={handleChange}
                    />
                    <span className="severity-label medium">Medium</span>
                  </label>
                  <label className={`severity-option ${formData.severity === 'high' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="severity"
                      value="high"
                      checked={formData.severity === 'high'}
                      onChange={handleChange}
                    />
                    <span className="severity-label high">High</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="Please describe the issue in detail..."
                  required
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Submit To *</label>
                <div className="submit-to-selector">
                  <label className={`submit-to-option ${formData.submittedTo === 'technician' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="submittedTo"
                      value="technician"
                      checked={formData.submittedTo === 'technician'}
                      onChange={handleChange}
                    />
                    <span className="submit-to-label technician">
                      <span className="submit-to-icon">🔧</span>
                      <span className="submit-to-text">
                        <strong>Technician</strong>
                        <small>For hardware/software repairs</small>
                      </span>
                    </span>
                  </label>
                  <label className={`submit-to-option ${formData.submittedTo === 'admin' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="submittedTo"
                      value="admin"
                      checked={formData.submittedTo === 'admin'}
                      onChange={handleChange}
                    />
                    <span className="submit-to-label admin">
                      <span className="submit-to-icon">👤</span>
                      <span className="submit-to-text">
                        <strong>Admin</strong>
                        <small>For management issues</small>
                      </span>
                    </span>
                  </label>
                  <label className={`submit-to-option ${formData.submittedTo === 'superadmin' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="submittedTo"
                      value="superadmin"
                      checked={formData.submittedTo === 'superadmin'}
                      onChange={handleChange}
                    />
                    <span className="submit-to-label superadmin">
                      <span className="submit-to-icon">🛡️</span>
                      <span className="submit-to-text">
                        <strong>Super Admin</strong>
                        <small>For critical system issues</small>
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportFault;
