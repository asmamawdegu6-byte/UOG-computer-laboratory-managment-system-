import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="10" width="24" height="18" rx="2" fill="#3949ab"/>
                <rect x="11" y="13" width="18" height="12" fill="#ecf0f1"/>
                <rect x="14" y="16" width="5" height="2" fill="#2ecc71" rx="0.5"/>
                <rect x="14" y="20" width="10" height="1.5" fill="#95a5a6" rx="0.5"/>
                <rect x="15" y="28" width="10" height="3" rx="1" fill="#7f8c8d"/>
              </svg>
            </div>
            <div className="footer-brand-text">
              <h4>UOG Computer Lab</h4>
              <p>University of Gondar</p>
            </div>
          </div>

          <div className="footer-section">
            <h5>Quick Links</h5>
            <ul>
              <li><a href="/student/dashboard">Dashboard</a></li>
              <li><a href="/student/book">Book Workstation</a></li>
              <li><a href="/student/bookings">My Bookings</a></li>
              <li><a href="/student/availability">View Availability</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h5>Support</h5>
            <ul>
              <li><a href="/support">Help Center</a></li>
              <li><a href="/student/report-fault">Report a Fault</a></li>
              <li><a href="/terms">Terms of Use</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h5>Contact Us</h5>
            <ul className="footer-contact">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span>lab@uog.edu.et</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span>+251 581 110 001</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>Gondar, Ethiopia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {currentYear} Computer Lab Management System. All rights reserved.</p>
          </div>
          <div className="footer-version">
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;