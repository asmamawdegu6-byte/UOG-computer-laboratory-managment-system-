import React, { useEffect } from 'react';
import { Link, Outlet, useParams, Navigate, useLocation } from 'react-router-dom';
import uogLogo from '../../assets/UOG LOGO.png';
import { useCampus } from '../../contexts/CampusContext';
import './CampusLayout.css';

const CampusLayout = () => {
    const { campusCode } = useParams();
    const { selectCampus, selectedCampus, campuses } = useCampus();
    const location = useLocation();

    // Find campus by code
    const campus = campuses.find(c => c.code.toLowerCase() === campusCode?.toLowerCase());

    useEffect(() => {
        if (campus && (!selectedCampus || selectedCampus.code !== campus.code)) {
            selectCampus(campus);
        }
    }, [campus, selectedCampus, selectCampus]);

    if (!campus) {
        return <Navigate to="/campuses" replace />;
    }

    const isActive = (path) => location.pathname === path ? 'active' : '';
    
    // Get campus image
    const campusImage = campus?.image || null;

    const currentYear = new Date().getFullYear();

    return (
        <div className="campus-portal-layout">
            {/* Campus Hero Banner */}
            {campusImage && location.pathname === `/campus/${campusCode}` && (
                <div className="campus-hero-banner" style={{ backgroundImage: `url(${campusImage.hero})` }}>
                    <div className="campus-hero-overlay"></div>
                    <div className="campus-hero-content">
                        <span className="campus-hero-icon">{campusImage.icon}</span>
                        <h1 className="campus-hero-title">{campus.name}</h1>
                        <p className="campus-hero-tagline">Welcome to the Computer Lab Management Portal</p>
                    </div>
                </div>
            )}
            <nav className="campus-nav">
                <Link to={`/campus/${campusCode}`} className="campus-nav-brand">
                    <img src={uogLogo} alt="University of Gondar Logo" className="campus-nav-logo" />
                    <div className="campus-nav-text">
                        <span className="campus-nav-title">University of Gondar</span>
                        <span className="campus-nav-campus">{campus.name}</span>
                    </div>
                </Link>
                <div className="campus-nav-links">
                    <Link to={`/campus/${campusCode}`} className={`campus-nav-link ${location.pathname === `/campus/${campusCode}` ? 'active' : ''}`}>Home</Link>
                    <Link to={`/campus/${campusCode}/services`} className={`campus-nav-link ${isActive(`/campus/${campusCode}/services`)}`}>Services</Link>
                    <Link to={`/campus/${campusCode}/about`} className={`campus-nav-link ${isActive(`/campus/${campusCode}/about`)}`}>About</Link>
                    <Link to={`/campus/${campusCode}/contact`} className={`campus-nav-link ${isActive(`/campus/${campusCode}/contact`)}`}>Contact</Link>
                    <Link to={`/campus/${campusCode}/login`} className="campus-nav-btn">Login</Link>
                </div>
            </nav>
            <main className="campus-portal-content">
                <Outlet context={{ campus }} />
            </main>
            <footer className="campus-portal-footer">
                <div className="campus-footer-content">
                    <div className="campus-footer-main">
                        <div className="campus-footer-brand">
                            <div className="campus-footer-logo">
                                <img src={uogLogo} alt="University of Gondar Logo" className="campus-footer-logo-img" />
                            </div>
                            <div className="campus-footer-brand-text">
                                <h4>{campus.name} Computer Lab</h4>
                                <p>University of Gondar</p>
                            </div>
                        </div>

                        <div className="campus-footer-section">
                            <h5>Quick Links</h5>
                            <ul>
                                <li><Link to={`/campus/${campusCode}/login`}>Student Login</Link></li>
                                <li><Link to={`/campus/${campusCode}/services`}>Lab Services</Link></li>
                                <li><Link to={`/campus/${campusCode}/about`}>About the Lab</Link></li>
                                <li><Link to={`/campus/${campusCode}/contact`}>Contact Us</Link></li>
                            </ul>
                        </div>

                        <div className="campus-footer-section">
                            <h5>Support</h5>
                            <ul>
                                <li><Link to={`/campus/${campusCode}/contact`}>Help Center</Link></li>
                                <li><Link to={`/campus/${campusCode}/contact`}>Report a Fault</Link></li>
                                <li><a href="/terms">Terms of Use</a></li>
                                <li><a href="/privacy">Privacy Policy</a></li>
                            </ul>
                        </div>

                        <div className="campus-footer-section">
                            <h5>Contact Us</h5>
                            <ul className="campus-footer-contact">
                                <li>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>lab@{campus.code.toLowerCase()}@uog.edu.et</span>
                                </li>
                                <li>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>+251 581 110 001</span>
                                </li>
                                <li>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Gondar, Ethiopia - {campus.name}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="campus-footer-bottom">
                        <div className="campus-footer-copyright">
                            <p>&copy; {currentYear} {campus.name} Computer Lab Management System. All rights reserved.</p>
                        </div>
                        <div className="campus-footer-version">
                            <span>v1.0.0</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CampusLayout;