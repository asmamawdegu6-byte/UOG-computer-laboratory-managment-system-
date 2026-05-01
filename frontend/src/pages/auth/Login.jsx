import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCampus } from '../../contexts/CampusContext';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [selectedRole, setSelectedRole] = useState('superadmin');
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('username'); // username, verify, reset
  const [forgotUsername, setForgotUsername] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(import.meta.env.VITE_SUPERADMIN_PHONE || '0928886341'); // Will be updated from user data
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });

  // Campus data for selection
  const CAMPUS_LIST = [
    {
        name: 'Atse Tewodros Campus',
        code: 'ATW',
        description: 'The main hub for Computing, Informatics and Natural Sciences.',
        color: '#1e3a8a'
    },
    {
        name: 'Maraki Campus',
        code: 'MAR',
        description: 'Home to the Colleges of Business, Economics, Law, and Social Sciences.',
        color: '#166534'
    },
    {
        name: 'Atse Fasil Campus',
        code: 'ATF',
        description: 'Specialized campus for advanced Engineering and Technology studies.',
        color: '#991b1b'
    },
    {
        name: 'Health Science College (GC)',
        code: 'HSC',
        description: 'Premier institution for Medicine and Health Sciences research.',
        color: '#854d0e'
    }
  ];

  const { login } = useAuth();
  const { selectCampus, campuses, getCampusByCode } = useCampus();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill username if redirected from registration with existing account
  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({
        ...prev,
        username: location.state.email
      }));

      // Check if this is a successful registration redirect
      if (location.state?.registrationSuccess) {
        setSuccessMessage('Registration submitted! Your account is pending admin approval. You will be able to login once approved.');
      } else {
        setInfoMessage('This email is already registered. Please login with your password.');
      }
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setSelectedCampus(null); // Reset campus when role changes
  };

  const handleCampusSelect = (campusCode) => {
    const foundCampus = CAMPUS_LIST.find(c => c.code === campusCode);
    if (foundCampus) {
      const campusWithImages = {
        ...foundCampus,
        image: { hero: '', thumbnail: '', icon: getCampusIcon(foundCampus.code) }
      };
      selectCampus(campusWithImages);
    }
    setSelectedCampus(campusCode);
  };

  const handleBackToCampusSelection = () => {
    setSelectedCampus(null);
  };

  const handleBackToRoleSelection = () => {
    setSelectedCampus(null);
    setSelectedRole('superadmin');
  };

  const getCampusIcon = (code) => {
    switch(code) {
      case 'MAR': return '💻';
      case 'ATW': return '🎓';
      case 'ATF': return '🖥️';
      case 'HSC': return '🏥';
      default: return '🏫';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password, selectedRole);
      if (result.success) {
        if (selectedRole === 'superadmin') {
          // Super Admin login - only allow superadmin
          if (result.user.role === 'superadmin') {
            navigate('/superadmin/dashboard');
          } else {
            setError('This login is for Super Administrators only.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          // Campus user login - verify role matches
          if (result.user.role === selectedRole) {
            // Redirect based on role
            switch (selectedRole) {
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
              default:
                navigate('/');
            }
          } else {
            setError(`This account does not have the ${selectedRole} role`);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
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

  // Forgot password handlers
   const handleForgotPassword = async (e) => {
     e.preventDefault();
     if (!forgotUsername.trim()) return;

     setForgotLoading(true);
     setForgotMessage({ type: '', text: '' });

     try {
       // First find the user
       const findResponse = await api.post('/auth/find-user-for-reset', { username: forgotUsername });

       if (!findResponse.data.success) {
         setForgotMessage({ type: 'error', text: findResponse.data.message || 'User not found' });
         setForgotLoading(false);
         return;
       }

       // Use the user data returned from the server
       const user = findResponse.data.user || findResponse.data;
       setFoundUser(user);
       // Use the configured superadmin phone number (from env), not user's stored phone
       const superAdminPhone = import.meta.env.VITE_SUPERADMIN_PHONE || '0928886341';
       setPhoneNumber(superAdminPhone);

       // Send verification code - we pass no phone, let backend use configured phone for superadmin
       const codeResponse = await api.post('/auth/send-reset-code', { username: forgotUsername });

       if (codeResponse.data.success) {
         setForgotStep('verify');
         setForgotMessage({ type: 'success', text: 'Verification code sent to ' + superAdminPhone });
       } else {
         setForgotMessage({ type: 'error', text: codeResponse.data.message || 'Failed to send code' });
       }
     } catch (err) {
       setForgotMessage({ type: 'error', text: err.response?.data?.message || 'Failed to send verification code' });
     } finally {
       setForgotLoading(false);
     }
   };

   const handleVerifyCode = async (e) => {
     e.preventDefault();

     if (!verificationCode) {
       setForgotMessage({ type: 'error', text: 'Please enter verification code' });
       return;
     }

     setForgotLoading(true);
     setForgotMessage({ type: '', text: '' });

     try {
       const superAdminPhone = import.meta.env.VITE_SUPERADMIN_PHONE || '0928886341';
       // Send both phone (for display/logging) and username (for actual lookup)
       const response = await api.post('/auth/verify-reset-code', {
         phone: superAdminPhone,
         username: forgotUsername,
         code: verificationCode
       });

       if (response.data.success) {
         setForgotStep('newPassword');
         setForgotMessage({ type: 'success', text: 'Code verified! Enter your new password.' });
       } else {
         setForgotMessage({ type: 'error', text: response.data.message || 'Invalid verification code' });
       }
     } catch (err) {
       setForgotMessage({ type: 'error', text: 'Invalid verification code' });
     } finally {
       setForgotLoading(false);
     }
   };

   const handleNewPassword = async (e) => {
     e.preventDefault();

     if (newPassword !== confirmPassword) {
       setForgotMessage({ type: 'error', text: 'Passwords do not match' });
       return;
     }

     if (newPassword.length < 6) {
       setForgotMessage({ type: 'error', text: 'Password must be at least 6 characters' });
       return;
     }

     setForgotLoading(true);
     setForgotMessage({ type: '', text: '' });

     try {
       const superAdminPhone = import.meta.env.VITE_SUPERADMIN_PHONE || '0928886341';
       // Send both phone and username for lookup
       const response = await api.post('/auth/reset-password-by-phone', {
         phone: superAdminPhone,
         username: forgotUsername,
         newPassword
       });

       if (response.data.success) {
         setForgotMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
         setTimeout(() => {
           setShowForgotPassword(false);
           setForgotStep('username');
           setForgotUsername('');
           setFoundUser(null);
           setVerificationCode('');
           setNewPassword('');
           setConfirmPassword('');
         }, 3000);
       } else {
         setForgotMessage({ type: 'error', text: response.data.message || 'Failed to reset password' });
       }
     } catch (err) {
       setForgotMessage({ type: 'error', text: 'Failed to reset password. Please try again.' });
     } finally {
       setForgotLoading(false);
     }
    };

   const handleForgotPasswordCancel = () => {
    setShowForgotPassword(false);
    setForgotStep('username');
    setForgotUsername('');
    setFoundUser(null);
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotMessage({ type: '', text: '' });
  };

  // If showing forgot password form
  if (showForgotPassword) {
    return (
      <div className="login-container">
        <h2>Reset Super Admin Password</h2>
        <p>Enter your username to reset your password via SMS verification</p>

        {forgotMessage.text && (
          <div className={`${forgotMessage.type}-message`}>{forgotMessage.text}</div>
        )}

        {/* Step 1: Enter username and click Reset Password */}
        {forgotStep === 'username' && (
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="forgotUsername">Username</label>
              <input
                type="text"
                id="forgotUsername"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                required
                placeholder="Enter your username"
              />
            </div>

            <p className="info-text">Verification code will be sent to: <strong>{import.meta.env.VITE_SUPERADMIN_PHONE || '0928886341'}</strong></p>

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={forgotLoading}
              className="login-btn"
            >
              Reset Password
            </Button>
          </form>
        )}

        {/* Step 2: Verify code (after sending) */}
        {forgotStep === 'verify' && foundUser && (
          <div className="forgot-password-form">
            <div className="user-info-box">
              <p><strong>User:</strong> {foundUser.firstName} {foundUser.lastName}</p>
              <p><strong>Username:</strong> {foundUser.username}</p>
              <p><strong>Role:</strong> {foundUser.role}</p>
            </div>
          </div>
        )}

        {/* Step 3: Enter verification code */}
        {forgotStep === 'verify' && (
          <form onSubmit={handleVerifyCode} className="login-form">
            <p className="info-text">Enter the verification code sent to <strong>{phoneNumber}</strong></p>
            
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={forgotLoading}
              className="login-btn"
            >
              Verify Code
            </Button>
          </form>
        )}

        {/* Step 4: Enter new password */}
        {forgotStep === 'newPassword' && (
          <form onSubmit={handleNewPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={forgotLoading}
              className="login-btn"
            >
              Reset Password
            </Button>
          </form>
        )}

        <div className="register-link">
          <button 
            type="button" 
            className="link-button" 
            onClick={handleForgotPasswordCancel}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

   // Regular login form
   const isCampusSelection = selectedRole !== 'superadmin' && !selectedCampus;

   return (
     <div className="login-container" style={{ maxWidth: isCampusSelection ? '1280px' : '860px' }}>

       {selectedRole === 'superadmin' && !selectedCampus ? (
         // Super Admin Login Form
         <>
           <h2>Super Admin Login</h2>
           <p>Please sign in to continue</p>

           {error && <div className="error-message">{error}</div>}
           {infoMessage && <div className="info-message">{infoMessage}</div>}
           {successMessage && <div className="success-message">{successMessage}</div>}

           <form onSubmit={handleSubmit} className="login-form">
             <div className="form-group">
               <label htmlFor="selectedRole">Role</label>
               <select
                 id="selectedRole"
                 name="selectedRole"
                 value={selectedRole}
                 onChange={handleRoleChange}
                 className="role-select"
               >
                 <option value="superadmin">Super Admin</option>
                 <option value="student">Student</option>
                 <option value="teacher">Teacher</option>
                 <option value="technician">Technician</option>
                 <option value="admin">Admin</option>
               </select>
             </div>

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

<div className="forgot-password-link">
             {/* Option 1: Use email-based reset (recommended) */}
             <Link 
               to="/forgot-password-email" 
               className="link-button"
               style={{ display: 'block', marginBottom: '0.5rem' }}
             >
               Forgot Password? (Reset via Email)
             </Link>
             {/* Option 2: Use SMS-based reset (requires Twilio) */}
             <button 
               type="button" 
               className="link-button" 
               onClick={() => setShowForgotPassword(true)}
               style={{ fontSize: '0.875rem', color: '#64748b' }}
             >
               Reset via SMS
             </button>
           </div>
         </>
       ) : selectedCampus ? (
         // Campus Login Form (when campus is selected)
         <>
           <h2>Welcome to {CAMPUS_LIST.find(c => c.code === selectedCampus)?.name}</h2>
           <p>Login as {selectedRole.replace('admin', ' Admin').replace('technician', ' Technician')}</p>

           {error && <div className="error-message">{error}</div>}
           {infoMessage && <div className="info-message">{infoMessage}</div>}
           {successMessage && <div className="success-message">{successMessage}</div>}

           <form onSubmit={handleSubmit} className="login-form">
             <div className="form-group">
               <label>Selected Campus: <strong>{CAMPUS_LIST.find(c => c.code === selectedCampus)?.name}</strong></label>
                  <button 
                    type="button" 
                    className="link-button" 
                    onClick={handleBackToCampusSelection}
                    style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}
                  >
                    ← Change Campus
                  </button>
             </div>

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

             <input type="hidden" name="role" value={selectedRole} />

             <Button
               type="submit"
               variant="primary"
               size="large"
               loading={loading}
               className="login-btn"
             >
               Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
             </Button>
           </form>
         </>
       ) : (
         // Campus Selection Grid (when non-superadmin role selected but no campus)
         <>
           <h2>Select Your Campus</h2>
           <p>Choose your campus to continue as {selectedRole.replace('admin', ' Admin').replace('technician', ' Technician')}</p>

           <div className="campuses-grid" style={{ 
             display: 'grid', 
             gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
             gap: '1.5rem', 
             marginTop: '2rem' 
           }}>
             {CAMPUS_LIST.map((campus) => (
               <div 
                 key={campus.code} 
                 className="campus-card" 
                 style={{ 
                   background: 'white', 
                   borderRadius: '12px', 
                   overflow: 'hidden', 
                   boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                   cursor: 'pointer',
                   borderTop: `4px solid ${campus.color}`
                 }}
                 onClick={() => handleCampusSelect(campus.code)}
               >
                 <div style={{ 
                   background: campus.color, 
                   height: '120px', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   color: 'white',
                   fontSize: '3rem',
                   fontWeight: 800,
                   opacity: 0.3
                 }}>
                   {campus.code}
                 </div>
                 <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                   <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>{campus.name}</h3>
                   <p style={{ color: '#64748b', fontSize: '0.875rem', flex: 1 }}>{campus.description}</p>
                   <span style={{ 
                     display: 'inline-block', 
                     background: campus.color, 
                     color: 'white', 
                     padding: '0.5rem 1rem', 
                     borderRadius: '8px', 
                     fontWeight: 600, 
                     textAlign: 'center' 
                   }}>
                     Select {campus.code}
                   </span>
                 </div>
               </div>
             ))}
           </div>

           <button 
             type="button" 
             className="link-button" 
             onClick={handleBackToRoleSelection}
             style={{ display: 'block', margin: '2rem auto 0', textAlign: 'center' }}
           >
             ← Back to Role Selection
           </button>
         </>
       )}
     </div>
   );
};

export default Login;
