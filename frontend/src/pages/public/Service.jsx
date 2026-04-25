import React from 'react';
import { Link } from 'react-router-dom';
import uogLogo from '../../assets/UOG LOGO.png';
import './Service.css';

// Unsplash images for Service page
const SERVICE_HERO = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&auto=format&fit=crop&q=80';

const Service = () => {
    const services = [
        {
            id: 1,
            title: 'Workstation Booking',
            description: 'Reserve computer workstations in advance with our easy-to-use booking system. View real-time availability and book instantly.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="3" width="20" height="14" rx="2" stroke="#2563eb" strokeWidth="2" />
                    <path d="M8 21h8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 17v4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 2,
            title: 'Lab Management',
            description: 'Comprehensive management of computer labs including equipment tracking, maintenance scheduling, and resource allocation.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v6m0 0H3m6 0h12M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9m-18 0h18" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 3,
            title: 'Equipment Monitoring',
            description: 'Real-time monitoring of computer equipment status, performance metrics, and automated alerts for maintenance needs.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 4,
            title: 'Fault Reporting',
            description: 'Quick and efficient fault reporting system for students and staff to report equipment issues and track repair status.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="9" x2="12" y2="13" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 5,
            title: 'Resource Scheduling',
            description: 'Efficient scheduling of lab resources, time slots, and equipment to maximize utilization and minimize conflicts.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#2563eb" strokeWidth="2" />
                    <line x1="16" y1="2" x2="16" y2="6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="8" y2="6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="10" x2="21" y2="10" stroke="#2563eb" strokeWidth="2" />
                </svg>
            ),
            image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=60'
        },
        {
            id: 6,
            title: 'User Management',
            description: 'Role-based access control for students, teachers, technicians, and administrators with customizable permissions.',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="2" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ),
            image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60'
        }
    ];

    return (
        <div className="service-page">
            {/* Hero Section */}
            <section className="service-hero" style={{ backgroundImage: `url(${SERVICE_HERO})` }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">Our Services</h1>
                    <p className="hero-description">
                        Comprehensive computer lab management solutions designed to enhance learning and streamline operations
                    </p>
                </div>
            </section>

            {/* Services Grid Section */}
            <section className="services-section">
                <div className="services-container">
                    <h2 className="section-title">What We Offer</h2>
                    <p className="section-subtitle">
                        Discover our range of services designed to meet the needs of students, faculty, and administrators
                    </p>

                    <div className="services-grid">
                        {services.map((service) => (
                            <div key={service.id} className="service-card">
                                <div className="service-image-container">
                                    <img src={service.image} alt={service.title} className="service-image" />
                                    <div className="service-image-overlay"></div>
                                </div>
                                <div className="service-content">
                                    <div className="service-icon">
                                        {service.icon}
                                    </div>
                                    <h3 className="service-title">{service.title}</h3>
                                    <p className="service-description">{service.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="features-container">
                    <h2 className="section-title">Why Choose Us</h2>
                    <div className="features-grid">
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="22 4 12 14.01 9 11.01" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Reliable</h3>
                            <p>99% uptime with robust infrastructure and continuous monitoring</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2" />
                                    <polyline points="12 6 12 12 16 14" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Efficient</h3>
                            <p>Streamlined processes that save time and reduce administrative burden</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Secure</h3>
                            <p>Enterprise-grade security with role-based access control</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="2" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h3>User-Friendly</h3>
                            <p>Intuitive interface designed for all user levels</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Get Started?</h2>
                    <p>Join thousands of students and faculty using our platform</p>
                    <div className="cta-buttons">
                        <Link to="/register" className="btn-cta-primary">Sign Up Now</Link>
                        <Link to="/contact" className="btn-cta-secondary">Contact Us</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Service;
