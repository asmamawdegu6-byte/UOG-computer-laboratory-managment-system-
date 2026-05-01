import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import uogLogo from '../../assets/UOG LOGO.png';
import './PublicLayout.css';

const PublicLayout = () => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="public-layout">
            <nav className="main-nav">
                <Link to="/" className="nav-brand">
                    <img src={uogLogo} alt="University of Gondar Logo" className="nav-logo" />
                    <div className="nav-brand-text">
                        <span className="nav-title">University of Gondar</span>
                        <span className="nav-subtitle">Computer Lab Management</span>
                    </div>
                </Link>

                <button className="nav-mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
                    <span className="nav-hamburger-line"></span>
                    <span className="nav-hamburger-line"></span>
                    <span className="nav-hamburger-line"></span>
                </button>

                <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
                    <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeMobileMenu}>Home</Link>
                    <Link to="/services" className={`nav-link ${isActive('/services')}`} onClick={closeMobileMenu}>Services</Link>
                    <Link to="/about" className={`nav-link ${isActive('/about')}`} onClick={closeMobileMenu}>About</Link>
                    <Link to="/contact" className={`nav-link ${isActive('/contact')}`} onClick={closeMobileMenu}>Contact</Link>
                    <Link to="/campuses" className={`nav-link ${isActive('/campuses')}`} onClick={closeMobileMenu}>Campuses</Link>
                    <Link to="/login" className={`nav-link ${isActive('/login')}`} onClick={closeMobileMenu}>Login (SuperAdmin)</Link>
                </div>
            </nav>
            <main className="public-main-content">
                <Outlet />
            </main>
            <footer className="public-footer">
                <p>&copy; {new Date().getFullYear()} University of Gondar. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default PublicLayout;
