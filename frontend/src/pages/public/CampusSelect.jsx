import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/hero.png';
import uogLogo from '../../assets/UOG LOGO.png';
import { defaultCampuses } from '../../contexts/CampusContext';
import './Home.css';

const CampusSelect = () => {
    const getCampusIcon = (index) => {
        const icons = ['🏛️', '👑', '🏰', '🏥'];
        return icons[index] || '🏢';
    };

    return (
        <div className="home-page">
            {/* Navigation */}
            <nav className="home-nav">
                <div className="nav-brand">
                    <img src={uogLogo} alt="University of Gondar Logo" className="nav-logo" />
                    <div className="nav-brand-text">
                        <span className="nav-title">University of Gondar</span>
                        <span className="nav-subtitle">Computer Lab Management</span>
                    </div>
                </div>
                <div className="nav-links">
                    <Link to="/" className="nav-link active">Home</Link>
                    <Link to="/about" className="nav-link">About</Link>
                    <Link to="/contact" className="nav-link">Contact</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section" style={{ backgroundImage: `url(${heroImage})` }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">
                        Select Your Campus
                        <span className="hero-highlight">Computer Lab Management</span>
                    </h1>
                    <p className="hero-description">
                        Choose your campus to access computer lab services.
                        Each campus has its own dedicated system for booking workstations and managing resources.
                    </p>
                </div>
            </section>

            {/* Campus Selection Section */}
            <section className="campus-section">
                <h2 className="campus-section-title">University Campuses</h2>
                <p className="campus-section-subtitle">Select your campus to continue</p>
                <div className="campus-grid">
                    {defaultCampuses.map((campus, index) => (
                        <Link
                            key={campus._id}
                            to={`/campus/${campus.code}`}
                            className="campus-card"
                        >
                            <div className="campus-icon">
                                {getCampusIcon(index)}
                            </div>
                            <h3>{campus.name}</h3>
                            <p>{campus.description}</p>
                            <span className="campus-select-btn">Select Campus →</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Info Section */}
            <section className="features-section">
                <h2 className="section-title">How It Works</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                <polyline points="9 22 9 12 15 12 15 22" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>1. Select Campus</h3>
                        <p>Choose your campus from the list above to access its dedicated system.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#2563eb" strokeWidth="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#2563eb" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3>2. Login</h3>
                        <p>Use your campus-specific username and password to sign in.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#2563eb" strokeWidth="2" />
                                <line x1="16" y1="2" x2="16" y2="6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                <line x1="8" y1="2" x2="8" y2="6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                <line x1="3" y1="10" x2="21" y2="10" stroke="#2563eb" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3>3. Book Workstation</h3>
                        <p>View availability and book computer workstations at your campus.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                <polyline points="22 4 12 14.01 9 11.01" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>4. Manage Resources</h3>
                        <p>Access materials, report faults, and manage your bookings.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <svg className="footer-logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 5 L185 45 L185 130 Q185 170 100 195 Q15 170 15 130 L15 45 Z" fill="#1e3a8a" stroke="#fbbf24" strokeWidth="4" />
                            <path d="M100 20 L170 52 L170 125 Q170 158 100 180 Q30 158 30 125 L30 52 Z" fill="#1e40af" />
                            <rect x="92" y="20" width="16" height="160" fill="#fbbf24" />
                            <rect x="30" y="92" width="140" height="16" fill="#fbbf24" />
                        </svg>
                        <span>University of Gondar - Computer Lab Management</span>
                    </div>
                    <div className="footer-links">
                        <Link to="/">Home</Link>
                        <Link to="/about">About</Link>
                        <Link to="/contact">Contact</Link>
                    </div>
                    <p className="footer-copyright">University of Gondar - Computer Lab Management System</p>
                </div>
            </footer>
        </div>
    );
};

export default CampusSelect;