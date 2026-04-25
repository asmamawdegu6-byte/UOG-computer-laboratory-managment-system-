import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import uogLogo from '../../assets/UOG LOGO.png';
import './PublicLayout.css';

const PublicLayout = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

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
                <div className="nav-links">
                    <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                    <Link to="/services" className={`nav-link ${isActive('/services')}`}>Services</Link>
                    <Link to="/about" className={`nav-link ${isActive('/about')}`}>About</Link>
                    <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>Contact</Link>
                    <Link to="/campuses" className={`nav-link ${isActive('/campuses')}`}>Campuses</Link>
                    <Link to="/login" className={`nav-link ${isActive('/login')}`}>Login (SuperAdmin)</Link>
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