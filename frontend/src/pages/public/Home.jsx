import React from 'react';
import { Link } from 'react-router-dom';
import uogLogo from '../../assets/UOG LOGO.png';
import './Home.css';

// Unsplash images for university/computer lab context
const HERO_BG = 'https://images.unsplash.com/photo-1562774053-701939374585?w=1920&auto=format&fit=crop&q=80';
const LAB_IMAGE = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80';
const STUDENTS_IMAGE = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80';
const EQUIPMENT_IMAGE = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80';

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section with Full-Screen Background */}
      <section className="hero-section" style={{ backgroundImage: `url(${HERO_BG})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to
            <span className="hero-highlight">Computer laboratory managment system for uog</span>
          </h1>
          <p className="hero-description">
            Streamline your computer laboratory operations with our comprehensive management system.
            Book workstations, manage resources, and enhance the learning experience for students and faculty.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn-hero-primary">Get Started</Link>
            <Link to="/about" className="btn-hero-secondary">Learn More</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-graphic">
            <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              {/* Background Elements */}
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a237e" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#3949ab" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <rect x="20" y="20" width="360" height="260" rx="20" fill="url(#grad1)" />

              {/* Main Computer */}
              <rect x="120" y="60" width="160" height="100" rx="8" fill="#1a237e" />
              <rect x="128" y="68" width="144" height="80" rx="4" fill="#e3f2fd" />
              <rect x="136" y="76" width="50" height="12" fill="#2196f3" rx="2" />
              <rect x="136" y="94" width="80" height="8" fill="#90a4ae" rx="1" />
              <rect x="136" y="108" width="60" height="8" fill="#90a4ae" rx="1" />
              <rect x="136" y="122" width="70" height="8" fill="#90a4ae" rx="1" />
              <rect x="180" y="160" width="40" height="20" fill="#546e7a" />
              <rect x="160" y="180" width="80" height="12" rx="6" fill="#78909c" />

              {/* Left Workstation */}
              <rect x="30" y="120" width="70" height="50" rx="4" fill="#1a237e" />
              <rect x="35" y="125" width="60" height="35" rx="2" fill="#e8f5e9" />
              <rect x="40" y="130" width="25" height="8" fill="#4caf50" rx="1" />
              <rect x="40" y="142" width="40" height="6" fill="#90a4ae" rx="1" />
              <rect x="55" y="170" width="10" height="10" fill="#546e7a" />
              <rect x="45" y="180" width="30" height="8" rx="4" fill="#78909c" />

              {/* Right Workstation */}
              <rect x="300" y="120" width="70" height="50" rx="4" fill="#1a237e" />
              <rect x="305" y="125" width="60" height="35" rx="2" fill="#fff3e0" />
              <rect x="310" y="130" width="25" height="8" fill="#ff9800" rx="1" />
              <rect x="310" y="142" width="40" height="6" fill="#90a4ae" rx="1" />
              <rect x="325" y="170" width="10" height="10" fill="#546e7a" />
              <rect x="315" y="180" width="30" height="8" rx="4" fill="#78909c" />

              {/* Network Connections */}
              <line x1="100" y1="145" x2="120" y2="110" stroke="#2196f3" strokeWidth="2" strokeDasharray="4,2" />
              <line x1="300" y1="145" x2="280" y2="110" stroke="#2196f3" strokeWidth="2" strokeDasharray="4,2" />

              {/* Floating Elements */}
              <circle cx="60" cy="50" r="15" fill="#e3f2fd" opacity="0.8" />
              <circle cx="340" cy="60" r="12" fill="#e8f5e9" opacity="0.8" />
              <circle cx="350" cy="240" r="18" fill="#fff3e0" opacity="0.8" />
              <circle cx="50" cy="250" r="10" fill="#fce4ec" opacity="0.8" />

              {/* People Icons */}
              <circle cx="70" cy="220" r="8" fill="#3f51b5" />
              <rect x="62" y="230" width="16" height="20" rx="4" fill="#3f51b5" />
              <circle cx="200" cy="230" r="8" fill="#009688" />
              <rect x="192" y="240" width="16" height="20" rx="4" fill="#009688" />
              <circle cx="330" cy="220" r="8" fill="#ff5722" />
              <rect x="322" y="230" width="16" height="20" rx="4" fill="#ff5722" />
            </svg>
          </div>
        </div>
      </section>

      {/* Lab Image Showcase */}
      <section className="lab-showcase">
        <div className="showcase-grid">
          <div className="showcase-card main-showcase">
            <img src={LAB_IMAGE} alt="Computer Lab" />
            <div className="showcase-overlay">
              <span className="showcase-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <h3>Modern Computer Labs</h3>
              <p>State-of-the-art facilities with latest equipment</p>
            </div>
          </div>
          <div className="showcase-card">
            <img src={STUDENTS_IMAGE} alt="Students" />
            <div className="showcase-overlay">
              <h3>Active Learning</h3>
              <p>Students engaged in practical computing</p>
            </div>
          </div>
          <div className="showcase-card">
            <img src={EQUIPMENT_IMAGE} alt="Equipment" />
            <div className="showcase-overlay">
              <h3>Quality Equipment</h3>
              <p>High-performance workstations and peripherals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#2563eb" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="#2563eb" strokeWidth="2" />
                <rect x="7" y="14" width="4" height="4" rx="1" fill="#2563eb" />
              </svg>
            </div>
            <h3>Easy Booking</h3>
            <p>Reserve workstations and lab spaces with just a few clicks. View real-time availability and book instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="2" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Role-Based Access</h3>
            <p>Different access levels for students, teachers, technicians, and administrators to manage resources effectively.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Real-Time Monitoring</h3>
            <p>Track equipment status, monitor lab usage, and receive instant notifications about system updates.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14,2 14,8 20,8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                <polyline points="10,9 9,9 8,9" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Comprehensive Reports</h3>
            <p>Generate detailed reports on lab usage, equipment status, and resource allocation for better planning.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={uogLogo} alt="University of Gondar Logo" className="footer-logo-img" />
            <span>University of Gondar - Computer Lab Management</span>
          </div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/services">Services</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/login">Login</Link>
          </div>
          <p className="footer-copyright">University of Gondar - Computer Lab Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
