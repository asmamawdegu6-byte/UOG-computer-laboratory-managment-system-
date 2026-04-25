# SuperAdmin Password Reset SMS Fix

## Problem
When entering superadmin username "Asmamaw" and clicking Reset Password, the system was sending the verification code to the phone number stored in the database (0938343445) instead of the configured superadmin phone number (0928886341).

## Root Cause
The `sendResetCode` endpoint was using the user's stored phone number without checking if it was a superadmin reset. There was no way to override the destination phone number.

## Solution

### 1. Environment Variables
Added to `.env` files:
```env
# Backend (.env)
SUPERADMIN_PHONE=0928886341

# Frontend (.env)
VITE_SUPERADMIN_PHONE=0928886341
```

### 2. Backend Changes (`backend/controllers/authController.js`)

#### sendResetCode (lines 559-693)
- Added logic to detect superadmin role and override destination phone
- Reads `process.env.SUPERADMIN_PHONE`
- Formats phone numbers to E.164 format for Twilio (+251928886341)
- Improved error handling with detailed logging
- Returns proper HTTP 500 when SMS fails (instead of fake success)

**Phone number flow:**
```javascript
if (targetUser.role === 'superadmin' && SUPERADMIN_PHONE) {
    targetPhone = SUPERADMIN_PHONE; // Override!
}
```

#### verifyResetCode (lines 695-736)
- Now accepts `username` in addition to `phone`
- Tries phone lookup first, falls back to username lookup
- This is necessary because superadmin verification uses a different phone than stored in DB

#### resetPasswordByPhone (lines 738-772)
- Now accepts `username` in addition to `phone`
- Finds user by either phone or username
- Allows superadmin reset even when phone mismatch

### 3. Frontend Changes (`frontend/src/pages/auth/Login.jsx`)

#### Updated forgot password flow:
1. Enter username → call `findUserForReset` (just to validate user exists)
2. Call `sendResetCode` with **only `username`** (no phone)
3. Display message using `VITE_SUPERADMIN_PHONE` (not user's stored phone)
4. Verify step: send `{ phone: superAdminPhone, username, code }`
5. Reset step: send `{ phone: superAdminPhone, username, newPassword }`

#### Key changes:
```javascript
const superAdminPhone = import.meta.env.VITE_SUPERADMIN_PHONE || '0928886341';

// Step 1: Find user
const findResponse = await api.post('/auth/find-user-for-reset', { username: forgotUsername });
setFoundUser(user);

// Step 2: Send code (username only, backend picks phone)
const codeResponse = await api.post('/auth/send-reset-code', { username: forgotUsername });

// Step 3: Verify (send both phone for logging + username for lookup)
const response = await api.post('/auth/verify-reset-code', {
  phone: superAdminPhone,
  username: forgotUsername,
  code: verificationCode
});

// Step 4: Reset password
const response = await api.post('/auth/reset-password-by-phone', {
  phone: superAdminPhone,
  username: forgotUsername,
  newPassword
});
```

### 4. Database Seed Update (`backend/server.js:165`)
Added phone to superadmin user:
```javascript
phone: '+251928886341'  // E.164 format
```

## Testing

### 1. Restart servers
```bash
# Backend (loads new .env)
cd backend && npm run dev

# Frontend (loads new VITE_ env vars)
cd frontend && npm run dev
```

### 2. Test Flow
1. Go to login page
2. Click "Forgot Password?"
3. Enter username: `Asmamaw` (case-insensitive)
4. Click "Reset Password"
5. **Should see:** "Verification code sent to 0928886341" (not 0938343445)
6. Check phone for SMS with 6-digit code
7. Enter code → Click "Verify Code"
8. Enter new password → Click "Reset Password"
9. Success: "Password reset successfully!"

### 3. Check Backend Logs
Look for `[SMS]` prefixed logs:
```
[SMS] Request received: { phone: undefined, username: 'Asmamaw' }
[SMS] Looking up user by username: Asmamaw
[SMS] Found user: asmamaw, phone: +251928886341
[SMS] Superadmin reset detected. Using configured phone: 0928886341
[SMS] Original phone: 0928886341, formatted: +251928886341
[SMS] Message sent successfully. SID: MG...
```

If Twilio fails, you'll see:
- Credentials missing
- Invalid number format
- Account suspended
- etc.

### 4. Verify in Database
After SMS is sent, check user document:
```javascript
db.users.findOne({username: 'asmamaw'})
```
Should have:
- `verificationCode: "123456"` (6 digits)
- `phoneResetVerified: false`
- `verificationCodeExpires: <date 10 min from now>`

After verification:
- `phoneResetVerified: true`
- `verificationCode: undefined`

After reset:
- Password hash changed
- All reset fields cleared

## Common Issues & Solutions

| Symptom | Cause | Fix |
|---------|-------|-----|
| Still sends to 0938343445 | Backend using old code | Restart backend server |
| Phone shows env fallback '0928886341' but no SMS | Twilio credentials missing | Check `.env` has TWILIO_* vars |
| SMS fails with "invalid number" | Phone format wrong | Ensure phone stored as `+251928886341` for superadmin |
| Verification fails (code invalid) | Username mismatch | Verify `forgotUsername` matches exactly (case-insensitive) |
| No code received, but success message | Twilio sandbox/blocked | Check Twilio console → Messaging → Service → Geo Permissions ( Ethiopia must be enabled ) |
| Error 21610 | Destination blocked | Unblock number in Twilio console |
| Error 21608 | Country not enabled | Enable SMS to Ethiopia in Twilio console |

## Files Modified
1. `backend/.env` + `backend/.env.example`
2. `frontend/.env` + `frontend/.env.example`
3. `backend/controllers/authController.js` - sendResetCode, verifyResetCode, resetPasswordByPhone
4. `backend/server.js` - Added phone to superadmin seed
5. `frontend/src/pages/auth/Login.jsx` - Forgot password flow
6. `frontend/src/pages/auth/PreLoginReset.jsx` - Fixed state bug

## New Test Script
```bash
node backend/scripts/testSMS.js
```
Tests Twilio configuration independently of the app.
