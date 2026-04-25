import React from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import './Service.css';
import './About.css';

// Get campus-specific service focus
const getCampusServiceFocus = (campusCode) => {
    const focusData = {
        MAR: {
            focus: 'Social Science Service',
            icon: '💻',
            highlights: ['Advanced Computing', 'Research Labs', 'Digital Resources']
        },
        ATW: {
            focus: 'Software Development',
            icon: '🎓',
            highlights: ['Digital Literacy', 'Research Support', 'Student Projects']
        },
        ATF: {
            focus: 'Social Science Service',
            icon: '🏛️',
            highlights: ['Community Tech', 'Training Programs', 'Skill Development']
        },
        HSC: {
            focus: 'Healthy Campus',
            icon: '🏥',
            highlights: ['Healthcare Tech', 'Medical Software', 'Research Data']
        }
    };
    return focusData[campusCode] || focusData.MAR;
};

const CampusService = () => {
    const { campusCode } = useParams();
    const { campus } = useOutletContext() || {};
    
    // Get campus-specific images
    const campusImage = campus?.image;
    const campusFocus = getCampusServiceFocus(campusCode);

    // Service data with detailed info
    const services = [
        {
            id: 1,
            icon: '💻',
            title: 'Workstation Booking',
            description: 'Book computer workstations in our labs. View real-time availability and reserve your preferred slot.',
            image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
            features: ['Real-time Availability', 'Flexible Scheduling', 'Instant Confirmation'],
            color: '#2563eb'
        },
        {
            id: 2,
            icon: '🏢',
            title: 'Lab Reservation',
            description: 'Teachers can reserve entire labs for classes, sessions, and group activities.',
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
            features: ['Full Lab Booking', 'Class Management', 'Schedule Integration'],
            color: '#7c3aed'
        },
        {
            id: 3,
            icon: '📊',
            title: 'Real-Time Monitoring',
            description: 'Track equipment status, lab usage, and workstation availability in real-time.',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
            features: ['Live Dashboard', 'Usage Analytics', 'Equipment Status'],
            color: '#059669'
        },
        {
            id: 4,
            icon: '🔧',
            title: 'Fault Reporting',
            description: 'Report technical issues with workstations for quick technician response and resolution.',
            image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&q=80',
            features: ['Quick Reporting', 'Priority Support', 'Track Status'],
            color: '#dc2626'
        },
        {
            id: 5,
            icon: '📱',
            title: 'Attendance Tracking',
            description: 'Track student attendance in labs using QR code scanning and digital check-ins.',
            image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80',
            features: ['QR Code Scanning', 'Auto Reports', 'Export Data'],
            color: '#f59e0b'
        },
        {
            id: 6,
            icon: '📚',
            title: 'Material Downloads',
            description: 'Access and download learning materials, tutorials, and resources uploaded by teachers.',
            image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80',
            features: ['Resource Library', 'Easy Download', 'Organized by Course'],
            color: '#8b5cf6'
        }
    ];

    // Process steps
    const processSteps = [
        { step: 1, title: 'Login', description: 'Sign in to your account', icon: '🔑' },
        { step: 2, title: 'Select Lab', description: 'Choose your preferred lab', icon: '🏢' },
        { step: 3, title: 'Book Slot', description: 'Reserve your workstation', icon: '📅' },
        { step: 4, title: 'Access Lab', description: 'Use your booked workstation', icon: '✅' }
    ];

    return (
        <div className="home-page">
            {/* Hero Section with campus-specific background */}
            <section className="service-hero" style={{ backgroundImage: campusImage ? `url(${campusImage.hero})` : undefined }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <span className="hero-badge">{campusFocus.icon} {campus?.name}</span>
                    <span className="service-focus-tag">{campusFocus.focus}</span>
                    <h1>Our Services</h1>
                    <p>Explore the computer lab management services available at {campus?.name}</p>
                    <div className="hero-actions">
                        <Link to={`/campus/${campusCode}/login`} className="btn-hero-primary">Get Started</Link>
                        <Link to={`/campus/${campusCode}/contact`} className="btn-hero-secondary">Contact Us</Link>
                    </div>
                </div>
            </section>

            {/* Campus Highlights */}
            <section className="campus-highlights">
                <div className="highlights-container">
                    <h2 className="section-title">{campus?.name} Service Highlights</h2>
                    <div className="highlights-grid">
                        {campusFocus.highlights.map((highlight, index) => (
                            <div key={index} className="highlight-card">
                                <span className="highlight-number">{index + 1}</span>
                                <p>{highlight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lab Facilities Showcase */}
            {campusImage && (
                <section className="facilities-showcase">
                    <h2 className="section-title">Our Facilities</h2>
                    <div className="facilities-grid">
                        <div className="facility-card main-facility">
                            <img src={campusImage.labImage} alt="Computer Lab" />
                            <div className="facility-overlay">
                                <div className="facility-info">
                                    <span className="facility-icon">💻</span>
                                    <h3>Computer Labs</h3>
                                    <p>Fully equipped labs with modern workstations</p>
                                    <span className="facility-stat">50+ Workstations</span>
                                </div>
                            </div>
                        </div>
                        <div className="facility-card">
                            <img src={campusImage.studentsImage} alt="Students at Work" />
                            <div className="facility-overlay">
                                <div className="facility-info">
                                    <span className="facility-icon">👥</span>
                                    <h3>Student Access</h3>
                                    <p>Easy booking and access for all students</p>
                                </div>
                            </div>
                        </div>
                        <div className="facility-card">
                            <img src={campusImage.equipmentImage} alt="Equipment" />
                            <div className="facility-overlay">
                                <div className="facility-info">
                                    <span className="facility-icon">🛠️</span>
                                    <h3>Technical Support</h3>
                                    <p>24/7 technical assistance and maintenance</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* How It Works */}
            <section className="process-section">
                <div className="process-container">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">Simple steps to book your workstation</p>
                    <div className="process-steps">
                        {processSteps.map((item) => (
                            <div key={item.step} className="process-step">
                                <div className="step-number">{item.step}</div>
                                <span className="step-icon">{item.icon}</span>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section with enhanced cards */}
            <section className="services-section">
                <div className="services-container">
                    <h2 className="section-title">All Services</h2>
                    <p className="section-subtitle">Everything you need for computer lab management</p>
                    
                    <div className="services-grid">
                        {services.map((service) => (
                            <div key={service.id} className="service-card-enhanced">
                                <div className="service-card-image">
                                    <img src={service.image} alt={service.title} />
                                    <div className="service-card-overlay"></div>
                                    <span className="service-card-icon" style={{ background: service.color }}>{service.icon}</span>
                                </div>
                                <div className="service-card-content">
                                    <h3>{service.title}</h3>
                                    <p>{service.description}</p>
                                    <div className="service-features">
                                        {service.features.map((feature, idx) => (
                                            <span key={idx} className="feature-tag">{feature}</span>
                                        ))}
                                    </div>
                                    <Link to={`/campus/${campusCode}/login`} className="service-link">
                                        Learn More →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <h2>Ready to Get Started?</h2>
                <p>Login to access all services at {campus?.name}</p>
                <div className="cta-buttons">
                    <Link to={`/campus/${campusCode}/login`} className="btn-hero-primary">Login Now</Link>
                    <Link to={`/campus/${campusCode}/contact`} className="btn-hero-secondary">Contact Support</Link>
                </div>
            </section>
        </div>
    );
};

export default CampusService;