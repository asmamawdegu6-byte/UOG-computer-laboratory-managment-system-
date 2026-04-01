import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../ui/NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(null);

  const handleLogout = () => {
    setShowAlert({
      type: 'warning',
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: () => {
        logout();
        navigate('/login');
      }
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <div className="logo-container">
            <svg className="navbar-logo-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              {/* Computer Monitor */}
              <rect x="8" y="12" width="48" height="32" rx="3" fill="#3498db" stroke="#2980b9" strokeWidth="2"/>
              <rect x="12" y="16" width="40" height="24" fill="#ecf0f1"/>
              {/* Screen Content - Code/Structure */}
              <rect x="15" y="20" width="14" height="3" fill="#2ecc71" rx="1"/>
              <rect x="15" y="26" width="22" height="2" fill="#95a5a6" rx="1"/>
              <rect x="15" y="30" width="18" height="2" fill="#95a5a6" rx="1"/>
              <rect x="15" y="34" width="26" height="2" fill="#95a5a6" rx="1"/>
              {/* Monitor Stand */}
              <rect x="26" y="44" width="12" height="6" fill="#7f8c8d"/>
              <rect x="20" y="50" width="24" height="4" rx="2" fill="#7f8c8d"/>
              {/* Network/Connection Dots */}
              <circle cx="52" cy="8" r="3" fill="#e74c3c"/>
              <circle cx="56" cy="14" r="2.5" fill="#f39c12"/>
              <circle cx="50" cy="16" r="2" fill="#2ecc71"/>
              {/* Connection Lines */}
              <line x1="52" y1="11" x2="52" y2="14" stroke="#bdc3c7" strokeWidth="1"/>
              <line x1="50" y1="12" x2="50" y2="16" stroke="#bdc3c7" strokeWidth="1"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-title">UOG-CLMS</span>
            <span className="logo-subtitle">Computer Lab Management</span>
          </div>
        </Link>
      </div>
      <div className="navbar-menu">
        {user ? (
          <>
            <NotificationBell />

            {/* Profile Link */}
            <Link to="/profile" className="navbar-profile-link">
              <div className="navbar-avatar">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="navbar-user">Welcome, {user.name}</span>
            </Link>

            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="navbar-login">Login</Link>
        )}
      </div>

      {/* Alert Popup */}
      {showAlert && (
        <div className="alert-overlay" onClick={() => setShowAlert(null)}>
          <div className={`alert-popup ${showAlert.type}`} onClick={e => e.stopPropagation()}>
            <div className="alert-popup-icon">
              {showAlert.type === 'success' && '✓'}
              {showAlert.type === 'error' && '✕'}
              {showAlert.type === 'warning' && '⚠'}
              {showAlert.type === 'info' && 'ℹ'}
            </div>
            <h3>{showAlert.title}</h3>
            <p>{showAlert.message}</p>
            <div className="alert-popup-buttons">
              <button 
                className="alert-btn-secondary"
                onClick={() => setShowAlert(null)}
              >
                Cancel
              </button>
              <button 
                className="alert-btn-primary"
                onClick={() => {
                  showAlert.onConfirm?.();
                  setShowAlert(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
