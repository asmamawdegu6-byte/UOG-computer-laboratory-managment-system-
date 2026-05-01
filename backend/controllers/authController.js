const User = require('../models/User');
const { generateToken, generateResetToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const AuditLog = require('../models/AuditLog');

const SUPERADMIN_USERNAME = 'asmamaw';
const DEFAULT_SUPERADMIN_PHONE = '0928886341';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSuperAdminResetPhone = () => process.env.SUPERADMIN_PHONE || DEFAULT_SUPERADMIN_PHONE;

const isSuperAdminUsername = (username = '') => username.trim().toLowerCase() === SUPERADMIN_USERNAME;

const findUserByResetUsername = (username) => {
    const trimmedUsername = username.trim();

    if (isSuperAdminUsername(trimmedUsername)) {
        return User.findOne({ username: SUPERADMIN_USERNAME });
    }

    return User.findOne({
        username: { $regex: new RegExp('^' + escapeRegex(trimmedUsername) + '$', 'i') }
    });
};

const getPhoneVariants = (phone = '') => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    const digits = cleaned.replace(/\D/g, '');
    const variants = new Set([phone, cleaned]);

    if (digits.startsWith('0')) {
        variants.add('+251' + digits.substring(1));
        variants.add('251' + digits.substring(1));
    } else if (digits.startsWith('251')) {
        variants.add('0' + digits.substring(3));
        variants.add('+' + digits);
    } else if (digits.startsWith('9')) {
        variants.add('0' + digits);
        variants.add('+251' + digits);
        variants.add('251' + digits);
    }

    return [...variants].filter(Boolean);
};

const formatPhoneForTwilio = (phone = '') => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '+251' + cleaned.substring(1);
    } else if (cleaned.startsWith('9') && !cleaned.startsWith('+')) {
        cleaned = '+251' + cleaned;
    } else if (cleaned.startsWith('251') && !cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    return cleaned;
};

const findUserByResetPhone = (phone) => User.findOne({ phone: { $in: getPhoneVariants(phone) } });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getTwilioFailureMessage = (message) => {
    if (message.errorCode === 21608) {
        return 'Twilio trial account cannot send to this unverified phone number. Verify 0928886341 in the Twilio console or upgrade the Twilio account.';
    }

    if (message.errorCode === 21704) {
        return 'Twilio Messaging Service has no sender phone number. Add an SMS-capable sender to the Messaging Service or set TWILIO_PHONE_NUMBER in backend/.env.';
    }

    if (message.errorCode) {
        return `Twilio delivery failed with error ${message.errorCode}${message.errorMessage ? `: ${message.errorMessage}` : ''}`;
    }

    return null;
};

const sendTwilioSms = async ({ to, body }) => {
    const twilio = require('twilio');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const from = process.env.TWILIO_PHONE_NUMBER;

    console.log('[SMS] Twilio config:', {
        hasSid: !!accountSid,
        hasToken: !!authToken,
        hasMessagingService: !!messagingServiceSid,
        hasFromNumber: !!from
    });

    if (!accountSid || !authToken || (!messagingServiceSid && !from)) {
        throw new Error('Twilio credentials are missing. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID.');
    }

    const client = twilio(accountSid, authToken);
    const messagePayload = {
        body,
        to
    };

    if (from) {
        messagePayload.from = from;
    } else {
        messagePayload.messagingServiceSid = messagingServiceSid;
    }

    const message = await client.messages.create(messagePayload);
    console.log(`[SMS] Message accepted by Twilio. SID: ${message.sid}, initial status: ${message.status}, To: ${to}`);

    // Messaging Service configuration errors can appear after Twilio initially
    // accepts the request. Poll briefly so the UI does not show a false success.
    let latestMessage = message;
    for (let attempt = 0; attempt < 4; attempt++) {
        await delay(2000);
        latestMessage = await client.messages(message.sid).fetch();
        console.log(`[SMS] Delivery check ${attempt + 1}: ${latestMessage.status}${latestMessage.errorCode ? ` (${latestMessage.errorCode})` : ''}`);

        if (['failed', 'undelivered', 'delivered', 'sent'].includes(latestMessage.status)) {
            break;
        }
    }

    const failureMessage = getTwilioFailureMessage(latestMessage);
    if (['failed', 'undelivered'].includes(latestMessage.status) || failureMessage) {
        const error = new Error(failureMessage || `Twilio message ${latestMessage.status}`);
        error.code = latestMessage.errorCode;
        error.status = latestMessage.status;
        error.sid = latestMessage.sid;
        throw error;
    }

    return latestMessage;
};

const getTwilioClient = () => {
    const twilio = require('twilio');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        throw new Error('Twilio credentials are missing. Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }

    return twilio(accountSid, authToken);
};

const sendTwilioVerification = async (to) => {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceSid) {
        return null;
    }

    const verification = await getTwilioClient()
        .verify
        .v2
        .services(serviceSid)
        .verifications
        .create({ to, channel: 'sms' });

    console.log(`[SMS] Twilio Verify started. SID: ${verification.sid}, status: ${verification.status}, To: ${to}`);
    return verification;
};

const getTwilioErrorMessage = (error) => {
    if (error.code === 21608) {
        return 'Twilio trial account cannot send to this unverified phone number. Verify 0928886341 in the Twilio console or upgrade the Twilio account.';
    }

    if (error.code === 21704) {
        return 'Twilio Messaging Service has no sender phone number. Add an SMS-capable sender to the Messaging Service or set TWILIO_PHONE_NUMBER in backend/.env.';
    }

    return error.message;
};

const checkTwilioVerification = async ({ to, code }) => {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceSid) {
        return null;
    }

    const verificationCheck = await getTwilioClient()
        .verify
        .v2
        .services(serviceSid)
        .verificationChecks
        .create({ to, code });

    console.log(`[SMS] Twilio Verify check. status: ${verificationCheck.status}, To: ${to}`);
    return verificationCheck;
};

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
        console.error('[Login] Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
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
        
        console.log('[ForgotPassword] Request received:', { email });
        console.log('[ForgotPassword] Body:', req.body);

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
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
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

         const user = await findUserByResetUsername(username)
             .select('username firstName lastName phone role isActive');

         if (!user) {
             return res.status(404).json({ success: false, message: 'User not found' });
         }

         // Return user data (toJSON already removes password)
         res.json({
             success: true,
             user: user,
             phone: user.role === 'superadmin' ? getSuperAdminResetPhone() : user.phone
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

          // If username provided, look up user. For superadmin, username always wins
          // so the reset code is stored on the superadmin account while the SMS is
          // sent to the configured recovery phone.
          if (username) {
              console.log(`[SMS] Looking up user by username: ${username}`);

              targetUser = await findUserByResetUsername(username);

              if (!targetUser) {
                  return res.status(404).json({ success: false, message: 'User not found' });
              }

             // Check if this is a superadmin reset - always use configured phone
             if (targetUser.role === 'superadmin') {
                 targetPhone = getSuperAdminResetPhone();
                 console.log(`[SMS] Superadmin reset detected. Using configured phone: ${targetPhone}`);
             } else {
                 targetPhone = phone || targetUser.phone;
                 if (!targetPhone) {
                     return res.status(400).json({ success: false, message: 'User has no phone number on file' });
                 }
             }
         } else if (!phone) {
             return res.status(400).json({ success: false, message: 'Phone number or username required' });
         } else {
             // Phone provided directly - check if it's for a superadmin
             targetUser = await findUserByResetPhone(phone);
             console.log(`[SMS] Looking up user by phone: ${phone}, found: ${targetUser ? 'yes' : 'no'}`);

             // If phone matches superadmin and we have configured phone, use that instead
             if (targetUser && targetUser.role === 'superadmin') {
                 targetPhone = getSuperAdminResetPhone();
                 console.log(`[SMS] Superadmin reset detected. Overriding phone with configured: ${targetPhone}`);
             }
         }

         const formattedPhone = formatPhoneForTwilio(targetPhone);
         console.log(`[SMS] Original phone: ${targetPhone}, formatted: ${formattedPhone}`);

         if (process.env.TWILIO_VERIFY_SERVICE_SID) {
             if (!targetUser) {
                 return res.status(404).json({ success: false, message: 'User not found for this phone number' });
             }

             try {
                 targetUser.verificationCode = undefined;
                 targetUser.verificationCodeExpires = undefined;
                 targetUser.phoneResetVerified = false;
                 targetUser.phoneResetVerifiedExpires = undefined;
                 await targetUser.save();

                 await sendTwilioVerification(formattedPhone);

                 return res.json({
                     success: true,
                     message: 'Verification code sent to ' + targetPhone,
                     phone: targetPhone,
                     username: targetUser.username
                 });
             } catch (smsErr) {
                 console.error('[SMS] Twilio Verify error:', {
                     message: smsErr.message,
                     code: smsErr.code,
                     status: smsErr.status,
                     moreInfo: smsErr.moreInfo
                 });

                 return res.status(500).json({
                     success: false,
                     message: `Failed to send verification SMS: ${getTwilioErrorMessage(smsErr)}`,
                     phone: targetPhone,
                     twilioStatus: smsErr.status,
                     twilioErrorCode: smsErr.code
                 });
             }
         }

         // Generate 6-digit code for direct Programmable Messaging fallback.
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

         // Send SMS via Twilio
         let smsSent = false;
         let smsError = null;
         let smsErrorCode = null;
         let smsStatus = null;
         try {
             const message = await sendTwilioSms({
                 body: `Your verification code is: ${verificationCode}. Valid for 10 minutes.`,
                 to: formattedPhone
             });
             console.log(`[SMS] Message sent successfully. SID: ${message.sid}, status: ${message.status}, To: ${formattedPhone}`);
             smsSent = true;
         } catch (smsErr) {
             smsError = smsErr.message;
             smsErrorCode = smsErr.code;
             smsStatus = smsErr.status;
             console.error('[SMS] Twilio error:', {
                 message: smsErr.message,
                 code: smsErr.code,
                 status: smsErr.status,
                 moreInfo: smsErr.moreInfo
             });
         }

         if (!smsSent) {
             if (targetUser) {
                 targetUser.verificationCode = undefined;
                 targetUser.verificationCodeExpires = undefined;
                 targetUser.phoneResetVerified = false;
                 targetUser.phoneResetVerifiedExpires = undefined;
                 await targetUser.save();
             }

             return res.status(500).json({
                 success: false,
                 message: `Failed to send verification SMS: ${smsError}`,
                 phone: targetPhone,
                 twilioStatus: smsStatus,
                 twilioErrorCode: smsErrorCode
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

         if (process.env.TWILIO_VERIFY_SERVICE_SID) {
             if (username) {
                 user = await findUserByResetUsername(username);
             } else if (phone) {
                 user = await findUserByResetPhone(phone);
             }

             if (!user) {
                 return res.status(400).json({ success: false, message: 'Invalid or expired code' });
             }

             const targetPhone = user.role === 'superadmin'
                 ? getSuperAdminResetPhone()
                 : (phone || user.phone);
             const formattedPhone = formatPhoneForTwilio(targetPhone);

             try {
                 const verificationCheck = await checkTwilioVerification({
                     to: formattedPhone,
                     code
                 });

                 if (!verificationCheck || verificationCheck.status !== 'approved') {
                     return res.status(400).json({ success: false, message: 'Invalid or expired code' });
                 }

                 user.phoneResetVerified = true;
                 user.phoneResetVerifiedExpires = new Date(Date.now() + 600000); // 10 minutes
                 user.verificationCode = undefined;
                 user.verificationCodeExpires = undefined;
                 await user.save();

                 return res.json({ success: true, message: 'Code verified successfully' });
             } catch (verifyErr) {
                 console.error('[SMS] Twilio Verify check error:', {
                     message: verifyErr.message,
                     code: verifyErr.code,
                     status: verifyErr.status,
                     moreInfo: verifyErr.moreInfo
                 });

                 return res.status(400).json({ success: false, message: 'Invalid or expired code' });
             }
         }

         // Prefer username because superadmin SMS is sent to a configured phone
         // that may not exactly match the phone stored on the user document.
         if (username) {
             user = await findUserByResetUsername(username);

             if (
                 !user ||
                 user.verificationCode !== code ||
                 !user.verificationCodeExpires ||
                 user.verificationCodeExpires <= new Date()
             ) {
                 user = null;
             }
         }

         if (!user && phone) {
             user = await User.findOne({
                 phone: { $in: getPhoneVariants(phone) },
                 verificationCode: code,
                 verificationCodeExpires: { $gt: new Date() }
             });
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

          // Prefer username because superadmin resets send the SMS to a configured
          // recovery phone that may not exactly match the database phone format.
          if (username) {
              user = await findUserByResetUsername(username);
          } else if (phone) {
              user = await findUserByResetPhone(phone);
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

// @route   POST /api/auth/send-email-code
// @desc    Send verification code via email
// @access  Public
exports.sendEmailCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        
        // Even if user doesn't exist, show success to prevent email enumeration
        if (!user) {
            return res.json({ 
                success: true, 
                message: 'If an account exists with this email, verification code has been sent.' 
            });
        }

        // Generate 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(Date.now() + 600000); // 10 minutes
        await user.save();

        // Import the email function
        const { sendVerificationCodeEmail } = require('../utils/email');
        await sendVerificationCodeEmail(user.email, verificationCode, user.username);

res.json({ 
            success: true, 
            message: 'Verification code sent to your email',
            // For development: include code (remove in production)
            ...(process.env.NODE_ENV !== 'production' && { code: verificationCode }),
            // Also include code when NODE_ENV is undefined (development default)
            ...((!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && { code: verificationCode })
        });
    } catch (error) {
        console.error('Send email code error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   POST /api/auth/verify-email-code
// @desc    Verify email code
// @access  Public
exports.verifyEmailCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Email and code are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ 
            email: normalizedEmail,
            verificationCode: code,
            verificationCodeExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired code' });
        }

        // Mark as verified for email reset
        user.emailResetVerified = true;
        user.emailResetVerifiedExpires = new Date(Date.now() + 600000); // 10 minutes
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Code verified successfully' });
    } catch (error) {
        console.error('Verify email code error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @route   POST /api/auth/reset-password-by-email
// @desc    Reset password by email verification
// @access  Public
exports.resetPasswordByEmail = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            console.log(`[ResetPassword] User not found for email: ${normalizedEmail}`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log(`[ResetPassword] User found: ${user.username}, verified: ${user.emailResetVerified}`);

        if (!user.emailResetVerified || !user.emailResetVerifiedExpires || user.emailResetVerifiedExpires <= new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Verification required before resetting password. Please verify the code again.' 
            });
        }

        // Update password
        user.password = newPassword;
        user.emailResetVerified = undefined;
        user.emailResetVerifiedExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password by email error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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

        const photoUrl = `/uploads/profiles/${req.file.filename}`;
        user.photoUrl = photoUrl;
        await user.save();

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
