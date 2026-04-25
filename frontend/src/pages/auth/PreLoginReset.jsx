import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './PreLoginReset.css';

const PreLoginReset = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('search'); // search, verify, reset
   const [searchTerm, setSearchTerm] = useState('');
   const [searchResult, setSearchResult] = useState(null);
   const [phoneNumber, setPhoneNumber] = useState(import.meta.env.VITE_SUPERADMIN_PHONE || '0928886341'); // From environment, but will be overridden by student's phone
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const response = await api.get('/users', { 
        params: { 
          search: searchTerm
        } 
      });
      
      const users = response.data.users || [];
      const studentUser = users.find(u => u.role === 'student');
      
      if (!studentUser) {
        setMessage({ type: 'error', text: 'No student user found with this information' });
      } else {
        setSearchResult(studentUser);
         setPhoneNumber(studentUser.phone || import.meta.env.VITE_SUPERADMIN_PHONE || '0928886341');
        setMessage({ type: '', text: '' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to search user' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setMessage({ type: 'error', text: 'Please enter phone number' });
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/send-reset-code', { phone: phoneNumber });
      setStep('verify');
      setMessage({ type: 'success', text: 'Verification code sent to ' + phoneNumber });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send verification code' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setMessage({ type: 'error', text: 'Please enter verification code' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/verify-reset-code', { 
        phone: phoneNumber, 
        code: verificationCode 
      });
      
      if (response.data.success) {
        setStep('reset');
        setMessage({ type: 'success', text: 'Code verified successfully' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Invalid verification code' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password-by-phone', { 
        phone: phoneNumber, 
        newPassword 
      });
      
      setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prelogin-reset-container">
      <div className="prelogin-reset-box">
        <div className="logo-section">
          <h1>CLM System</h1>
          <p>Reset Student Password</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {step === 'search' && (
          <form onSubmit={handleSearch} className="reset-form">
            <div className="form-group">
              <label>Enter Username or Student ID</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter username or student ID"
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Searching...' : 'Search User'}
            </button>
          </form>
        )}

        {step === 'search' && searchResult && (
          <div className="search-result">
            <div className="result-info">
              <p><strong>Name:</strong> {searchResult.firstName} {searchResult.lastName}</p>
              <p><strong>Username:</strong> {searchResult.username}</p>
              <p><strong>Student ID:</strong> {searchResult.studentId || 'N/A'}</p>
            </div>
            <div className="result-phone">
              <label>Phone Number (for SMS)</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09 28886341"
              />
              <button onClick={handleSendCode} className="send-code-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyCode} className="reset-form">
            <p className="info-text">Enter the verification code sent to <strong>{phoneNumber}</strong></p>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => { setStep('search'); setSearchResult(null); }}>
              Cancel
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="reset-form">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => { setStep('search'); setSearchResult(null); }}>
              Cancel
            </button>
          </form>
        )}

        <div className="back-link">
          <a href="/login">← Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default PreLoginReset;