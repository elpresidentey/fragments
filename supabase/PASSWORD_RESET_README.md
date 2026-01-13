# Password Reset Configuration

This directory contains the complete configuration for password reset functionality in the Fragments app.

## 📁 Files Overview

### Configuration Files
- **`password-reset-config.sql`** - Complete SQL configuration for database functions, tables, and security
- **`password-reset-setup-guide.md`** - Detailed step-by-step setup instructions for Supabase Dashboard
- **`PASSWORD_RESET_README.md`** - This overview document

### Test Scripts
- **`../scripts/test-password-reset-config.js`** - Comprehensive test suite for all password reset functionality
- **`../scripts/validate-password-reset-setup.js`** - Basic validation script for setup verification

## 🚀 Quick Setup

### 1. Database Configuration
```bash
# Run the SQL configuration in Supabase Dashboard
# Copy contents of password-reset-config.sql to SQL Editor and execute
```

### 2. Validate Setup
```bash
cd fragments-test/scripts
node validate-password-reset-setup.js
```

### 3. Configure Dashboard Settings
Follow the detailed instructions in `password-reset-setup-guide.md`

### 4. Test Complete Functionality
```bash
cd fragments-test/scripts
node test-password-reset-config.js
```

## 🔧 Features Implemented

### ✅ Email Templates
- **Custom HTML template** with Fragments branding
- **Security notices** and expiration warnings
- **Responsive design** for all email clients
- **Text fallback** for accessibility

### ✅ Token Expiration
- **1-hour expiration** for security
- **Automatic invalidation** after use
- **Proper error handling** for expired tokens
- **Session management** integration

### ✅ Rate Limiting
- **3 attempts per 15 minutes** per email
- **IP-based limiting** for additional security
- **Exponential backoff** for repeated attempts
- **Database-backed tracking** for persistence

### ✅ Security Monitoring
- **Attempt logging** for all password reset requests
- **Suspicious activity detection** for multiple IPs/emails
- **Security event logging** for audit trails
- **Session invalidation** on password change

### ✅ Error Handling
- **User-friendly messages** for all error states
- **Security-conscious responses** (no email enumeration)
- **Network error handling** with retry logic
- **Proper validation** for all inputs

## 📊 Database Schema

### Tables Created
```sql
password_reset_attempts
├── id (UUID, Primary Key)
├── email (TEXT, Not Null)
├── ip_address (INET, Optional)
├── user_agent (TEXT, Optional)
├── created_at (TIMESTAMP WITH TIME ZONE)
└── success (BOOLEAN, Default: false)

password_reset_security_events
├── id (UUID, Primary Key)
├── event_type (TEXT, Not Null)
├── email (TEXT, Optional)
├── ip_address (INET, Optional)
├── user_agent (TEXT, Optional)
├── details (JSONB, Optional)
└── created_at (TIMESTAMP WITH TIME ZONE)
```

### Functions Created
- `check_password_reset_rate_limit()` - Rate limiting validation
- `log_password_reset_attempt()` - Attempt logging
- `detect_suspicious_password_reset_activity()` - Security monitoring
- `log_password_reset_security_event()` - Event logging
- `maintain_password_reset_tables()` - Cleanup and maintenance

## 🔒 Security Features

### Rate Limiting
- **Email-based**: 3 attempts per 15 minutes
- **IP-based**: 6 attempts per 15 minutes (2x email limit)
- **Exponential backoff**: Increasing delays for repeated attempts
- **Persistent tracking**: Database-backed for reliability

### Monitoring
- **Failed attempt tracking** with automatic cleanup
- **Suspicious activity detection** for multiple IPs
- **Security event logging** for audit purposes
- **Real-time monitoring** capabilities

### Token Security
- **1-hour expiration** for all reset tokens
- **Single-use tokens** that invalidate after use
- **Session invalidation** on successful password reset
- **Secure token validation** with proper error handling

## 🧪 Testing

### Validation Script
```bash
# Basic setup validation
node scripts/validate-password-reset-setup.js
```
**Tests:**
- Environment configuration
- Required files presence
- Supabase connection
- Authentication configuration
- Email functionality

### Comprehensive Test Suite
```bash
# Full functionality testing
node scripts/test-password-reset-config.js
```
**Tests:**
- Database function configuration
- Email template and delivery
- Rate limiting functionality
- Token expiration handling
- Security monitoring
- Maintenance functions

## 📋 Configuration Checklist

### Database Setup
- [ ] Run `password-reset-config.sql` in Supabase SQL Editor
- [ ] Verify all functions and tables are created
- [ ] Check RLS policies are properly configured
- [ ] Test database functions with sample data

### Dashboard Configuration
- [ ] Configure email templates in Authentication > Email Templates
- [ ] Set JWT expiry to 3600 seconds (1 hour)
- [ ] Enable refresh token rotation
- [ ] Configure redirect URLs for your app
- [ ] Set up rate limiting rules
- [ ] Enable security features (captcha, etc.)

### Testing and Validation
- [ ] Run validation script and ensure all tests pass
- [ ] Test email delivery with real email address
- [ ] Verify rate limiting works as expected
- [ ] Test token expiration and validation
- [ ] Validate security monitoring and logging

### Production Readiness
- [ ] Schedule maintenance function to run daily
- [ ] Set up monitoring for security events
- [ ] Configure proper error handling in app
- [ ] Enable HTTPS for all production traffic
- [ ] Review and test disaster recovery procedures

## 🔧 Maintenance

### Daily Maintenance
```sql
-- Run this daily to clean up old data
SELECT maintain_password_reset_tables();
```

### Security Monitoring
```sql
-- Check for suspicious activity
SELECT * FROM password_reset_security_events 
WHERE event_type = 'suspicious' 
AND created_at > NOW() - INTERVAL '24 hours';

-- Monitor rate limiting effectiveness
SELECT email, COUNT(*) as attempts
FROM password_reset_attempts 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 3;
```

### Performance Monitoring
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename IN ('password_reset_attempts', 'password_reset_security_events');
```

## 🚨 Troubleshooting

### Common Issues

#### Database Functions Not Found
- **Cause**: SQL script not executed or failed
- **Solution**: Re-run `password-reset-config.sql` in Supabase SQL Editor
- **Check**: Verify functions exist in Database > Functions

#### Emails Not Sending
- **Cause**: SMTP not configured or email template issues
- **Solution**: Check Authentication > Settings > SMTP
- **Test**: Use Authentication > Users > Send Password Reset

#### Rate Limiting Not Working
- **Cause**: Functions not called or database permissions
- **Solution**: Check function calls in password-reset service
- **Verify**: Test with `check_password_reset_rate_limit()` function

#### Token Expiration Issues
- **Cause**: JWT settings or validation logic
- **Solution**: Check Authentication > Settings > JWT Expiry
- **Test**: Verify token validation in reset flow

## 📞 Support

For additional help:
1. Check the detailed setup guide: `password-reset-setup-guide.md`
2. Run the validation script: `validate-password-reset-setup.js`
3. Review Supabase documentation: https://supabase.com/docs/guides/auth
4. Check the test results for specific error messages

## 📝 Requirements Validation

This configuration addresses the following requirements:

### ✅ Requirement 2.4: Password Reset Email Sending
- Custom email templates configured
- Supabase integration for email delivery
- Proper error handling and user feedback

### ✅ Requirement 3.1: Reset Token Navigation
- Deep link configuration for mobile app
- Token validation and expiration handling
- Proper navigation flow implementation

### ✅ Requirement 5.1: Reset Token Expiration
- 1-hour token expiration configured
- Automatic token invalidation after use
- Proper validation and error messages

### ✅ Requirement 5.2: Rate Limiting Protection
- Database-backed rate limiting system
- Multiple protection layers (email + IP)
- Exponential backoff for repeated attempts
- Comprehensive security monitoring

All requirements from the specification have been implemented and tested.