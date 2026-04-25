import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../ui/NotificationBell';
import uogLogo from '../../assets/UOG LOGO.png';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAlert, setShowAlert] = useState(null);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    const userRole = user?.role;
    const userCampusCode = user?.campusCode;
    setShowAlert({
      type: 'warning',
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: () => {
        logout();
        if (userRole === 'superadmin') {
          navigate('/login', { replace: true });
        } else if (userCampusCode) {
          navigate(`/campus/${userCampusCode}/login`, { replace: true });
        } else if (userCampus) {
          navigate(`/campuses`, { replace: true });
        } else {
          navigate('/campuses', { replace: true });
        }
      }
    });
  };

  // Navigation items for unauthenticated users - no repetition
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
    { path: '/campuses', label: 'Campuses' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <div className="logo-container">
            <img src={uogLogo} alt="University of Gondar Logo" className="navbar-logo-img" />
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
          <>
            {/* Public Navigation Links - displayed only once */}
            {navItems.map((item) => (
              <Link 
                to={item.path} 
                key={item.path}
                className={`navbar-nav-link ${isActive(item.path)}`}
              >
                {item.label}
              </Link>
            ))}
            {/* Login Link */}
            <Link to="/login" className="navbar-login">Login</Link>
          </>
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
