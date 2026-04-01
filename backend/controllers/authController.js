const User = require('../models/User');
const { generateToken, generateResetToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            if (user.approvalStatus === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account is pending admin approval. Please wait for an administrator to approve your registration.'
                });
            }
            if (user.approvalStatus === 'rejected') {
                return res.status(403).json({
                    success: false,
                    message: 'Your registration has been rejected. Please contact an administrator.'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken({
            id: user._id,
            username: user.username,
            role: user.role
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName || (user.name ? user.name.split(' ')[0] : ''),
                lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
                name: user.name,
                role: user.role,
                studentId: user.studentId,
                year: user.year,
                semester: user.semester,
                department: user.department,
                phone: user.phone,
                campus: user.campus,
                college: user.college,
                photoUrl: user.photoUrl
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
exports.register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, name, studentId, department, phone, campus, college, role, year, semester } = req.body;

        console.log('[DEBUG] Registration request received:', { username, email, firstName, lastName, studentId, campus, college, role, year, semester });

        const finalUsername = username || email;
        const finalFirstName = firstName || (name ? name.split(' ')[0] : email.split('@')[0]);
        const finalLastName = lastName || (name ? name.split(' ').slice(1).join(' ') : '');
        const finalName = name || `${finalFirstName} ${finalLastName}`;

        // Validation
        const errors = [];

        // First name validation
        if (!finalFirstName || !finalFirstName.trim()) {
            errors.push('First name is required');
        } else if (!/^[a-zA-Z\s'-]+$/.test(finalFirstName)) {
            errors.push('First name can only contain letters, spaces, hyphens, and apostrophes');
        }

        // Last name validation
        if (!finalLastName || !finalLastName.trim()) {
            errors.push('Last name is required');
        } else if (!/^[a-zA-Z\s'-]+$/.test(finalLastName)) {
            errors.push('Last name can only contain letters, spaces, hyphens, and apostrophes');
        }

        // Email validation
        if (!email || !email.trim()) {
            errors.push('Email is required');
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            errors.push('Please enter a valid email address');
        }

        // Campus validation
        if (campus && !/^[a-zA-Z\s]+$/.test(campus)) {
            errors.push('Campus can only contain letters and spaces');
        }

        // College validation
        if (college && !/^[a-zA-Z\s&]+$/.test(college)) {
            errors.push('College/Institute can only contain letters, spaces, and &');
        }

        // Password validation
        if (!password || password.length < 8) {
            errors.push('Password must be at least 8 characters');
        } else {
            if (!/[a-zA-Z]/.test(password)) {
                errors.push('Password must contain at least one letter');
            }
            if (!/[0-9]/.test(password)) {
                errors.push('Password must contain at least one number');
            }
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                errors.push('Password must contain at least one special character');
            }
        }

        // Student ID validation (only for students)
        const userRole = role || 'student';
        if (userRole === 'student') {
            if (!studentId || !studentId.trim()) {
                errors.push('Student ID is required for students');
            } else if (!/^GUR\/\d{5}\/\d{2}$/.test(studentId)) {
                errors.push('Student ID must be in format GUR/XXXXX/XX (e.g., GUR/02284/15)');
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [
                { username: finalUsername.toLowerCase() },
                { email: email.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.username === finalUsername.toLowerCase()
                    ? 'Username already exists'
                    : 'Email already exists'
            });
        }

        // Create user object
        const userData = {
            username: finalUsername.toLowerCase(),
            email: email.toLowerCase(),
            password,
            firstName: finalFirstName,
            lastName: finalLastName,
            name: finalName,
            role: userRole,
            department,
            phone,
            campus,
            college,
            isActive: false,
            approvalStatus: 'pending'
        };

        // Add student-specific fields if role is student
        if (userRole === 'student') {
            if (studentId) {
                userData.studentId = studentId.toUpperCase();
            }
            if (year) {
                userData.year = parseInt(year);
            }
            if (semester) {
                userData.semester = parseInt(semester);
            }
        }

        const user = new User(userData);

        console.log('[DEBUG] Attempting to save user:', user.username, user.email);
        const savedUser = await user.save();
        console.log('[DEBUG] User saved successfully with ID:', savedUser._id);

        res.status(201).json({
            success: true,
            message: 'Registration submitted! Your account is pending admin approval. You will be able to login once approved.'
        });
    } catch (error) {
        console.log('[DEBUG] Registration error:', error);
        const errorMessage = error.message || 'Unknown error';
        if (error.name === 'ValidationError') {
            console.log('[DEBUG] Mongoose validation error:', error.errors);
            const validationErrors = Object.keys(error.errors).map(key => error.errors[key].message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error during registration: ' + errorMessage,
            errors: error.errors ? Object.keys(error.errors).map(key => error.errors[key].message) : []
        });
    }
};

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account exists with this email, password reset instructions have been sent.'
            });
        }

        const resetToken = generateResetToken(user._id);
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 3600000);
        await user.save();

        await sendPasswordResetEmail(user.email, resetToken, user.username);

        res.json({
            success: true,
            message: 'Password reset instructions sent to your email.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const user = await User.findOne({
            _id: decoded.id,
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful! Please login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName || (user.name ? user.name.split(' ')[0] : ''),
                lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
                name: user.name,
                role: user.role,
                studentId: user.studentId,
                year: user.year,
                semester: user.semester,
                department: user.department,
                phone: user.phone,
                campus: user.campus,
                college: user.college,
                photoUrl: user.photoUrl,
                isActive: user.isActive,
                approvalStatus: user.approvalStatus
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @route   POST /api/auth/upload-photo
// @desc    Upload profile photo
// @access  Private
exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No photo file uploaded'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Store the relative path to the uploaded file
        const photoUrl = `/uploads/profiles/${req.file.filename}`;
        user.photoUrl = photoUrl;
        await user.save();

        res.json({
            success: true,
            message: 'Profile photo uploaded successfully',
            photoUrl: photoUrl
        });
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during photo upload'
        });
    }
};
