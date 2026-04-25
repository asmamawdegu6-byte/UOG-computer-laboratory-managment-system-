import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout = () => {
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register';

  return (
    <div className="auth-layout">
      <div className={`auth-container ${isRegisterPage ? 'register-fullscreen' : ''}`}>
        <div className="auth-branding">
          <div className="auth-logo-container">
            <svg className="auth-logo-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              {/* Outer Ring - Lab Network */}
              <circle cx="60" cy="60" r="55" fill="none" stroke="#3498db" strokeWidth="2" strokeDasharray="5,3" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#2980b9" strokeWidth="1" />

              {/* Central Computer Monitor */}
              <rect x="32" y="28" width="56" height="42" rx="4" fill="#1a237e" stroke="#3949ab" strokeWidth="2" />
              <rect x="36" y="32" width="48" height="32" fill="#ecf0f1" />

              {/* Screen Content - System Structure */}
              <rect x="40" y="36" width="18" height="4" fill="#2ecc71" rx="1" />
              <rect x="40" y="43" width="28" height="3" fill="#95a5a6" rx="1" />
              <rect x="40" y="48" width="24" height="3" fill="#95a5a6" rx="1" />
              <rect x="40" y="53" width="32" height="3" fill="#95a5a6" rx="1" />

              {/* Monitor Stand */}
              <rect x="52" y="70" width="16" height="10" fill="#7f8c8d" />
              <rect x="44" y="80" width="32" height="6" rx="3" fill="#7f8c8d" />

              {/* Network Nodes - Representing Lab Structure */}
              <circle cx="18" cy="30" r="5" fill="#e74c3c" />
              <circle cx="18" cy="60" r="5" fill="#f39c12" />
              <circle cx="18" cy="90" r="5" fill="#2ecc71" />
              <circle cx="102" cy="30" r="5" fill="#9b59b6" />
              <circle cx="102" cy="60" r="5" fill="#1abc9c" />
              <circle cx="102" cy="90" r="5" fill="#e67e22" />

              {/* Connection Lines */}
              <line x1="23" y1="30" x2="32" y2="35" stroke="#3498db" strokeWidth="1.5" />
              <line x1="23" y1="60" x2="32" y2="50" stroke="#3498db" strokeWidth="1.5" />
              <line x1="23" y1="90" x2="32" y2="65" stroke="#3498db" strokeWidth="1.5" />
              <line x1="88" y1="35" x2="97" y2="30" stroke="#3498db" strokeWidth="1.5" />
              <line x1="88" y1="50" x2="97" y2="60" stroke="#3498db" strokeWidth="1.5" />
              <line x1="88" y1="65" x2="97" y2="90" stroke="#3498db" strokeWidth="1.5" />

              {/* UOG Text */}
              <text x="60" y="102" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1a237e">UOG</text>
            </svg>
          </div>
          <h1>UOG Computer Lab Management</h1>
          <p>University of Gondar</p>
          <span className="auth-tagline">Efficient Laboratory Resource Management</span>
        </div>
        <div className="auth-form-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
