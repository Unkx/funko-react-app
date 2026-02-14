# Novu Email Setup Guide

Your password reset feature now uses **Novu** - an open-source notification infrastructure platform.

## Quick Setup

### 1. Create a Novu Account

1. Go to https://novu.co
2. Sign up for a free account
3. Verify your email

### 2. Get Your API Key

1. Log in to [Novu Dashboard](https://web.novu.co)
2. Go to **Settings** → **API Keys**
3. Copy your **API Key**

### 3. Create Your `.env` File

In your `backend/` folder, create a `.env` file:

```env
NOVU_API_KEY=your_api_key_here
NOVU_TEMPLATE_ID=password-reset
```

### 4. Create Password Reset Template in Novu

This template sends the reset code via email.

**Steps:**

1. In Novu Dashboard, go to **Workflows** → **Create Workflow**
2. Click **Blank Workflow**
3. Name it: `password-reset`
4. Add an **Email** step
5. In the email template, add:
   - **Subject:** `Password Reset - Funko App`
   - **Preview:** 
   ```
   Hello {{userName}},

   Use this code to reset your password: {{code}}
   ```
   - **HTML Content:**
   ```html
   <h2>Password Reset Request</h2>
   <p>Hello {{userName}},</p>
   <p>We received a request to reset your password.</p>
   <p>Use this code to reset your password:</p>
   <h1 style="font-size: 32px; color: #007bff; letter-spacing: 5px;">{{code}}</h1>
   <p>This code expires in 15 minutes.</p>
   <p>If you didn't request this, ignore this email.</p>
   <p>Best regards,<br>Funko App Team</p>
   ```

6. Click **Save & Publish**

### 5. Test It

1. Restart your backend server: `npm run dev`
2. Register a test account
3. Click "Forgot Password?" and enter your email
4. You should receive an email with the reset code

## How It Works

```
User clicks "Forgot Password"
         ↓
Server generates reset code
         ↓
Server calls Novu API with code & email
         ↓
Novu sends email via configured provider (Gmail, SendGrid, etc)
         ↓
User receives email with code
         ↓
User resets password
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Notification service not configured" | Set `NOVU_API_KEY` in `.env` file |
| Email not received | Check Novu dashboard logs: **Executions** tab |
| Wrong template ID error | Make sure workflow is published and ID matches `NOVU_TEMPLATE_ID` |

## Configure Email Provider in Novu

By default, Novu uses a test email provider. To send real emails:

1. Go to Novu **Integrations Store**
2. Select your provider (Gmail, SendGrid, Twilio, etc.)
3. Add your credentials
4. Novu will use it automatically

## Environment Variables

```
NOVU_API_KEY          - Your Novu API key (required)
NOVU_TEMPLATE_ID      - Workflow ID in Novu (defaults to 'password-reset')
FRONTEND_URL          - Frontend domain for reset links
```

## Learn More

- [Novu Documentation](https://docs.novu.co)
- [Novu Email Setup](https://docs.novu.co/channels-and-providers/email)
- [Novu Templates](https://docs.novu.co/platform/templates)
- [Novu GitHub](https://github.com/novuhq/novu)
