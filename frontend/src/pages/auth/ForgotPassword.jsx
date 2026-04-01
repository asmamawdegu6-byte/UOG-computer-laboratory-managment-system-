import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);
      if (result.success) {
        setSuccess('Password reset instructions have been sent to your email.');
      } else {
        setError(result.message || 'Failed to send reset instructions');
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
      <p>Enter your email address and we'll send you instructions to reset your password.</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="forgot-password-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading}
          className="reset-btn"
        >
          Send Reset Instructions
        </Button>
      </form>

      <div className="back-to-login">
        <Link to="/login">← Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;