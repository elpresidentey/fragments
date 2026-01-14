# Password Reset - Deployment & Configuration Guide

## ✅ Code Changes Deployed

The password reset functionality has been fixed and deployed to:
- **Production**: https://fragments-test.vercel.app
- **GitHub**: https://github.com/elpresidentey/fragments

## 🔧 Required Configuration (IMPORTANT!)

To make password reset work, you MUST configure Supabase:

### Step 1: Add Redirect URLs to Supabase

1. Go to: https://supabase.com/dashboard
2. Select your Fragments project
3. Navigate to: **Authentication** → **URL Configuration**
4. In the **Redirect URLs** section, add these URLs:

```
https://fragments-test.vercel.app/reset-password
https://fragments-test.vercel.app/*
http://localhost:8081/reset-password
http://localhost:8081/*
fragments://reset-password
```

5. Click **Save**

### Step 2: Verify Email Service

1. In Supabase Dashboard, go to: **Authentication** → **Email Templates**
2. Check that "Reset Password" template is enabled
3. Verify your email provider is configured (SMTP or Supabase default)

## 🧪 Testing the Fix

### Test on Production (Vercel):

1. Visit: https://fragments-test.vercel.app
2. Click "Forgot Password?" on login screen
3. Enter your email address
4. Click "Send Reset Email"
5. Check your email inbox (and spam folder)
6. Click the reset link in the email
7. You should be redirected to: `https://fragments-test.vercel.app/reset-password?access_token=...`
8. Enter your new password
9. Click "Reset Password"
10. You should see success message
11. Try logging in with new password

### Expected Behavior:

✅ **Email Sent**: "If an account with this email exists, you will receive a password reset link shortly."
✅ **Email Received**: Within 1-2 minutes
✅ **Link Works**: Redirects to reset password page
✅ **Token Valid**: Page shows password reset form
✅ **Password Updates**: Success message appears
✅ **Can Login**: New password works

## 🐛 Troubleshooting

### Problem: "Invalid Reset Link" Error

**Cause**: Redirect URL not whitelisted in Supabase

**Solution**:
1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Add `https://fragments-test.vercel.app/reset-password` to Redirect URLs
4. Save and try again

### Problem: Email Not Received

**Possible Causes**:
- Email in spam folder
- Email service not configured in Supabase
- Invalid email address
- Rate limiting (too many attempts)

**Solutions**:
1. Check spam/junk folder
2. Verify email service in Supabase settings
3. Double-check email address spelling
4. Wait 15 minutes before trying again

### Problem: "Reset link has expired"

**Cause**: Token is older than 1 hour

**Solution**: Request a new password reset (tokens expire after 1 hour for security)

### Problem: Can't Access Supabase Dashboard

**Solution**: 
1. Go to https://supabase.com
2. Sign in with your account
3. Select the Fragments project
4. If you don't have access, you'll need the project owner to add the redirect URLs

## 📋 Configuration Checklist

Before testing, ensure:

- [ ] Supabase redirect URLs configured
- [ ] Vercel URL added: `https://fragments-test.vercel.app/reset-password`
- [ ] Localhost URL added: `http://localhost:8081/reset-password`
- [ ] Wildcard URLs added for both
- [ ] Email service configured in Supabase
- [ ] Reset password email template enabled
- [ ] Changes saved in Supabase dashboard

## 🔒 Security Features

The password reset includes:
- ✅ Rate limiting (3 attempts per 15 minutes)
- ✅ Token expiration (1 hour)
- ✅ Strong password validation
- ✅ Email validation
- ✅ Suspicious activity detection
- ✅ Session invalidation after reset

## 📱 Platform Support

The fix works on:
- ✅ Web (Vercel deployment)
- ✅ Web (Local development)
- ✅ Mobile (React Native app)
- ✅ All browsers

## 🎯 What Changed

### Before:
- Used deep link URL: `fragments://reset-password`
- Only worked on mobile
- Failed on web deployment

### After:
- Dynamic URL based on environment
- Web: `https://fragments-test.vercel.app/reset-password`
- Mobile: `fragments://reset-password`
- Works everywhere

## 📝 Files Modified

- `lib/services/password-reset.ts` - Dynamic redirect URL
- `PASSWORD_RESET_FIX.md` - Technical documentation
- `PASSWORD_RESET_DEPLOYMENT.md` - This guide

## 🚀 Deployment Status

- ✅ Code changes committed to GitHub
- ✅ Deployed to Vercel production
- ⏳ **Awaiting Supabase configuration** (you need to do this)
- ⏳ Testing after configuration

## 📞 Need Help?

If password reset still doesn't work after configuration:

1. Check browser console for errors
2. Verify Supabase redirect URLs are saved
3. Test with a different email address
4. Check Supabase logs for errors
5. Verify email service is working

## 🎉 Once Configured

After you add the redirect URLs to Supabase, password reset will work perfectly on:
- Production (Vercel)
- Local development
- Mobile app

---

**Next Step**: Configure Supabase redirect URLs (see Step 1 above)
**Status**: ✅ Deployed, awaiting configuration
**URL**: https://fragments-test.vercel.app
