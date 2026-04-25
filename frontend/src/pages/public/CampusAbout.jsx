import React from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import uogLogo from '../../assets/UOG LOGO.png';
import './About.css';

const CampusAbout = () => {
    const { campusCode } = useParams();
    const { campus } = useOutletContext();
    
    // Get campus-specific images
    const campusImage = campus?.image;

    // Feature data with images
    const features = [
        {
            icon: '⚡',
            title: 'Fast & Efficient',
            description: 'Quick booking process with instant confirmation',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80'
        },
        {
            icon: '🔒',
            title: 'Secure & Reliable',
            description: 'Secure authentication and data protection',
            image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80'
        },
        {
            icon: '👥',
            title: 'Role-Based Access',
            description: 'Customized access for students, teachers, and admins',
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80'
        }
    ];

    // Key features data with images
    const keyFeatures = [
        {
            icon: '💻',
            title: 'Easy Booking',
            description: 'Reserve workstations with just a few clicks',
            image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80'
        },
        {
            icon: '🏢',
            title: 'Lab Management',
            description: 'Comprehensive lab administration tools',
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80'
        },
        {
            icon: '📚',
            title: 'Resource Sharing',
            description: 'Download materials shared by teachers',
            image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80'
        },
        {
            icon: '🔧',
            title: 'Fault Reporting',
            description: 'Report issues for quick technician response',
            image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80'
        }
    ];

    return (
        <div className="home-page">
            {/* Hero Section with campus-specific background */}
            <section className="about-hero" style={{ backgroundImage: campusImage ? `url(${campusImage.hero})` : undefined }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <span className="hero-badge">{campusImage?.icon} {campus.name}</span>
                    <h1>About {campus.name}</h1>
                    <p>Computer Lab Management System - University of Gondar</p>
                    <div className="hero-actions">
                        <Link to={`/campus/${campusCode}/services`} className="btn-hero-primary">Our Services</Link>
                        <Link to={`/campus/${campusCode}/contact`} className="btn-hero-secondary">Contact Us</Link>
                    </div>
                </div>
            </section>

            {/* Campus Overview with Image */}
            <section className="campus-overview">
                <div className="overview-container">
                    <div className="overview-image">
                        <img src={campusImage?.labImage} alt={campus.name} />
                        <div className="image-accent"></div>
                    </div>
                    <div className="overview-content">
                        <h2>Welcome to {campus.name}</h2>
                        <p>
                            The Computer Lab Management System at {campus.name} provides a comprehensive platform
                            for managing computer laboratory resources. Students, teachers, and administrators can
                            efficiently book workstations, track availability, and manage lab resources.
                        </p>
                        <p>
                            Our system is designed to streamline laboratory operations and enhance the learning
                            experience for all users at {campus.name}. With state-of-the-art facilities and
                            dedicated support, we ensure seamless access to computing resources.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section with Images */}
            <section className="features-image-section">
                <h2 className="section-title">Why Choose Us</h2>
                <div className="features-image-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-image-card">
                            <div className="feature-image-wrapper">
                                <img src={feature.image} alt={feature.title} />
                                <div className="feature-image-overlay"></div>
                            </div>
                            <div className="feature-image-content">
                                <span className="feature-image-icon">{feature.icon}</span>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Key Features Section */}
            <section className="key-features-section">
                <h2 className="section-title">Key Features</h2>
                <div className="key-features-grid">
                    {keyFeatures.map((feature, index) => (
                        <div key={index} className="key-feature-card">
                            <div className="key-feature-image">
                                <img src={feature.image} alt={feature.title} />
                            </div>
                            <div className="key-feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Gallery Section */}
            {campusImage && (
                <section className="gallery-section">
                    <h2 className="section-title">Our Facilities</h2>
                    <div className="gallery-grid">
                        <div className="gallery-item large">
                            <img src={campusImage.gallery[0]} alt="Campus Facility" />
                            <div className="gallery-overlay">
                                <span>Computer Labs</span>
                            </div>
                        </div>
                        <div className="gallery-item">
                            <img src={campusImage.gallery[1]} alt="Campus Facility" />
                            <div className="gallery-overlay">
                                <span>Study Areas</span>
                            </div>
                        </div>
                        <div className="gallery-item">
                            <img src={campusImage.gallery[2]} alt="Campus Facility" />
                            <div className="gallery-overlay">
                                <span>Equipment</span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="about-cta-section">
                <div className="cta-content">
                    <h2>Ready to Get Started?</h2>
                    <p>Join {campus.name} and experience modern computer lab management</p>
                    <div className="cta-buttons">
                        <Link to={`/campus/${campusCode}/login`} className="btn-hero-primary">Login Now</Link>
                        <Link to={`/campus/${campusCode}/contact`} className="btn-hero-secondary">Contact Us</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CampusAbout;