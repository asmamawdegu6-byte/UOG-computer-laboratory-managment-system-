import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Campuses.css';

// Unsplash images for campuses
const CAMPUS_IMAGES = {
    ATW: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
    MAR: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f6?w=800&auto=format&fit=crop&q=80',
    ATF: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
    HSC: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80'
};

const CAMPUS_LIST = [
    {
        name: 'Atse Tewodros Campus',
        code: 'ATW',
        description: 'The main hub for Computing, Informatics and Natural Sciences.',
        color: '#1e3a8a',
        focus: 'Computing & Informatics'
    },
    {
        name: 'Maraki Campus',
        code: 'MAR',
        description: 'Home to the Colleges of Business, Economics, Law, and Social Sciences.',
        color: '#166534',
        focus: 'Social Science & Research'
    },
    {
        name: 'Atse Fasil Campus',
        code: 'ATF',
        description: 'Specialized campus for advanced Engineering and Technology studies.',
        color: '#991b1b',
        focus: 'Engineering & Technology'
    },
    {
        name: 'Health Science College (GC)',
        code: 'HSC',
        description: 'Premier institution for Medicine and Health Sciences research.',
        color: '#854d0e',
        focus: 'Medical Informatics'
    }
];

// Hero background image
const CAMPUSES_HERO = 'https://images.unsplash.com/photo-1562774053-701939374585?w=1920&auto=format&fit=crop&q=80';

const Campuses = () => {
    const location = useLocation();
    const fromLogin = location.state?.fromLogin;
    const selectedRole = location.state?.selectedRole;

    return (
        <div className="campuses-page">
            <section className="campuses-hero" style={{ backgroundImage: `url(${CAMPUSES_HERO})` }}>
                <div className="hero-overlay"></div>
                <div className="campuses-header">
                    <h1>University of Gondar Campuses</h1>
                    <p>Select your campus to access dedicated computer laboratory management services.</p>
                </div>
            </section>

            <div className="campuses-container">

            <div className="campuses-grid">
                {CAMPUS_LIST.map((campus) => (
                    <div key={campus.code} className="campus-card">
                        <div className="campus-card-image">
                            <img src={CAMPUS_IMAGES[campus.code]} alt={campus.name} />
                            <div className="campus-card-overlay" style={{ backgroundColor: campus.color }}></div>
                            <div className="campus-card-badge">{campus.focus}</div>
                            </div>
                            <div className="campus-card-body">
                                <h3>{campus.name}</h3>
                                <p>{campus.description}</p>
                                <Link 
                                    to={fromLogin ? `/campus/${campus.code.toLowerCase()}/login` : `/campus/${campus.code.toLowerCase()}`}
                                    state={fromLogin ? { role: selectedRole } : {}}
                                    className="campus-visit-btn"
                                >
                                    {fromLogin ? 'Continue to Login' : 'Visit Campus Portal'}
                                </Link>
                            </div>
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
};

export default Campuses;