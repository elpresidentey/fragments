# Password Reset Configuration Guide

This guide walks you through configuring password reset functionality in your Supabase project.

## 1. Database Configuration

### Step 1: Run the SQL Configuration
1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `password-reset-config.sql`
4. Click **Run** to execute the script

This will create:
- Rate limiting tables and functions
- Security monitoring tables
- Helper functions for password reset validation
- Cleanup and maintenance functions

## 2. Authentication Settings

### Step 2: Configure Auth Settings
1. Go to **Authentication > Settings**
2. Configure the following settings:

#### General Settings
- **JWT Expiry**: `3600` (1 hour)
- **Refresh Token Rotation**: `Enabled`
- **Session Timeout**: `3600` (1 hour)

#### Password Settings
- **Minimum Password Length**: `8`
- **Password Requirements**: Enable all options
  - ✅ Require uppercase letters
  - ✅ Require lowercase letters  
  - ✅ Require numbers
  - ✅ Require special characters

#### Rate Limiting
- **Password Reset Rate Limit**: `3 requests per 15 minutes`
- **Sign In Rate Limit**: `5 attempts per 5 minutes`
- **Sign Up Rate Limit**: `3 attempts per 5 minutes`

## 3. Email Template Configuration

### Step 3: Set Up Password Reset Email Template
1. Go to **Authentication > Email Templates**
2. Select **Reset Password** template
3. Configure the following:

#### Subject Line
```
Reset your password for Fragments
```

#### HTML Template
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5; 
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            background: #1DA1F2; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600; 
        }
        .content { 
            padding: 30px; 
        }
        .button { 
            display: inline-block; 
            background: #1DA1F2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-weight: 600;
            text-align: center;
        }
        .button:hover { 
            background: #1991DB; 
        }
        .link-fallback { 
            word-break: break-all; 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 4px; 
            border: 1px solid #e9ecef;
            font-family: monospace;
            font-size: 14px;
        }
        .security-notice { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 25px 0; 
        }
        .security-notice h3 {
            margin-top: 0;
            color: #856404;
        }
        .security-notice ul {
            margin-bottom: 0;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            background: #f8f9fa; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Fragments</div>
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You recently requested to reset your password for your Fragments account. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset My Password</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="link-fallback">{{ .ConfirmationURL }}</div>
            
            <div class="security-notice">
                <h3>🔒 Security Notice</h3>
                <ul>
                    <li><strong>This link expires in 1 hour</strong> for your security</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password won't change until you create a new one</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <p>If you're having trouble or didn't request this reset, please contact our support team.</p>
            <p>Best regards,<br><strong>The Fragments Team</strong></p>
        </div>
        <div class="footer">
            <p>This email was sent to <strong>{{ .Email }}</strong></p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
```

#### Text Template
```
Reset Your Password - Fragments

Hello,

You recently requested to reset your password for your Fragments account.

Click this link to reset your password:
{{ .ConfirmationURL }}

SECURITY NOTICE:
- This link will expire in 1 hour for your security
- If you didn't request this reset, please ignore this email
- Your password won't change until you create a new one
- Never share this link with anyone

If you're having trouble or didn't request this reset, please contact our support team.

Best regards,
The Fragments Team

---
This email was sent to {{ .Email }}
If you didn't request this password reset, you can safely ignore this email.
```

## 4. URL Configuration

### Step 4: Configure Redirect URLs
1. Go to **Authentication > URL Configuration**
2. Add the following redirect URLs:

#### Site URL
```
fragments://
```

#### Redirect URLs
```
fragments://reset-password
fragments://auth/callback
http://localhost:8081/auth/callback
https://your-domain.com/auth/callback
```

## 5. Security Configuration

### Step 5: Enable Security Features
1. Go to **Authentication > Settings > Security**
2. Enable the following features:

#### Security Settings
- ✅ **Enable email confirmations**
- ✅ **Enable secure email change**
- ✅ **Enable manual linking**
- ✅ **Disable sign-ups** (if you want invite-only)

#### Advanced Security
- ✅ **Enable Captcha** (recommended for production)
- ✅ **Enable session timeout**
- ✅ **Enable refresh token rotation**

## 6. Testing Configuration

### Step 6: Test Password Reset Flow

#### Test Email Delivery
1. Use the SQL Editor to test rate limiting:
```sql
-- Test rate limiting function
SELECT check_password_reset_rate_limit('test@example.com', '192.168.1.1'::inet);

-- Test suspicious activity detection
SELECT detect_suspicious_password_reset_activity('test@example.com', '192.168.1.1'::inet);
```

#### Test Email Template
1. Go to **Authentication > Users**
2. Create a test user or use an existing one
3. Use the **Send Password Reset** button to test email delivery
4. Check that the email arrives with correct formatting
5. Verify the reset link works and expires after 1 hour

#### Test Rate Limiting
1. Make multiple password reset requests quickly
2. Verify that rate limiting kicks in after 3 attempts
3. Check that the rate limit resets after 15 minutes

## 7. Monitoring and Maintenance

### Step 7: Set Up Monitoring
1. Create a scheduled function to run maintenance:
```sql
-- Run this periodically (daily) to clean up old data
SELECT maintain_password_reset_tables();
```

2. Monitor security events:
```sql
-- Check for suspicious activity
SELECT * FROM password_reset_security_events 
WHERE event_type = 'suspicious' 
AND created_at > NOW() - INTERVAL '24 hours';

-- Check rate limiting effectiveness
SELECT email, COUNT(*) as attempts
FROM password_reset_attempts 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 3;
```

## 8. Production Checklist

### Before Going Live
- [ ] Email templates are properly formatted and tested
- [ ] Rate limiting is configured and tested
- [ ] Security monitoring is in place
- [ ] Token expiration is set to 1 hour
- [ ] Redirect URLs are configured for your domain
- [ ] Captcha is enabled (recommended)
- [ ] SSL/TLS is properly configured
- [ ] Database functions are created and tested
- [ ] Cleanup maintenance is scheduled

### Security Best Practices
- [ ] Never expose service role keys in client code
- [ ] Use environment variables for sensitive configuration
- [ ] Regularly monitor security events
- [ ] Keep Supabase and dependencies updated
- [ ] Implement proper error handling in your app
- [ ] Use HTTPS for all production traffic
- [ ] Consider implementing additional 2FA for sensitive accounts

## Troubleshooting

### Common Issues

#### Emails Not Sending
- Check SMTP configuration in Authentication > Settings
- Verify email templates are saved correctly
- Check spam/junk folders
- Verify redirect URLs are correct

#### Rate Limiting Not Working
- Ensure SQL functions were created successfully
- Check that the app is calling the rate limiting functions
- Verify database permissions are correct

#### Token Expiration Issues
- Check JWT expiry settings
- Verify token validation logic in your app
- Ensure proper error handling for expired tokens

#### Deep Linking Issues
- Verify URL schemes are registered in your app
- Check redirect URL configuration
- Test deep linking on actual devices

For additional support, check the Supabase documentation or contact support.