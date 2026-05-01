# SMTP Email Configuration for Password Reset

## Current Setup Applied

The email utility has been updated to work with Gmail SMTP. Here's what you need to configure:

## Adding Gmail SMTP to Your .env File

Add these lines to your `backend/.env` file:

```
# Gmail SMTP Settings (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=asmamawdegu6@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:5173
```

## Important: How to Get Gmail App Password

Since Google doesn't allow regular passwords for SMTP, you need an **App Password**:

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security**
3. Enable **2-Step Verification** (if not enabled)
4. Go to https://myaccount.google.com/apppasswords
5. Search/select "Mail"
6. Copy the 16-character app password (e.g., `abcd efgh ijkl mnop`)

Use this app password as `SMTP_PASS` (without spaces).

## Testing

After adding to .env, restart your backend server. The console will show:

```
[Email] Sending password reset to: your-email@example.com
[Email] Reset URL: http://localhost:5173/reset-password?token=xxx
[Email] Password reset email sent successfully!
```

## Fallback Behavior

If SMTP is not configured, the system still works by logging the password reset link to the backend console - you can copy/paste it into your browser.

## Complete .env Example

Here's a template for your backend/.env:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/clm

# JWT
JWT_SECRET=your_jwt_secret_here

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=asmamawdegu6@gmail.com
SMTP_PASS=your_16_char_app_password
FRONTEND_URL=http://localhost:5173

# Twilio (optional - for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=your_service_sid
TWILIO_PHONE_NUMBER=+1234567890
