import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { superadminService } from '../../services/superadminService';
import './SuperAdminResetPassword.css';

const SuperAdminResetPassword = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('search'); // search, verify, reset
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const response = await api.get('/users', { 
        params: { 
          search: searchTerm,
          role: 'student' 
        } 
      });
      
      const users = response.data.users || [];
      if (users.length === 0) {
        setMessage({ type: 'error', text: 'No user found with this information' });
      } else {
        setSearchResult(users[0]);
        setPhoneNumber(users[0].phone || '');
        setMessage({ type: '', text: '' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to search user' });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectReset = async () => {
    if (!phoneNumber) {
      setMessage({ type: 'error', text: 'Please enter phone number' });
      return;
    }

    const newPass = Math.random().toString(36).slice(-8);

    try {
      setLoading(true);
      await superadminService.resetPasswordByPhone(phoneNumber, newPass);
      setNewPassword(newPass);
      setConfirmPassword(newPass);
      setStep('reset');
      setMessage({ type: 'success', text: `Password reset directly! New password has been generated and set. Please share with the user.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset password directly' });
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
      
      setMessage({ type: 'success', text: 'Password reset successfully!' });
      setTimeout(() => {
        setSearchTerm('');
        setSearchResult(null);
        setPhoneNumber('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
        setStep('search');
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setSearchResult(null);
    setPhoneNumber('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setStep('search');
    setMessage({ type: '', text: '' });
  };

  return (
    <DashboardLayout>
      <div className="superadmin-reset-password">
        <div className="page-header">
          <h1>Reset User Password</h1>
          <p>Search user by email, username, or student ID, then send verification code to phone</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {step === 'search' && (
          <Card title="Search User" className="search-card">
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-group">
                <label>Search by Email, Username, or Student ID</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter email, username, or student ID"
                />
              </div>
              <Button type="submit" loading={loading}>Search</Button>
            </form>

            {searchResult && (
              <div className="search-result">
                <div className="result-info">
                  <h3>{searchResult.firstName} {searchResult.lastName}</h3>
                  <p>Email: {searchResult.email}</p>
                  <p>Role: {searchResult.role}</p>
                  {searchResult.studentId && <p>Student ID: {searchResult.studentId}</p>}
                </div>
                <div className="result-phone">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09 28886341"
                  />
                  <div className="button-group">
                    <Button onClick={handleSendCode} loading={loading} variant="primary" className="send-code-btn">
                      Send Verification Code
                    </Button>
                    <Button onClick={handleDirectReset} loading={loading} variant="danger" className="direct-reset-btn">
                      Direct Reset (No Verification)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {step === 'verify' && (
          <Card title="Verify Phone Number" className="verify-card">
            <p className="info-text">Enter the verification code sent to {phoneNumber}</p>
            <form onSubmit={handleVerifyCode} className="verify-form">
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
              <Button type="submit" loading={loading}>Verify Code</Button>
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            </form>
          </Card>
        )}

        {step === 'reset' && (
          <Card title="Reset Password" className="reset-card">
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
              <Button type="submit" loading={loading}>Reset Password</Button>
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            </form>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminResetPassword;