import React, { useState } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import './About.css';
import './Contact.css';

// Default contact info (can be customized per campus)
const getCampusContactInfo = (campus) => {
    const commonEmail = 'asmedeg2888@gmail.com';
    const commonPhone = '+251 28 88 63 41';
    const emergencyPhone = '+251 47 77 28 87';
    
    // Campus-specific addresses based on focus
    const campusAddresses = {
        MAR: {
            address: 'Maraki Campus, University of Gondar, Gondar, Ethiopia',
            focus: 'Research & Technology'
        },
        ATW: {
            address: 'Atse Tewodros Campus, University of Gondar, Gondar, Ethiopia',
            focus: 'Social Science & Computing'
        },
        ATF: {
            address: 'Atse Fasil Campus, University of Gondar, Gondar, Ethiopia',
            focus: 'Social Science & Development'
        },
        HSC: {
            address: 'Health Science College, University of Gondar, Gondar, Ethiopia',
            focus: 'Medical Informatics'
        }
    };
    
    const campusCode = campus?.code || 'MAR';
    const campusInfo = campusAddresses[campusCode] || campusAddresses.MAR;
    
    return {
        email: commonEmail,
        phone: commonPhone,
        emergencyPhone: emergencyPhone,
        address: campusInfo.address,
        focus: campusInfo.focus
    };
};

const CampusContact = () => {
    const { campusCode } = useParams();
    const { campus } = useOutletContext() || {};
    
    // Get campus-specific images
    const campusImage = campus?.image;
    
    // Get contact info based on campus
    const contactInfo = getCampusContactInfo(campus);
    
    // Contact cards data
    const contactCards = [
        {
            id: 1,
            icon: '📍',
            title: 'Address',
            content: contactInfo.address,
            image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=80'
        },
        {
            id: 2,
            icon: '📞',
            title: 'Phone',
            content: contactInfo.phone,
            image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&q=80'
        },
        {
            id: 3,
            icon: '✉️',
            title: 'Email',
            content: contactInfo.email,
            image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&q=80'
        },
        {
            id: 4,
            icon: '🕐',
            title: 'Working Hours',
            content: 'Mon - Fri: 8:00 AM - 5:00 PM',
            image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80'
        }
    ];
    
    // Form state - user's email for response, not the contact email
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Send email to the contact email address
        const mailtoLink = `mailto:${contactInfo.email}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
        window.location.href = mailtoLink;
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    // Emergency contacts
    const emergencyContacts = [
        { id: 1, title: 'Technical Support', phone: contactInfo.emergencyPhone, icon: '🔧', available: '24/7' },
        { id: 2, title: 'Lab Manager', phone: contactInfo.phone, icon: '👨‍💼', available: '8AM-5PM' },
        { id: 3, title: 'Security', phone: contactInfo.emergencyPhone, icon: '🛡️', available: '24/7' }
    ];

    // Support channels
    const supportChannels = [
        { id: 1, icon: '💬', title: 'Live Chat', description: 'Chat with our support team', link: '#' },
        { id: 2, icon: '🎫', title: 'Submit Ticket', description: 'Create a support ticket', link: '#' },
        { id: 3, icon: '📚', title: 'Knowledge Base', description: 'Find answers to common questions', link: '#' }
    ];

    // FAQ data
    const faqs = [
        {
            question: 'How do I book a workstation?',
            answer: 'You can book a workstation by logging into your account and navigating to the "Book Workstation" section. Select your preferred lab, date, and time slot.',
            image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80'
        },
        {
            question: 'What are the lab operating hours?',
            answer: 'Our computer labs are open Monday to Friday from 8:00 AM to 5:00 PM. Some labs may have extended hours during exam periods.',
            image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80'
        },
        {
            question: 'How do I report a faulty computer?',
            answer: 'You can report a faulty computer through the "Report Fault" feature in your dashboard. Please provide detailed information about the issue.',
            image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80'
        },
        {
            question: 'Can I cancel my booking?',
            answer: 'Yes, you can cancel your booking up to 2 hours before the scheduled time. Go to "My Bookings" and select the booking you wish to cancel.',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80'
        }
    ];

    return (
        <div className="home-page">
            {/* Hero Section with campus-specific background */}
            <section className="contact-hero" style={{ backgroundImage: campusImage ? `url(${campusImage.hero})` : undefined }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <span className="hero-badge">{campusImage?.icon} {campus.name}</span>
                    <span className="campus-focus-tag">{contactInfo.focus}</span>
                    <h1>Contact Us</h1>
                    <p>Get in touch with us for any questions or support</p>
                    <div className="hero-actions">
                        <Link to={`/campus/${campusCode}/login`} className="btn-hero-primary">Get Support</Link>
                        <Link to={`/campus/${campusCode}/services`} className="btn-hero-secondary">View Services</Link>
                    </div>
                </div>
            </section>

            {/* Contact Cards Section */}
            <section className="contact-cards-section">
                <div className="contact-cards-grid">
                    {contactCards.map((info) => (
                        <div key={info.id} className="contact-card">
                            <div className="contact-card-image">
                                <img src={info.image} alt={info.title} />
                                <div className="contact-card-overlay"></div>
                            </div>
                            <div className="contact-card-content">
                                <span className="contact-card-icon">{info.icon}</span>
                                <h3>{info.title}</h3>
                                <p>{info.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Form & Map Section */}
            <section className="contact-main-section">
                <div className="contact-container">
                    {/* Contact Form */}
                    <div className="contact-form-wrapper">
                        <h2>Send us a Message</h2>
                        <p className="form-subtitle">We'll respond to: <strong>{contactInfo.email}</strong></p>
                        
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Your Name</label>
                                    <input 
                                        type="text" 
                                        id="name" 
                                        name="name" 
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Your Email</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <select 
                                    id="subject" 
                                    name="subject" 
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a subject</option>
                                    <option value="booking">Booking Assistance</option>
                                    <option value="technical">Technical Support</option>
                                    <option value="feedback">Feedback</option>
                                    <option value="inquiry">General Inquiry</option>
                                    <option value="complaint">Complaint</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea 
                                    id="message" 
                                    name="message" 
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="How can we help you?"
                                    rows="5"
                                    required
                                ></textarea>
                            </div>
                            
                            <button type="submit" className="submit-btn">
                                Send Message
                            </button>
                        </form>
                    </div>

                    {/* Map Section */}
                    <div className="map-wrapper">
                        <h2>Find Us</h2>
                        <div className="map-container">
                            <img 
                                src={campusImage?.labImage} 
                                alt={`${campus.name} Location`} 
                                className="map-image"
                            />
                            <div className="map-overlay">
                                <div className="map-pin">
                                    <span className="pin-icon">📍</span>
                                    <div className="pin-info">
                                        <h4>{campus.name}</h4>
                                        <p>{campus.city}, Ethiopia</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Emergency Contacts Section */}
            <section className="emergency-section">
                <div className="emergency-container">
                    <h2 className="section-title">Emergency Contacts</h2>
                    <p className="section-subtitle">Quick access to immediate assistance</p>
                    
                    <div className="emergency-grid">
                        {emergencyContacts.map((contact) => (
                            <div key={contact.id} className="emergency-card">
                                <div className="emergency-icon">{contact.icon}</div>
                                <div className="emergency-content">
                                    <h3>{contact.title}</h3>
                                    <p className="emergency-phone">{contact.phone}</p>
                                    <span className="emergency-availability">
                                        Available: {contact.available}
                                    </span>
                                </div>
                                <button className="emergency-call-btn">
                                    Call Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Support Channels Section */}
            <section className="support-section">
                <div className="support-container">
                    <h2 className="section-title">Other Ways to Get Help</h2>
                    
                    <div className="support-grid">
                        {supportChannels.map((channel) => (
                            <div key={channel.id} className="support-card">
                                <span className="support-icon">{channel.icon}</span>
                                <h3>{channel.title}</h3>
                                <p>{channel.description}</p>
                                <Link to={channel.link} className="support-link">
                                    Learn More →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="faq-container">
                    <h2 className="section-title">Frequently Asked Questions</h2>
                    <p className="section-subtitle">Find answers to common questions</p>
                    
                    <div className="faq-grid">
                        {faqs.map((faq, index) => (
                            <div key={index} className="faq-card">
                                <div className="faq-image">
                                    <img src={faq.image} alt={faq.question} />
                                </div>
                                <div className="faq-content">
                                    <h3>{faq.question}</h3>
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CampusContact;