const User = require('../models/User');
const { generateToken, generateResetToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const AuditLog = require('../models/AuditLog');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
exports.login = async (req, res) => {
    const startTime = Date.now();
    try {
        const { username, password, role } = req.body;

        logger.info('Login attempt', { identifier: username, ip: req.ip });

        if (!username || !password) {
            logger.warn('Login failed: missing credentials', { identifier: username });
            return res.status(400).json({
                success: false,
                message: 'Please provide username/email and password'
            });
        }

        // Trim whitespace and normalize to lowercase
        const identifier = username.trim().toLowerCase();

        const user = await User.findOne({
            $or: [
                { username: identifier },
                { email: identifier }
            ]
        });

        if (!user) {
            logger.warn('Login failed: user not found', { identifier });

            // Audit log for failed login (user not found)
            await AuditLog.create({
                user: null,
                action: 'auth.failed_login',
                resource: 'User',
                details: `Failed login attempt - user not found: ${identifier}`,
                ipAddress: req.ip,
                userAgent: req.headers?.['user-agent']
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        logger.info('User found', { userId: user._id, role: user.role, status: user.approvalStatus });

        // Check if role is provided and matches user's role
        if (role && user.role !== role) {
            logger.warn('Login failed: role mismatch', { userId: user._id, username: user.username, requestedRole: role, actualRole: user.role });

            // Audit log for role mismatch
            await AuditLog.create({
                user: user._id,
                action: 'auth.failed_login',
                resource: 'User',
                resourceId: user._id,
                details: `Failed login attempt - role mismatch: requested ${role}, actual ${user.role}`,
                ipAddress: req.ip,
                userAgent: req.headers?.['user-agent']
            });

            return res.status(403).json({
                success: false,
                message: `This account does not have the ${role} role`
            });
        }

        // Check if user is active
        if (!user.isActive) {
            if (user.approvalStatus === 'pending') {
                // Audit log for pending account login attempt
                await AuditLog.create({
                    user: user._id,
                    action: 'auth.pending_account',
                    resource: 'User',
                    resourceId: user._id,
                    details: `Login attempt on pending account`,
                    ipAddress: req.ip,
                    userAgent: req.headers?.['user-agent']
                });

                return res.status(403).json({
                    success: false,
                    message: 'Your account is pending admin approval. Please wait for an administrator to approve your registration.'
                });
            }
            if (user.approvalStatus === 'rejected') {
                // Audit log for rejected account login attempt
                await AuditLog.create({
                    user: user._id,
                    action: 'auth.rejected_account',
                    resource: 'User',
                    resourceId: user._id,
                    details: `Login attempt on rejected account`,
                    ipAddress: req.ip,
                    userAgent: req.headers?.['user-agent']
                });

                return res.status(403).json({
                    success: false,
                    message: 'Your registration has been rejected. Please contact an administrator.'
                });
            }

            // Audit log for inactive account login attempt
            await AuditLog.create({
                user: user._id,
                action: 'auth.inactive_account',
                resource: 'User',
                resourceId: user._id,
                details: `Login attempt on inactive account`,
                ipAddress: req.ip,
                userAgent: req.headers?.['user-agent']
            });

            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn('Login failed: incorrect password', { userId: user._id, username: user.username });

            // Audit log for failed login - incorrect password
            await AuditLog.create({
                user: user._id,
                action: 'auth.failed_login',
                resource: 'User',
                resourceId: user._id,
                details: `Failed login attempt - incorrect password`,
                ipAddress: req.ip,
                userAgent: req.headers?.['user-agent']
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        // Create audit log for successful login
        await AuditLog.create({
            user: user._id,
            action: 'user.login',
            resource: 'User',
            resourceId: user._id,
            details: `User logged in successfully`,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent']
        });

        const token = generateToken({
            id: user._id,
            username: user.username,
            role: user.role
        });

        let campusCode = null;
        if (user.campus) {
            // If campus is already a code (like MAR, ATW), use it directly
            if (['MAR', 'ATW', 'ATF', 'HSC'].includes(user.campus)) {
                campusCode = user.campus;
            } else {
                // Otherwise look up in Campus collection
                const Campus = require('../models/Campus');
                const campusDoc = await Campus.findOne({ name: user.campus });
                if (campusDoc) {
                    campusCode = campusDoc.code;
                }
            }
        }

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
                campusCode: campusCode,
college: user.college,
                approvalStatus: user.approvalStatus,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
        
        logger.info('Login successful', { userId: user._id, username: user.username, duration: Date.now() - startTime + 'ms' });
    } catch (error) {
        logger.error('Login error', { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
exports.register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, name, studentId, department, phone, campus, college, role, year, semester, gender } = req.body;

        console.log('[DEBUG] Registration request received:', { username, email, firstName, lastName, studentId, campus, college, role, year, semester, gender });

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
        const userRole = role || 'student';
        if (userRole !== 'superadmin') {
            if (!campus || !campus.trim()) {
                errors.push('Campus is required');
            }
        }

        // College validation - skip for technician
        if (college && userRole !== 'technician') {
            if (!/^[a-zA-Z\s&]+$/.test(college)) {
                errors.push('College/Institute can only contain letters, spaces, and &');
            }
        }

        // Password validation - simplified for technician
        if (!password || password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        // Student ID validation (only for students)
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
            gender,
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

        // Audit log for successful registration
        await AuditLog.create({
            user: savedUser._id,
            action: 'user.register',
            resource: 'User',
            resourceId: savedUser._id,
            details: `User registered successfully: ${savedUser.username} (${savedUser.role})`,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent']
        });

        res.status(201).json({
            success: true,
            message: 'Registration submitted! Your account is pending admin approval. You will be able to login once approved.'
        });
    } catch (error) {
        console.log('[DEBUG] Registration error:', error);

        // Audit log for registration failure
        await AuditLog.create({
            user: req.user ? req.user._id : null,
            action: 'user.register_failed',
            resource: 'User',
            details: `Registration failed: ${error.message}`,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent']
        }).catch(auditErr => {
            console.error('Failed to create audit log:', auditErr);
        });

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
            // Audit log for failed password reset attempt (email not found)
            await AuditLog.create({
                user: null,
                action: 'auth.password_reset_failed',
                resource: 'User',
                details: `Password reset request for non-existent email: ${email}`,
                ipAddress: req.ip,
                userAgent: req.headers?.['user-agent']
            });

            return res.json({
                success: true,
                message: 'If an account exists with this email, password reset instructions have been sent.'
            });
        }

        const resetToken = generateResetToken(user._id);
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 3600000);
        await user.save();

        // Audit log for password reset token generation
        await AuditLog.create({
            user: user._id,
            action: 'auth.password_reset_requested',
            resource: 'User',
            resourceId: user._id,
            details: `Password reset requested`,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent']
        });

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
            // Audit log for invalid/expired reset token
            await AuditLog.create({
                user: decoded?.id || null,
                action: 'auth.password_reset_failed',
                resource: 'User',
                details: `Invalid or expired password reset token`,
                ipAddress: req.ip,
                userAgent: req.headers?.['user-agent']
            });

            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Audit log for successful password reset
        await AuditLog.create({
            user: user._id,
            action: 'auth.password_reset_completed',
            resource: 'User',
            resourceId: user._id,
            details: `Password reset completed successfully`,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent']
        });

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

 // @route   POST /api/auth/find-user-for-reset
 // @desc    Find user by username for password reset
 // @access  Public
 exports.findUserForReset = async (req, res) => {
     try {
         const { username } = req.body;

         if (!username) {
             return res.status(400).json({ success: false, message: 'Username is required' });
         }

          // For superadmin, use EXACT case-sensitive match to avoid duplicate student username
          const isSuperAdminReset = username.toLowerCase() === 'asmamaw';
          let user;
          if (isSuperAdminReset) {
              user = await User.findOne({
                  username: 'asmamaw'  // Always lowercase for superadmin
              }).select('username firstName lastName phone role isActive');
          } else {
              // Case-insensitive for normal users
              user = await User.findOne({
                  username: { $regex: new RegExp('^' + username + '$', 'i') }
              }).select('username firstName lastName phone role isActive');
          }

         if (!user) {
             return res.status(404).json({ success: false, message: 'User not found' });
         }

         // Return user data (toJSON already removes password)
         res.json({
             success: true,
             user: user,
             phone: user.phone
         });
     } catch (error) {
         console.error('Find user error:', error);
         res.status(500).json({ success: false, message: 'Server error' });
     }
 };

 // @route   POST /api/auth/send-reset-code
 // @desc    Send verification code via SMS
 // @access  Public
 exports.sendResetCode = async (req, res) => {
     console.log('[SMS] Request received:', { phone: req.body.phone, username: req.body.username });

     try {
         const { phone, username } = req.body;

         let targetUser = null;
         let targetPhone = phone;

         // Special handling for superadmin password reset: always use configured phone
         const SUPERADMIN_PHONE = process.env.SUPERADMIN_PHONE;

          // If username provided, look up user
          if (username && !phone) {
              console.log(`[SMS] Looking up user by username: ${username}`);

              // For superadmin, use EXACT case-sensitive match to avoid duplicate student username
              const isSuperAdminReset = username.toLowerCase() === 'asmamaw';
              let targetUser;

              if (isSuperAdminReset) {
                  targetUser = await User.findOne({ username: 'asmamaw' });
              } else {
                  targetUser = await User.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
              }

              if (!targetUser) {
                  return res.status(404).json({ success: false, message: 'User not found' });
              }

             // Check if this is a superadmin reset - always use configured phone
             if (targetUser.role === 'superadmin' && SUPERADMIN_PHONE) {
                 console.log(`[SMS] Superadmin reset detected. Using configured phone: ${SUPERADMIN_PHONE}`);
                 targetPhone = SUPERADMIN_PHONE;
             } else {
                 targetPhone = targetUser.phone;
                 if (!targetPhone) {
                     return res.status(400).json({ success: false, message: 'User has no phone number on file' });
                 }
             }
         } else if (!phone) {
             return res.status(400).json({ success: false, message: 'Phone number or username required' });
         } else {
             // Phone provided directly - check if it's for a superadmin
             targetUser = await User.findOne({ phone });
             console.log(`[SMS] Looking up user by phone: ${phone}, found: ${targetUser ? 'yes' : 'no'}`);

             // If phone matches superadmin and we have configured phone, use that instead
             if (targetUser && targetUser.role === 'superadmin' && SUPERADMIN_PHONE) {
                 console.log(`[SMS] Superadmin reset detected. Overriding phone with configured: ${SUPERADMIN_PHONE}`);
                 targetPhone = SUPERADMIN_PHONE;
             }
         }

         // Generate 6-digit code
         const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
         console.log(`[SMS] Generated verification code for ${targetPhone}: ${verificationCode}`);

         // Store code on user (if user found)
         if (targetUser) {
             targetUser.verificationCode = verificationCode;
             targetUser.verificationCodeExpires = new Date(Date.now() + 600000); // 10 minutes
             targetUser.phoneResetVerified = false;
             targetUser.phoneResetVerifiedExpires = undefined;
             await targetUser.save();
             console.log(`[SMS] Verification code stored for user ${targetUser._id}`);
         }

         // Format phone number for Twilio (E.164 format)
         const formatPhoneForTwilio = (num) => {
             let cleaned = num.replace(/[^\d+]/g, '');
             if (cleaned.startsWith('0')) {
                 cleaned = '+251' + cleaned.substring(1);
             } else if (cleaned.startsWith('9') && !cleaned.startsWith('+')) {
                 cleaned = '+251' + cleaned;
             } else if (cleaned.startsWith('251') && !cleaned.startsWith('+')) {
                 cleaned = '+' + cleaned;
             }
             return cleaned;
         };

         const formattedPhone = formatPhoneForTwilio(targetPhone);
         console.log(`[SMS] Original phone: ${targetPhone}, formatted: ${formattedPhone}`);

         // Send SMS via Twilio
         let smsSent = false;
         let smsError = null;
         try {
             const twilio = require('twilio');
             const accountSid = process.env.TWILIO_ACCOUNT_SID;
             const authToken = process.env.TWILIO_AUTH_TOKEN;
             const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

             console.log('[SMS] Twilio config:', {
                 hasSid: !!accountSid,
                 hasToken: !!authToken,
                 hasMessagingService: !!messagingServiceSid
             });

             if (accountSid && authToken && messagingServiceSid) {
                 const client = twilio(accountSid, authToken);
                 const message = await client.messages.create({
                     body: `Your verification code is: ${verificationCode}. Valid for 10 minutes.`,
                     messagingServiceSid: messagingServiceSid,
                     to: formattedPhone
                 });
                 console.log(`[SMS] Message sent successfully. SID: ${message.sid}, To: ${formattedPhone}`);
                 smsSent = true;
             } else {
                 smsError = 'Twilio credentials not configured on server';
                 console.error('[SMS] CRITICAL: Twilio credentials missing!');
                 console.error('[SMS] TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING');
                 console.error('[SMS] TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING');
                 console.error('[SMS] TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? 'SET' : 'MISSING');
             }
         } catch (smsErr) {
             smsError = smsErr.message;
             console.error('[SMS] Twilio error:', {
                 message: smsErr.message,
                 code: smsErr.code,
                 status: smsErr.status,
                 moreInfo: smsErr.moreInfo
             });
         }

         if (!smsSent) {
             return res.status(500).json({
                 success: false,
                 message: `Failed to send verification SMS: ${smsError}`,
                 phone: targetPhone,
                 debugCode: verificationCode // Only in dev mode
             });
         }

         console.log('[SMS] Response sent successfully to client');
         res.json({
             success: true,
             message: 'Verification code sent to ' + targetPhone,
             phone: targetPhone,
             username: targetUser ? targetUser.username : null
         });
     } catch (error) {
         console.error('[SMS] Unexpected error:', error);
         res.status(500).json({ success: false, message: 'Server error during SMS sending' });
     }
 };

 // @route   POST /api/auth/verify-reset-code
 // @desc    Verify reset code (by phone or username)
 // @access  Public
 exports.verifyResetCode = async (req, res) => {
     try {
         const { phone, code, username } = req.body;

         let user = null;

         // Try to find user by phone first, then by username
         if (phone) {
             user = await User.findOne({
                 phone,
                 verificationCode: code,
                 verificationCodeExpires: { $gt: new Date() }
             });
         }

          if (!user && username) {
              // For superadmin, use EXACT case-sensitive match to avoid duplicate student username
              const isSuperAdminReset = username.toLowerCase() === 'asmamaw';
              let userQuery;

              if (isSuperAdminReset) {
                  userQuery = User.findOne({
                      username: 'asmamaw',
                      verificationCode: code,
                      verificationCodeExpires: { $gt: new Date() }
                  });
              } else {
                  userQuery = User.findOne({
                      username: { $regex: new RegExp('^' + username + '$', 'i') },
                      verificationCode: code,
                      verificationCodeExpires: { $gt: new Date() }
                  });
              }

              user = await userQuery;
          }

         if (!user) {
             return res.status(400).json({ success: false, message: 'Invalid or expired code' });
         }

         user.phoneResetVerified = true;
         user.phoneResetVerifiedExpires = new Date(Date.now() + 600000); // 10 minutes
         user.verificationCode = undefined;
         user.verificationCodeExpires = undefined;
         await user.save();

         res.json({ success: true, message: 'Code verified successfully' });
     } catch (error) {
         console.error('Verify code error:', error);
         res.status(500).json({ success: false, message: 'Server error' });
     }
 };

 // @route   POST /api/auth/reset-password-by-phone
 // @desc    Reset password by phone number or username
 // @access  Public
 exports.resetPasswordByPhone = async (req, res) => {
     try {
         const { phone, newPassword, username } = req.body;

         if (!phone && !username) {
             return res.status(400).json({ success: false, message: 'Phone number or username required' });
         }

         if (!newPassword) {
             return res.status(400).json({ success: false, message: 'New password is required' });
         }

         if (newPassword.length < 6) {
             return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
         }

         let user = null;

          // Find user by phone or username
          if (phone) {
              user = await User.findOne({ phone });
          } else if (username) {
              // For superadmin, use EXACT case-sensitive match to avoid duplicate student username
              const isSuperAdminReset = username.toLowerCase() === 'asmamaw';
              if (isSuperAdminReset) {
                  user = await User.findOne({ username: 'asmamaw' });
              } else {
                  user = await User.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
              }
          }

         if (!user) {
             return res.status(404).json({ success: false, message: 'User not found' });
         }

         if (!user.phoneResetVerified || !user.phoneResetVerifiedExpires || user.phoneResetVerifiedExpires <= new Date()) {
             return res.status(400).json({
                 success: false,
                 message: 'Verification required before resetting password'
             });
         }

         // Update password
         user.password = newPassword;
         user.verificationCode = undefined;
         user.verificationCodeExpires = undefined;
         user.phoneResetVerified = false;
         user.phoneResetVerifiedExpires = undefined;
         await user.save();

         res.json({ success: true, message: 'Password reset successfully' });
     } catch (error) {
         console.error('Reset password error:', error);
         res.status(500).json({ success: false, message: 'Server error' });
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
            // Audit log for failed password change attempt
            await AuditLog.create({
                user: req.user._id,
                action: 'auth.password_change_failed',
                resource: 'User',
                resourceId: user._id,
                details: `Failed password change - incorrect current password`,
                ipAddress: req.ip,
                userAgent: req.headers?.['user-agent']
            });

            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        // Audit log for successful password change
        await AuditLog.create({
            user: req.user._id,
            action: 'auth.password_changed',
            resource: 'User',
            resourceId: user._id,
            details: `Password changed successfully`,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent']
        });

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

        // Audit log for profile photo upload
        await AuditLog.create({
            user: req.user._id,
            action: 'user.photo_uploaded',
            resource: 'User',
            resourceId: user._id,
            details: `Profile photo uploaded`,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent']
        });

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
