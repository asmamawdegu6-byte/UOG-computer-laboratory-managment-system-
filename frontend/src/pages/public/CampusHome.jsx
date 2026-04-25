import React from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import './Home.css';

const CampusHome = () => {
    const { campusCode } = useParams();
    const { campus } = useOutletContext();
    
    // Get campus-specific images
    const campusImage = campus?.image;

    return (
        <div className="home-page">
            {/* Hero Section with campus-specific background */}
            <section className="hero-section" style={{ backgroundImage: campusImage ? `url(${campusImage.hero})` : undefined }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">
                        {campus.name}
                        <span className="hero-highlight">Computer Lab Management</span>
                    </h1>
                    <p className="hero-description">
                        Access computer lab resources at {campus.name}.
                        Book workstations, manage resources, and enhance your learning experience.
                    </p>
                    <div className="hero-buttons">
                        <Link to={`/campus/${campusCode}/login`} className="btn-hero-primary">Get Started</Link>
                        <Link to={`/campus/${campusCode}/about`} className="btn-hero-secondary">Learn More</Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-graphic">
                        <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#1a237e" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="#3949ab" stopOpacity="0.2" />
                                </linearGradient>
                            </defs>
                            <rect x="20" y="20" width="360" height="260" rx="20" fill="url(#grad1)" />
                            <rect x="120" y="60" width="160" height="100" rx="8" fill="#1a237e" />
                            <rect x="128" y="68" width="144" height="80" rx="4" fill="#e3f2fd" />
                            <rect x="136" y="76" width="50" height="12" fill="#2196f3" rx="2" />
                            <rect x="136" y="94" width="80" height="8" fill="#90a4ae" rx="1" />
                            <rect x="136" y="108" width="60" height="8" fill="#90a4ae" rx="1" />
                            <rect x="180" y="160" width="40" height="20" fill="#546e7a" />
                            <rect x="160" y="180" width="80" height="12" rx="6" fill="#78909c" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Lab Image Showcase */}
            {campusImage && (
                <section className="lab-showcase">
                    <div className="showcase-grid">
                        <div className="showcase-card main-showcase">
                            <img src={campusImage.labImage} alt="Computer Lab" />
                            <div className="showcase-overlay">
                                <span className="showcase-icon">{campusImage.icon}</span>
                                <h3>Modern Computer Labs</h3>
                                <p>State-of-the-art facilities with latest equipment</p>
                            </div>
                        </div>
                        <div className="showcase-card">
                            <img src={campusImage.studentsImage} alt="Students" />
                            <div className="showcase-overlay">
                                <h3>Active Learning</h3>
                                <p>Students engaged in practical computing</p>
                            </div>
                        </div>
                        <div className="showcase-card">
                            <img src={campusImage.equipmentImage} alt="Equipment" />
                            <div className="showcase-overlay">
                                <h3>Quality Equipment</h3>
                                <p>High-performance workstations and peripherals</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Quick Links Section */}
            <section className="features-section">
                <h2 className="section-title">Quick Access</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#2563eb" strokeWidth="2" />
                                <line x1="16" y1="2" x2="16" y2="6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                <line x1="8" y1="2" x2="8" y2="6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                <line x1="3" y1="10" x2="21" y2="10" stroke="#2563eb" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3>Book Workstation</h3>
                        <p>Reserve your preferred workstation in {campus.name} labs.</p>
                        <Link to={`/campus/${campusCode}/login`} className="campus-link primary" style={{ marginTop: '1rem' }}>Login to Book</Link>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="2" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Student Access</h3>
                        <p>Students can view availability and manage their bookings.</p>
                        <Link to={`/campus/${campusCode}/login`} className="campus-link primary" style={{ marginTop: '1rem' }}>Student Login</Link>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Real-Time Status</h3>
                        <p>Check lab availability and workstation status in real-time.</p>
                        <Link to={`/campus/${campusCode}/services`} className="campus-link secondary" style={{ marginTop: '1rem' }}>View Status</Link>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#2563eb" strokeWidth="2" />
                                <polyline points="14,2 14,8 20,8" stroke="#2563eb" strokeWidth="2" />
                            </svg>
                        </div>
                        <h3>Reports</h3>
                        <p>Access detailed reports on lab usage and resources.</p>
                        <Link to={`/campus/${campusCode}/about`} className="campus-link secondary" style={{ marginTop: '1rem' }}>Learn More</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CampusHome;