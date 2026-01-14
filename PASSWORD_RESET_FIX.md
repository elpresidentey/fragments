# Password Reset Fix for Web Deployment

## Issue
Password reset wasn't working on the Vercel deployment because:
1. The redirect URL was using a deep link scheme (`fragments://`) which doesn't work on web
2. Supabase needs to have the web URL whitelisted in redirect URLs

## Solution

### 1. Updated Password Reset Service
Modified `lib/services/password-reset.ts` to use the correct redirect URL based on environment:

```typescript
// Use the correct redirect URL based on environment
const redirectUrl = typeof window !== 'undefined' && window.location.origin
  ? `${window.location.origin}/reset-password`
  : 'fragments://reset-password';

const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: redirectUrl,
})
```

This ensures:
- **On Web (Vercel)**: Uses `https://fragments-test.vercel.app/reset-password`
- **On Mobile**: Uses `fragments://reset-password`

### 2. Configure Supabase Redirect URLs

You need to add the web URL to Supabase's allowed redirect URLs:

#### Steps:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add these URLs to **Redirect URLs**:
   ```
   https://fragments-test.vercel.app/reset-password
   https://fragments-test.vercel.app/*
   http://localhost:8081/reset-password
   http://localhost:8081/*
   fragments://reset-password
   ```

5. Click **Save**

### 3. Test the Password Reset Flow

#### On Web (Vercel):
1. Go to https://fragments-test.vercel.app
2. Click "Forgot Password?"
3. Enter your email
4. Check your email for the reset link
5. Click the link in the email
6. Should redirect to: `https://fragments-test.vercel.app/reset-password?access_token=...&refresh_token=...&type=recovery`
7. Enter new password
8. Submit

#### On Local Development:
1. Go to http://localhost:8081
2. Follow same steps as above
3. Link will redirect to: `http://localhost:8081/reset-password?...`

## How It Works

### Password Reset Flow:
```
1. User clicks "Forgot Password"
   ↓
2. Enters email address
   ↓
3. App calls Supabase with redirect URL
   ↓
4. Supabase sends email with reset link
   ↓
5. User clicks link in email
   ↓
6. Redirects to: https://fragments-test.vercel.app/reset-password?access_token=...
   ↓
7. App validates tokens
   ↓
8. User enters new password
   ↓
9. Password updated successfully
```

### URL Parameters:
The reset link includes these parameters:
- `access_token` - Temporary access token
- `refresh_token` - Refresh token
- `type=recovery` - Indicates this is a password recovery
- `expires_in` - Token expiration time

### Token Validation:
The reset password screen validates:
1. Tokens are present
2. Tokens are not expired (1 hour limit)
3. Session type is 'recovery'
4. User is authenticated

## Troubleshooting

### Issue: "Invalid Reset Link"
**Cause**: Redirect URL not whitelisted in Supabase
**Solution**: Add your Vercel URL to Supabase redirect URLs (see step 2 above)

### Issue: "Reset link has expired"
**Cause**: Token is older than 1 hour
**Solution**: Request a new password reset

### Issue: Email not received
**Possible causes**:
1. Email in spam folder
2. Invalid email address
3. Supabase email service not configured
4. Rate limiting (too many requests)

**Solutions**:
- Check spam folder
- Verify email address is correct
- Check Supabase email settings
- Wait 15 minutes before trying again

### Issue: "Network error"
**Cause**: Can't connect to Supabase
**Solution**: Check internet connection and Supabase status

## Testing Checklist

- [ ] Add Vercel URL to Supabase redirect URLs
- [ ] Test forgot password on web
- [ ] Receive reset email
- [ ] Click link in email
- [ ] Redirects to reset password page
- [ ] Enter new password
- [ ] Password updates successfully
- [ ] Can log in with new password

## Security Features

The password reset implementation includes:
- ✅ Rate limiting (3 attempts per 15 minutes)
- ✅ Token expiration (1 hour)
- ✅ Strong password requirements
- ✅ Email validation
- ✅ Suspicious activity detection
- ✅ Session invalidation after reset
- ✅ Security event logging

## Files Modified
- `lib/services/password-reset.ts` - Dynamic redirect URL
- `PASSWORD_RESET_FIX.md` - This documentation

## Next Steps

1. **Configure Supabase** (Required):
   - Add Vercel URL to redirect URLs
   - Verify email service is working

2. **Test on Vercel**:
   - Try password reset flow
   - Verify email is received
   - Confirm redirect works

3. **Deploy**:
   - Commit changes
   - Push to GitHub
   - Redeploy to Vercel

## Deployment Commands

```bash
cd fragments-test
git add -A
git commit -m "Fix password reset for web deployment"
git push origin main
vercel --prod
```

---

**Status**: ✅ Code fixed, awaiting Supabase configuration
**Impact**: Password reset will work on both web and mobile
