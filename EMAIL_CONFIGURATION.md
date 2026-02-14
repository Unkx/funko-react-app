# Email Service Configuration Guide

## Current Issues

Your server is experiencing email service failures:
- ❌ `ECONNREFUSED` - Connection refused to Gmail SMTP server
- ❌ `ESOCKET` - SSL/TLS certificate issues  
- ❌ Missing/Invalid credentials in environment variables

## Solution: Configure Email Service

### Option 1: Gmail (Recommended for Production)

Gmail requires an **app-specific password**, not your regular account password.

**Steps:**

1. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification" and follow the setup

2. **Create an App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password

3. **Update `.env` file** in `backend/` directory:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```

4. **Restart your server** - Email should now work ✅

### Option 2: Ethereal (Testing Only)

For development/testing, use fictional email service Ethereal:

```env
EMAIL_SERVICE=ethereal
EMAIL_USER=
EMAIL_PASSWORD=
```

When the server starts, it will:
- Create temporary test credentials
- Display test account email address in logs
- All test emails are viewable at [https://ethereal.email](https://ethereal.email)

### What Changed

Your server.js was updated to:
1. ✅ Check if email credentials are configured before startup
2. ✅ Show helpful warnings instead of crashing
3. ✅ Support Ethereal test accounts for development
4. ✅ Return HTTP 503 (unavailable) instead of 500 when email fails
5. ✅ Handle email errors gracefully without crashing password reset

### Verification

After configuring, restart the server. You should see:

```
✅ Email service ready
```

**Not configured:**
```
⚠️ Email service not configured: EMAIL_USER or EMAIL_PASSWORD environment variables missing
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Check EMAIL_USER matches your Gmail address |
| `Invalid credentials` | Generate a NEW app password, don't use account password |
| `self-signed certificate` | This is fixed by using proper app passwords |
| `Connection timeout` | Check internet connection and Gmail SMTP server availability |

## Environment Variables Reference

```
EMAIL_SERVICE       - Service provider (gmail, ethereal, etc.)
EMAIL_USER          - Your email address or test account
EMAIL_PASSWORD      - App password (16 chars for Gmail) or test password
FRONTEND_URL        - Frontend domain for password reset links
```

## Testing Password Reset

1. Register a new user account
2. Go to login page → "Forgot Password?"
3. Enter your test email
4. Check your email for reset code (Gmail inbox or Ethereal test email)
5. Use code to reset password

---

**Need more help?** Check the server logs for specific error messages.
