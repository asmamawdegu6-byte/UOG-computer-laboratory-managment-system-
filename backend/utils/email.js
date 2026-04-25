const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Password reset token
 * @param {string} username - Username
 */
const sendPasswordResetEmail = async (email, resetToken, username) => {
    // For development, just log the reset link
    if (process.env.NODE_ENV !== 'production') {
        console.log('Password Reset Link:');
        console.log(`http://localhost:5173/reset-password?token=${resetToken}`);
        return { success: true };
    }

    try {
        const transporter = createTransporter();
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
        <h2>Password Reset</h2>
        <p>Hello ${username},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
        });

        return { success: true };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail
};
