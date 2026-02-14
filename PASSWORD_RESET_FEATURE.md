# Password Reset Feature - Implementation Guide

## Overview
A complete password reset feature has been implemented with:
- **Email-based code verification** (6-digit code sent to user's email)
- **Multi-step reset flow**: Email → Code Verification → Password Reset
- **Code expiration** (15 minutes)
- **Multi-language support** (EN, PL, RU, ES, FR, DE)
- **Dark mode support**

## Backend Implementation

### 1. Database Table
A new table `password_reset_codes` was created to store reset codes:
```sql
CREATE TABLE password_reset_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ
);
```

### 2. Backend Endpoints

#### `POST /api/forgot-password`
Initiates password reset and sends code to email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If that email address is in our system, we have sent a password reset code"
}
```

#### `POST /api/verify-reset-code`
Verifies the reset code validity.

**Request:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Reset code is valid",
  "userId": 1
}
```

#### `POST /api/reset-password`
Resets the user's password.

**Request:**
```json
{
  "code": "123456",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully. Please log in with your new password."
}
```

### 3. Email Setup

The feature uses Nodemailer for sending emails. Configure the following environment variables in `.env`:

```env
# Email Service Provider (gmail, outlook, etc.)
EMAIL_SERVICE=gmail

# Email account credentials
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use app password for Gmail

# Frontend URL (for password reset links in emails)
FRONTEND_URL=http://localhost:5173
```

#### Gmail Setup (Recommended)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to myaccount.google.com
   - Navigate to Security
   - Create App Password for "Mail" and "Windows Computer"
   - Use this password as `EMAIL_PASSWORD`

#### Other Email Providers
The feature supports any SMTP-enabled email service. Modify the transporter config in `backend/server.js` line 26-32 if needed.

## Frontend Implementation

### 1. Password Reset Form Component
Located in [src/LoginRegisterSite.tsx](src/LoginRegisterSite.tsx)

Three-step form:
1. **Email Entry** - User enters their email
2. **Code Verification** - 6-digit code sent to email
3. **Password Reset** - Set new password

### 2. Translations
Password reset strings added to [src/Translations/TranslationsLogIn.tsx](src/Translations/TranslationsLogIn.tsx):
- `forgotPassword` - "Forgot your password?" button
- `forgotPasswordTitle` - Form title
- `enterEmail` - Email input placeholder
- `sendCode` - Button label
- And more... (see translations file for all keys)

Supported languages: EN, PL, RU, ES, FR, DE

## Installation & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

This installs `nodemailer` (if not already installed).

### 2. Configure Environment Variables
Create `.env` file in `backend` folder:
```bash
cp backend/.env.example backend/.env
```

Edit `.env` and fill in your email credentials:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

### 3. Run Backend
```bash
cd backend
npm start
```

## Usage Flow

### User Side
1. On login page, click **"Forgot your password?"**
2. Enter email address → Receive 6-digit code via email
3. Enter the code → System verifies validity
4. Set new password → Success message
5. Return to login with new credentials

### Admin/Developer Side
- Reset codes are stored in database
- Codes expire after 15 minutes
- Each code can only be used once
- Old codes are automatically deleted when new reset is requested

## Security Features

✅ **Secure Code Generation** - Uses cryptographic random integers  
✅ **Code Expiration** - 15-minute validity window  
✅ **Single Use** - Codes marked as used after password reset  
✅ **Cascade Delete** - Reset codes deleted if user account is deleted  
✅ **Email Verification** - Code sent only to registered email  
✅ **Password Hashing** - New password hashed before storage  
✅ **No User Enumeration** - Same response whether email exists or not  

## Troubleshooting

### Emails Not Sending
1. Check email credentials in `.env`
2. For Gmail: Use App Password, not regular password
3. Check backend logs for email service errors
4. Verify `nodemailer` is installed: `npm list nodemailer`

### Code Not Received
1. Check spam/junk folder
2. Verify email address in database
3. Check backend server logs
4. Ensure `EMAIL_SERVICE` is set correctly

### Database Errors
1. Ensure `password_reset_codes` table exists (created on server start)
2. Check PostgreSQL is running
3. Verify database connection settings in `.env`

## Database Cleanup (Optional)
To manually clean up expired codes:
```sql
DELETE FROM password_reset_codes 
WHERE expires_at < NOW() AND used = FALSE;
```

## Files Changed

- **Backend:**
  - [backend/server.js](backend/server.js) - Added endpoints & email setup
  - [backend/package.json](backend/package.json) - Added nodemailer dependency
  - [backend/.env.example](backend/.env.example) - Environment template

- **Frontend:**
  - [src/LoginRegisterSite.tsx](src/LoginRegisterSite.tsx) - Added password reset UI
  - [src/Translations/TranslationsLogIn.tsx](src/Translations/TranslationsLogIn.tsx) - Added translations

## Testing

### Test with Mailtrap (Free Email Testing Service)
1. Sign up at mailtrap.io
2. Get SMTP credentials
3. Use in `.env`:
   ```env
   EMAIL_SERVICE=smtp
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=465
   EMAIL_USER=your_mailtrap_user
   EMAIL_PASSWORD=your_mailtrap_pass
   ```

### Manual Testing Steps
1. Go to login page
2. Click "Forgot your password?"
3. Enter test email
4. Check email for 6-digit code
5. Enter code
6. Set new password
7. Attempt login with new password

## Future Enhancements

- [ ] Password reset via security questions
- [ ] SMS-based code delivery
- [ ] Resend code functionality
- [ ] Password strength indicators
- [ ] Account recovery options
- [ ] Reset code history/audit log

---

**Feature completed and ready for use!** 🎉
