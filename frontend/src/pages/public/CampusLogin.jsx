import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCampus } from '../../contexts/CampusContext';
import Button from '../../components/ui/Button';
import '../auth/Login.css';

const CampusLogin = () => {
    const { campusCode } = useParams();
    const { campus, selectCampus, getCampusByCode } = useCampus();
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get campus-specific image
    const campusImage = campus?.image;

     // Login form state
     const [formData, setFormData] = useState({
         username: '',
         password: '',
         role: 'student'
     });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [infoMessage, setInfoMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Pre-fill username if redirected from registration
    useEffect(() => {
        if (location.state?.email) {
            setFormData(prev => ({
                ...prev,
                username: location.state.email
            }));
            if (location.state?.registrationSuccess) {
                setSuccessMessage('Registration submitted! Your account is pending admin approval. You will be able to login once approved.');
            } else {
                setInfoMessage('This email is already registered. Please login with your password.');
            }
        }
    }, [location.state]);

    // Pre-fill role if coming from superadmin login role selection
    useEffect(() => {
        if (location.state?.role) {
            setFormData(prev => ({
                ...prev,
                role: location.state.role
            }));
        }
    }, [location.state]);

    // Auto-select campus based on URL param if not already selected
    useEffect(() => {
        if (campusCode) {
            const foundCampus = getCampusByCode(campusCode);
            if (foundCampus && (!campus || campus.code !== foundCampus.code)) {
                selectCampus(foundCampus);
            }
        }
    }, [campusCode, campus, getCampusByCode, selectCampus]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(formData.username, formData.password, formData.role);
            if (result.success) {
                // Verify that the selected role matches the user's actual role
                if (result.user.role === formData.role) {
                    // Redirect based on role to welcome back page (dashboard)
                    switch (result.user.role) {
                        case 'student':
                            navigate('/student/dashboard');
                            break;
                        case 'teacher':
                            navigate('/teacher/dashboard');
                            break;
                        case 'technician':
                            navigate('/technician/dashboard');
                            break;
                        case 'admin':
                            navigate('/admin/dashboard');
                            break;
                        case 'superadmin':
                            setError('Super Administrators should use the main login page.');
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            break;
                        default:
                            navigate('/');
                    }
                } else {
                    // Role mismatch - clear credentials and show error
                    setError(`This account does not have the ${formData.role} role`);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } else {
                setError(result.message || 'Login failed');
            }
        } catch {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    // Full screen with login form (same structure as Super Admin login)
    return (
        <div className="home-page">
            <section className="hero-section" style={{
                backgroundImage: campusImage ? `url(${campusImage.hero})` : undefined,
                minHeight: '100vh',
                padding: '2rem',
                justifyContent: 'center'
            }}>
                <div className="hero-overlay"></div>
                <div className="auth-container" style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div className="login-container" style={{ background: '#fff', borderRadius: '12px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', color: '#1e293b', width: '100%', maxWidth: '650px' }}>
                        <h2 style={{ color: '#1e293b' }}>Welcome Back</h2>
                        <p style={{ color: '#64748b' }}>Please sign in to continue</p>

                        {error && <div className="error-message">{error}</div>}
                        {infoMessage && <div className="info-message">{infoMessage}</div>}
                        {successMessage && <div className="success-message">{successMessage}</div>}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your username"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="role-select"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="technician">Technician</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="large"
                                loading={loading}
                                className="login-btn"
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className="register-link" style={{ color: '#64748b' }}>
                            <p>
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    state={{ campusCode }}
                                    style={{ color: '#2563eb' }}
                                >
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CampusLogin;
