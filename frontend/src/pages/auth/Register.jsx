import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCampus } from '../../contexts/CampusContext';
import Button from '../../components/ui/Button';
import './Register.css';

// University of Gondar campuses (using full names for backend matching)
const CAMPUSES = [
  { value: 'Atse Tewodros', label: 'Atse Tewodros Campus' },
  { value: 'Maraki', label: 'Maraki Campus' },
  { value: 'Atse Fasil', label: 'Atse Fasil Campus' },
  { value: 'Health Science College (GC)', label: 'Health Science College (GC)' }
];

// UoG Colleges with their departments
const COLLEGE_DEPARTMENTS = {
  'Agriculture': {
    label: 'College of Agriculture and Rural Transformation',
    departments: [
      { value: 'Animal Science', label: 'Animal Science' },
      { value: 'Plant Science', label: 'Plant Science' },
      { value: 'Horticulture', label: 'Horticulture' },
      { value: 'Natural Resource Management', label: 'Natural Resource Management' },
      { value: 'Food Science and Technology', label: 'Food Science and Technology' },
      { value: 'Rural Development', label: 'Rural Development and Agricultural Extension' },
      { value: 'Agricultural Economics', label: 'Agricultural Economics' },
      { value: 'Soil and Water Conservation', label: 'Soil and Water Conservation' }
    ]
  },
  'Business': {
    label: 'College of Business and Economics',
    departments: [
      { value: 'Accounting', label: 'Accounting and Finance' },
      { value: 'Management', label: 'Management' },
      { value: 'Economics', label: 'Economics' },
      { value: 'Marketing Management', label: 'Marketing Management' },
      { value: 'Public Administration', label: 'Public Administration and Development Management' }
    ]
  },
  'Informatics': {
    label: 'College of Informatics',
    departments: [
      { value: 'Information Technology', label: 'Information Technology' },
      { value: 'Computer Science', label: 'Computer Science' },
      { value: 'Information Systems', label: 'Information Systems' },
      { value: 'Information Science', label: 'Information Science' }
    ]
  },
  'Education': {
    label: 'College of Education and Behavioral Sciences',
    departments: [
      { value: 'Educational Planning and Management', label: 'Educational Planning and Management' },
      { value: 'Psychology', label: 'Psychology' },
      { value: 'Special Needs Education', label: 'Special Needs Education' },
      { value: 'Curriculum and Instruction', label: 'Curriculum and Instruction' },
      { value: 'Guidance and Counseling', label: 'Guidance and Counseling' },
      { value: 'Early Childhood Education', label: 'Early Childhood Education' }
    ]
  },
  'Engineering': {
    label: 'College of Engineering',
    departments: [
      { value: 'Civil Engineering', label: 'Civil Engineering' },
      { value: 'Electrical and Computer Engineering', label: 'Electrical and Computer Engineering' },
      { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
      { value: 'Chemical Engineering', label: 'Chemical Engineering' },
      { value: 'Biomedical Engineering', label: 'Biomedical Engineering' },
      { value: 'Architecture', label: 'Architecture' },
      { value: 'Water Resources Engineering', label: 'Water Resources Engineering' }
    ]
  },
  'Health': {
    label: 'College of Health Sciences',
    departments: [
      { value: 'Medicine', label: 'Medicine' },
      { value: 'Nursing', label: 'Nursing' },
      { value: 'Pharmacy', label: 'Pharmacy' },
      { value: 'Public Health', label: 'Public Health' },
      { value: 'Midwifery', label: 'Midwifery' },
      { value: 'Medical Laboratory Science', label: 'Medical Laboratory Science' },
      { value: 'Anesthesia', label: 'Anesthesia' },
      { value: 'Optometry', label: 'Optometry' },
      { value: 'Physiotherapy', label: 'Physiotherapy' },
      { value: 'Dentistry', label: 'Dentistry' }
    ]
  },
  'Humanities': {
    label: 'College of Humanities and Social Sciences',
    departments: [
      { value: 'Sociology', label: 'Sociology' },
      { value: 'Social Work', label: 'Social Work' },
      { value: 'Political Science and International Relations', label: 'Political Science and International Relations' },
      { value: 'History and Heritage Management', label: 'History and Heritage Management' },
      { value: 'Geography and Environmental Studies', label: 'Geography and Environmental Studies' },
      { value: 'Journalism and Communication', label: 'Journalism and Communication' },
      { value: 'English Language and Literature', label: 'English Language and Literature' },
      { value: 'Afro-Asiatic Languages', label: 'Afro-Asiatic Languages and Literature' }
    ]
  },
  'Natural': {
    label: 'College of Natural and Computational Sciences',
    departments: [
      { value: 'Biology', label: 'Biology' },
      { value: 'Chemistry', label: 'Chemistry' },
      { value: 'Physics', label: 'Physics' },
      { value: 'Mathematics', label: 'Mathematics' },
      { value: 'Statistics', label: 'Statistics' },
      { value: 'Biotechnology', label: 'Biotechnology' },
      { value: 'Sport Science', label: 'Sport Science' }
    ]
  },
  'Veterinary': {
    label: 'College of Veterinary Medicine and Animal Sciences',
    departments: [
      { value: 'Veterinary Medicine', label: 'Veterinary Medicine' },
      { value: 'Animal Science', label: 'Animal Science' },
      { value: 'Veterinary Laboratory', label: 'Veterinary Laboratory Technology' },
      { value: 'Animal Biotechnology', label: 'Animal Biotechnology' }
    ]
  },
  'Law': {
    label: 'College of Law',
    departments: [
      { value: 'Law', label: 'Law' },
      { value: 'Human Rights', label: 'Human Rights Law' }
    ]
  },
  'Marine': {
    label: 'Ethiopian Institute of Water Resources',
    departments: [
      { value: 'Hydraulic Engineering', label: 'Hydraulic Engineering' },
      { value: 'Water Supply', label: 'Water Supply and Environmental Engineering' },
      { value: 'Irrigation Engineering', label: 'Irrigation Engineering' }
    ]
  }
};

// Helper to get colleges list from mapping
const COLLEGES = Object.entries(COLLEGE_DEPARTMENTS).map(([value, data]) => ({
  value,
  label: data.label
}));

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    college: '',
    department: '',
    campus: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    year: '',
    semester: '',
    gender: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCampus, selectCampus, getCampusByCode } = useCampus();

  useEffect(() => {
    const campusCodeFromState = location.state?.campusCode;
    if (!campusCodeFromState) return;

    const campusFromCode = getCampusByCode(campusCodeFromState);
    if (campusFromCode && selectedCampus?.code !== campusFromCode.code) {
      selectCampus(campusFromCode);
    }
  }, [location.state, getCampusByCode, selectCampus, selectedCampus]);

  // Get campus login URL
  const getCampusLoginUrl = () => {
    if (selectedCampus?.code) {
      return `/campus/${selectedCampus.code.toLowerCase()}/login`;
    }
    return '/campuses';
  };

  // Get departments for selected college
  const getDepartments = () => {
    if (!formData.college || !COLLEGE_DEPARTMENTS[formData.college]) {
      return [];
    }
    return COLLEGE_DEPARTMENTS[formData.college].departments;
  };

  // Validation functions
  const validateName = (name, fieldName) => {
    if (!name.trim()) {
      return `${fieldName} ያስፈልጋል`;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    if (name.trim().length < 2) {
      return `${fieldName} ቢያንስ 2 ፊደላት መሆን አለበት`;
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    // Check for letter
    if (!/[a-zA-Z]/.test(password)) {
      return 'Password must contain at least one letter';
    }
    // Check for number
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const validateStudentId = (studentId, role) => {
    if (role !== 'student') {
      return ''; // Student ID not required for non-students
    }
    if (!studentId.trim()) {
      return 'Student ID is required for students';
    }
    // Format: GUR/XXXXX/XX (e.g., GUR/02284/15)
    if (!/^GUR\/\d{5}\/\d{2}$/.test(studentId)) {
      return 'Student ID must be in format GUR/XXXXX/XX (e.g., GUR/02284/15)';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    const firstNameError = validateName(formData.firstName, 'First Name');
    if (firstNameError) newErrors.firstName = firstNameError;

    // Last Name validation
    const lastNameError = validateName(formData.lastName, 'Last Name');
    if (lastNameError) newErrors.lastName = lastNameError;

    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Campus validation
    if (!formData.campus) {
      newErrors.campus = 'Campus is required';
    }

    // College validation
    if (!formData.college) {
      newErrors.college = 'College/Institute is required';
    }

    // Department validation
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    // Password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'የይለፍ ቃሎች አይዛመዱም';
    }

     // Role validation
     if (!formData.role) {
       newErrors.role = 'Role is required';
     }

     // Gender validation
     if (!formData.gender) {
       newErrors.gender = 'Gender is required';
     }

     // Student ID validation (only for students)
    const studentIdError = validateStudentId(formData.studentId, formData.role);
    if (studentIdError) newErrors.studentId = studentIdError;

    // Year validation (only for students)
    if (formData.role === 'student' && !formData.year) {
      newErrors.year = 'Year is required for students';
    }

    // Semester validation (only for students)
    if (formData.role === 'student' && !formData.semester) {
      newErrors.semester = 'Semester is required for students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If college changes, reset department
    if (name === 'college') {
      setFormData({
        ...formData,
        college: value,
        department: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    // Reset existing account state when email changes
    if (name === 'email' && existingAccount) {
      setExistingAccount(false);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Get college label for display
      const collegeLabel = COLLEGE_DEPARTMENTS[formData.college]?.label || formData.college;

       // Format data for backend API
       const userData = {
         username: formData.email,
         email: formData.email,
         password: formData.password,
         firstName: formData.firstName,
         lastName: formData.lastName,
         name: `${formData.firstName} ${formData.lastName}`,
         role: formData.role,
         college: collegeLabel,
         department: formData.department,
         campus: formData.campus,
         gender: formData.gender
       };

      // Add student ID if role is student
      if (formData.role === 'student' && formData.studentId) {
        userData.studentId = formData.studentId;
        userData.year = formData.year;
        userData.semester = formData.semester;
      }

      console.log('[DEBUG] Register.jsx: Submitting registration with:', userData);

      const result = await register(userData);
      console.log('[DEBUG] Register.jsx: Registration result:', result);
      if (result.success) {
        // Show pending approval message on this page
        setRegistrationSuccess(true);
      } else {
        // Show detailed error message
        const errorMsg = result.errors ? result.errors.join(', ') : (result.message || 'Registration failed');
        setError(errorMsg);

        // Check if error is due to existing username or email
        if (result.message && (result.message.includes('Username already exists') || result.message.includes('Email already exists'))) {
          setExistingAccount(true);
        }
      }
    } catch (err) {
      console.error('[DEBUG] Register.jsx: Error:', err);
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const departments = getDepartments();

  return (
    <div className="register-container">
      <div className="register-hero">
        <div>
          <h2>Create Account</h2>
          <p>Register for the Computer Lab Management System</p>
        </div>
      </div>

      {registrationSuccess ? (
        <div className="success-message">
          <h3>Registration Submitted!</h3>
          <p>Your account has been created and is <strong>pending admin approval</strong>.</p>
          <p>You will be able to login once an administrator approves your registration.</p>
          <Button
            type="button"
            variant="primary"
            size="medium"
            onClick={() => navigate(getCampusLoginUrl())}
          >
            Go to Login
          </Button>
        </div>
      ) : (
        <>

          {error && (
            <div className="error-message">
              {error}
              {existingAccount && (
                <div className="existing-account-actions">
                  <p>ይህ መለያ አስቀድሞ አለ። በምትኩ መግቢያ መሆን ይፈልጋሉ?</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="medium"
                    onClick={() => navigate(getCampusLoginUrl(), { state: { email: formData.email } })}
                  >
                    Go to Login
                  </Button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <section className="register-section">
              <div className="register-section-header">
                <h3>Personal Details</h3>
                <p>Tell us who you are.</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="First name"
                    className={errors.firstName ? 'error' : ''}
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Last name"
                    className={errors.lastName ? 'error' : ''}
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-row form-row-single">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@uog.edu.et"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
              </div>
            </section>

            <section className="register-section">
              <div className="register-section-header">
                <h3>Campus And Role</h3>
                <p>Select your campus, academic unit, and access role.</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="campus">Campus</label>
                  <select
                    id="campus"
                    name="campus"
                    value={formData.campus}
                    onChange={handleChange}
                    required
                    className={errors.campus ? 'error' : ''}
                  >
                    <option value="">Select Campus</option>
                    {CAMPUSES.map(campus => (
                      <option key={campus.value} value={campus.value}>{campus.label}</option>
                    ))}
                  </select>
                  {errors.campus && <span className="error-text">{errors.campus}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="college">College/Institute</label>
                  <select
                    id="college"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    required
                    className={errors.college ? 'error' : ''}
                  >
                    <option value="">Select College/Institute</option>
                    {COLLEGES.map(college => (
                      <option key={college.value} value={college.value}>{college.label}</option>
                    ))}
                  </select>
                  {errors.college && <span className="error-text">{errors.college}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    disabled={!formData.college}
                    className={errors.department ? 'error' : ''}
                  >
                    <option value="">
                      {formData.college ? 'Select Department' : 'Select College First'}
                    </option>
                    {departments.map(dept => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                  {errors.department && <span className="error-text">{errors.department}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className={errors.role ? 'error' : ''}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="technician">Technician</option>
                  </select>
                  {errors.role && <span className="error-text">{errors.role}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className={errors.gender ? 'error' : ''}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <span className="error-text">{errors.gender}</span>}
                </div>
              </div>
            </section>

            <section className="register-section">
              <div className="register-section-header">
                <h3>Security</h3>
                <p>Create a strong password to protect your account.</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create password (min 8 chars)"
                    minLength={8}
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                  <span className="hint-text">Must contain letters, numbers, and special characters</span>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm password"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
              </div>
            </section>

            {formData.role === 'student' && (
              <section className="register-section register-section-highlight">
                <div className="register-section-header">
                  <h3>Student Academic Details</h3>
                  <p>These fields are required for student registration.</p>
                </div>
                <div className="form-row form-row-single">
                  <div className="form-group">
                    <label htmlFor="studentId">Student ID</label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      required={formData.role === 'student'}
                      placeholder="GUR/02284/15"
                      className={errors.studentId ? 'error' : ''}
                    />
                    {errors.studentId && <span className="error-text">{errors.studentId}</span>}
                    <span className="hint-text">Format: GUR/XXXXX/XX (e.g., GUR/02284/15)</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="year">Year</label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      required={formData.role === 'student'}
                      className={errors.year ? 'error' : ''}
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                    {errors.year && <span className="error-text">{errors.year}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="semester">Semester</label>
                    <select
                      id="semester"
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      required={formData.role === 'student'}
                      className={errors.semester ? 'error' : ''}
                    >
                      <option value="">Select Semester</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                    </select>
                    {errors.semester && <span className="error-text">{errors.semester}</span>}
                  </div>
                </div>
              </section>
            )}

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
              className="register-btn"
            >
              Create Account
            </Button>
          </form>

          <div className="login-link">
            <p>Already have an account? <Link to={getCampusLoginUrl()}>Sign in here</Link></p>
          </div>
        </>
      )}
    </div>
  );
};

export default Register;
