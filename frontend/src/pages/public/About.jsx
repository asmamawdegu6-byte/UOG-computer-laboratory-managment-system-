import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Navigation Header */}
      <nav className="about-nav">
        <div className="nav-brand">
          <svg className="nav-logo" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="55" fill="none" stroke="#3498db" strokeWidth="2" strokeDasharray="5,3"/>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#2980b9" strokeWidth="1"/>
            <rect x="32" y="28" width="56" height="42" rx="4" fill="#1a237e" stroke="#3949ab" strokeWidth="2"/>
            <rect x="36" y="32" width="48" height="32" fill="#ecf0f1"/>
            <rect x="40" y="36" width="18" height="4" fill="#2ecc71" rx="1"/>
            <rect x="40" y="43" width="28" height="3" fill="#95a5a6" rx="1"/>
            <rect x="40" y="48" width="24" height="3" fill="#95a5a6" rx="1"/>
            <rect x="40" y="53" width="32" height="3" fill="#95a5a6" rx="1"/>
            <rect x="52" y="70" width="16" height="10" fill="#7f8c8d"/>
            <rect x="44" y="80" width="32" height="6" rx="3" fill="#7f8c8d"/>
            <circle cx="18" cy="30" r="5" fill="#e74c3c"/>
            <circle cx="18" cy="60" r="5" fill="#f39c12"/>
            <circle cx="18" cy="90" r="5" fill="#2ecc71"/>
            <circle cx="102" cy="30" r="5" fill="#9b59b6"/>
            <circle cx="102" cy="60" r="5" fill="#1abc9c"/>
            <circle cx="102" cy="90" r="5" fill="#e67e22"/>
            <line x1="23" y1="30" x2="32" y2="35" stroke="#3498db" strokeWidth="1.5"/>
            <line x1="23" y1="60" x2="32" y2="50" stroke="#3498db" strokeWidth="1.5"/>
            <line x1="23" y1="90" x2="32" y2="65" stroke="#3498db" strokeWidth="1.5"/>
            <line x1="88" y1="35" x2="97" y2="30" stroke="#3498db" strokeWidth="1.5"/>
            <line x1="88" y1="50" x2="97" y2="60" stroke="#3498db" strokeWidth="1.5"/>
            <line x1="88" y1="65" x2="97" y2="90" stroke="#3498db" strokeWidth="1.5"/>
            <text x="60" y="102" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1a237e">UOG</text>
          </svg>
          <span className="nav-title">UOG CLM</span>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link active">About</Link>
          <Link to="/login" className="nav-link nav-login-btn">Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About Our System</h1>
          <p>
            The University of Gondar Computer Lab Management System is designed to streamline
            the management and utilization of computer laboratory resources across campus.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="section-container">
          <div className="section-content">
            <h2>Our Mission</h2>
            <p>
              To provide an efficient, user-friendly platform that enables seamless management
              of computer laboratory resources, ensuring optimal utilization and accessibility
              for all members of the University of Gondar community.
            </p>
          </div>
          <div className="section-icon">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="#e3f2fd" stroke="#2196f3" strokeWidth="2"/>
              <path d="M50 20 L50 50 L70 60" stroke="#1a237e" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <circle cx="50" cy="50" r="5" fill="#1a237e"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1a237e" strokeWidth="2" strokeDasharray="5,3"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="about-section alt-bg">
        <div className="section-container reverse">
          <div className="section-icon">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="#2196f3" strokeWidth="2"/>
              <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="#2196f3" strokeWidth="2" transform="rotate(60, 50, 50)"/>
              <ellipse cx="50" cy="50" rx="45" ry="20" fill="none" stroke="#2196f3" strokeWidth="2" transform="rotate(120, 50, 50)"/>
              <circle cx="50" cy="50" r="15" fill="#1a237e"/>
              <circle cx="50" cy="50" r="8" fill="#e3f2fd"/>
            </svg>
          </div>
          <div className="section-content">
            <h2>Our Vision</h2>
            <p>
              To become the leading computer lab management solution in Ethiopian universities,
              setting the standard for resource optimization, user experience, and technological
              innovation in educational institutions.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <h2 className="values-title">Our Core Values</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Innovation</h3>
            <p>Continuously improving our system with cutting-edge technology and user feedback.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Reliability</h3>
            <p>Ensuring consistent uptime and dependable service for all users.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Accessibility</h3>
            <p>Making resources available to all students and faculty members equally.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#8b5cf6" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#8b5cf6" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Security</h3>
            <p>Protecting user data and maintaining the integrity of our systems.</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2 className="team-title">System Roles</h2>
        <p className="team-subtitle">Our system supports multiple user roles to ensure efficient management</p>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-avatar student">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Students</h3>
            <p>Book workstations, view availability, report faults, and download course materials.</p>
          </div>

          <div className="team-card">
            <div className="team-avatar teacher">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="white" strokeWidth="2"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Teachers</h3>
            <p>Reserve labs, upload materials, monitor attendance, and manage schedules.</p>
          </div>

          <div className="team-card">
            <div className="team-avatar technician">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Technicians</h3>
            <p>Manage equipment, handle maintenance tickets, and update repair status.</p>
          </div>

          <div className="team-card">
            <div className="team-avatar admin">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Administrators</h3>
            <p>Manage users, oversee bookings, generate reports, and configure system settings.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="contact-container">
          <h2>Get In Touch</h2>
          <p>Have questions or suggestions? We'd love to hear from you.</p>
          <div className="contact-info">
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#2563eb" strokeWidth="2"/>
                <circle cx="12" cy="10" r="3" stroke="#2563eb" strokeWidth="2"/>
              </svg>
              <span>University of Gondar, Gondar, Ethiopia</span>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#2563eb" strokeWidth="2"/>
                <polyline points="22,6 12,13 2,6" stroke="#2563eb" strokeWidth="2"/>
              </svg>
              <span>clm@uog.edu.et</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <svg className="footer-logo" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="55" fill="none" stroke="#3498db" strokeWidth="2" strokeDasharray="5,3"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="#2980b9" strokeWidth="1"/>
              <rect x="32" y="28" width="56" height="42" rx="4" fill="#1a237e" stroke="#3949ab" strokeWidth="2"/>
              <rect x="36" y="32" width="48" height="32" fill="#ecf0f1"/>
              <rect x="52" y="70" width="16" height="10" fill="#7f8c8d"/>
              <rect x="44" y="80" width="32" height="6" rx="3" fill="#7f8c8d"/>
              <text x="60" y="102" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1a237e">UOG</text>
            </svg>
            <span>UOG Computer Lab Management</span>
          </div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/login">Login</Link>
          </div>
          <p className="footer-copyright">University of Gondar - Computer Lab Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
