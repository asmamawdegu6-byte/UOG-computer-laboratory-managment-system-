import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFindUser = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.findUserForReset(username);
      if (result.success) {
        setPhone(result.phone || '');
        setStep(2);
      } else {
        setError(result.message || 'User not found');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await authService.sendResetCode(phone);
      if (result.success) {
        setSuccess('Verification code sent to your phone');
        setStep(3);
      } else {
        setError(result.message || 'Failed to send code');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.verifyResetCode(phone, code);
      if (result.success) {
        setStep(4);
      } else {
        setError(result.message || 'Invalid verification code');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.resetPasswordByPhone(phone, newPassword);
      if (result.success) {
        setSuccess('Password reset successful! You can now login with your new password.');
        setStep(5);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Reset Password</h2>
      <p>Reset your password via SMS verification</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {step === 1 && (
        <form onSubmit={handleFindUser} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="reset-btn"
          >
            Continue
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSendCode} className="forgot-password-form">
          <div className="form-group">
            <label>Phone Number</label>
            <p className="phone-info">Verification code will be sent to: {phone}</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="reset-btn"
          >
            Send Verification Code
          </Button>

          <button type="button" onClick={() => setStep(1)} className="back-btn">
            ← Back
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleVerifyCode} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="Enter the code sent to your phone"
              maxLength={6}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="reset-btn"
          >
            Verify Code
          </Button>

          <button type="button" onClick={handleSendCode} className="resend-btn">
            Resend Code
          </button>

          <button type="button" onClick={() => setStep(2)} className="back-btn">
            ← Back
          </button>
        </form>
      )}

      {step === 4 && (
        <form onSubmit={handleResetPassword} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            className="reset-btn"
          >
            Reset Password
          </Button>

          <button type="button" onClick={() => setStep(3)} className="back-btn">
            ← Back
          </button>
        </form>
      )}

      {step === 5 && (
        <div className="success-section">
          <div className="success-icon">✓</div>
          <p>Password reset successful!</p>
          <Link to="/login" className="btn-primary">
            Go to Login
          </Link>
        </div>
      )}

      <div className="back-to-login">
        <Link to="/login">← Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;