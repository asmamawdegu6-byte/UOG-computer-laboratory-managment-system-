import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill username if redirected from registration with existing account
  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({
        ...prev,
        username: location.state.email
      }));

      // Check if this is a successful registration redirect
      if (location.state?.registrationSuccess) {
        setSuccessMessage('Registration submitted! Your account is pending admin approval. You will be able to login once approved.');
      } else {
        setInfoMessage('This email is already registered. Please login with your password.');
      }
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate(`/${result.user.role}/dashboard`);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Welcome Back</h2>
      <p>Please sign in to continue</p>

      <div className="login-image">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="8" width="48" height="32" rx="3" fill="#1e293b" />
          <rect x="11" y="11" width="42" height="26" rx="1" fill="#3b82f6" />
          <rect x="14" y="14" width="36" height="20" rx="1" fill="#dbeafe" />
          <rect x="16" y="16" width="14" height="8" rx="1" fill="#93c5fd" />
          <rect x="32" y="16" width="16" height="3" rx="1" fill="#60a5fa" />
          <rect x="32" y="21" width="12" height="3" rx="1" fill="#60a5fa" />
          <rect x="32" y="26" width="8" height="3" rx="1" fill="#60a5fa" />
          <rect x="24" y="40" width="16" height="4" fill="#475569" />
          <rect x="18" y="44" width="28" height="4" rx="2" fill="#64748b" />
          <circle cx="32" cy="42" r="1.5" fill="#94a3b8" />
        </svg>
      </div>

      {error && <div className="error-message">{error}</div>}
      {infoMessage && <div className="info-message">{infoMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter your username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
          />
        </div>

        <div className="form-options">
          <label className="remember-me">
            <input type="checkbox" /> Remember me
          </label>
          <Link to="/forgot-password" className="forgot-password">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="large"
          loading={loading}
          className="login-btn"
        >
          Sign In
        </Button>
      </form>

      <div className="register-link">
        <p>Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
};

export default Login;