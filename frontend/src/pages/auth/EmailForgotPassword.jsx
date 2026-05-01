import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import './ForgotPassword.css';

const EmailForgotPassword = () => {
  const [step, setStep] = useState(1);  // 1: enter email, 2: verify code, 3: new password, 4: success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // For development - shows code in console
  const [devCode, setDevCode] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[EmailForgotPassword] Sending code to:', email);
      
      const result = await authService.sendEmailCode(email);
      console.log('[EmailForgotPassword] Result:', result);
      
      if (result.success) {
        // Store code for development testing
        if (result.code) {
          setDevCode(result.code);
          console.log('[EmailForgotPassword] DEV CODE:', result.code);
        }
        setSuccess('Verification code sent to your email');
        setStep(2);
      } else {
        setError(result.message || 'Failed to send code');
      }
    } catch (err) {
      console.error('[EmailForgotPassword] Error:', err);
      setError(err.response?.data?.message || 'An error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.verifyEmailCode(email, code);
      console.log('[EmailForgotPassword] Verify result:', result);
      
      if (result.success) {
        setSuccess('Code verified! Enter new password.');
        setStep(3);
      } else {
        setError(result.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error('[EmailForgotPassword] Verify Error:', err);
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(''); // Clear previous success message to avoid confusion

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
      const result = await authService.resetPasswordByEmail(email, newPassword);
      console.log('[EmailForgotPassword] Reset result:', result);
      
      if (result.success) {
        setSuccess('Password reset successful! You can now login with your new password.');
        setStep(4);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('[EmailForgotPassword] Reset Password Error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Reset Password via Email</h2>
      <p>Enter your email to receive a verification code</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Step 1: Enter email */}
      {step === 1 && (
        <form onSubmit={handleSendCode} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
            />
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
        </form>
      )}

      {/* Step 2: Enter verification code */}
      {step === 2 && (
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
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
            {devCode && (
              <p className="info-text" style={{ fontSize: '12px', marginTop: '5px' }}>
                (Dev only - Code: {devCode})
              </p>
            )}
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

          <button type="button" onClick={() => setStep(1)} className="back-btn">
            ← Back
          </button>
        </form>
      )}

      {/* Step 3: Enter new password */}
      {step === 3 && (
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
            <label htmlFor="confirmPassword">Confirm Password</label>
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

          <button type="button" onClick={() => setStep(2)} className="back-btn">
            ← Back
          </button>
        </form>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
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

export default EmailForgotPassword;
