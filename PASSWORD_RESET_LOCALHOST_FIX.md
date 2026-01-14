# Password Reset Localhost Redirect Fix

## Issue
When clicking the password reset link in the email, it redirects to `localhost` instead of the Vercel deployment URL (`https://fragments-test.vercel.app`).

## Root Cause
The password reset service was detecting `window.location.origin` which could be `localhost` during development, and Supabase was caching that URL in the reset email.

## Solution

### 1. Code Fix
Updated `fragments-test/lib/services/password-reset.ts` to:
- Detect if running on localhost
- Force use of Vercel production URL (`https://fragments-test.vercel.app/reset-password`) when on localhost
- Use current origin for production deployments
- Use mobile deep link (`fragments://reset-password`) for mobile apps

```typescript
let redirectUrl: string;

if (typeof window !== 'undefined') {
  // We're on web - use the current origin or fallback to Vercel URL
  const origin = window.location.origin;
  
  // If running on localhost, use Vercel production URL instead
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    redirectUrl = 'https://fragments-test.vercel.app/reset-password';
  } else {
    redirectUrl = `${origin}/reset-password`;
  }
} else {
  // Mobile app - use deep link
  redirectUrl = 'fragments://reset-password';
}
```

### 2. Supabase Configuration (REQUIRED)
You MUST configure Supabase to whitelist the redirect URLs:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add these URLs to **Redirect URLs**:
   - `https://fragments-test.vercel.app/reset-password`
   - `https://fragments-test.vercel.app/*` (wildcard for all routes)
   - `http://localhost:8081/reset-password` (for local development)
   - `fragments://reset-password` (for mobile app)

5. Set **Site URL** to: `https://fragments-test.vercel.app`

6. Click **Save**

### 3. Testing the Fix

#### Test on Production (Vercel)
1. Go to https://fragments-test.vercel.app
2. Click "Forgot Password?" on the login screen
3. Enter your email address
4. Check your email for the reset link
5. Click the reset link - it should now go to `https://fragments-test.vercel.app/reset-password`
6. Enter your new password
7. You should be redirected to the login screen

#### Test on Localhost (Development)
1. Run the app locally: `npm start` or `npm run web`
2. Click "Forgot Password?"
3. Enter your email
4. The reset email will contain a link to `https://fragments-test.vercel.app/reset-password` (NOT localhost)
5. This ensures users always get a working link, even if you're testing locally

### 4. Important Notes

**Why localhost links don't work:**
- When you test password reset on localhost, Supabase sends an email with the redirect URL
- If that URL is `http://localhost:8081/reset-password`, it won't work for anyone else
- The fix ensures production URL is always used, even during local development

**Email caching:**
- Supabase may cache the redirect URL for a short time
- If you still see localhost links, wait 5-10 minutes and try again
- Or test with a different email address

**Multiple environments:**
- Production: Uses `https://fragments-test.vercel.app/reset-password`
- Localhost: Also uses `https://fragments-test.vercel.app/reset-password` (forced)
- Mobile: Uses `fragments://reset-password` (deep link)

### 5. Deployment
Changes have been pushed to GitHub. Vercel will automatically redeploy.

After deployment:
1. Wait 1-2 minutes for Vercel deployment to complete
2. Configure Supabase redirect URLs (step 2 above)
3. Test the password reset flow

## Related Files
- `fragments-test/lib/services/password-reset.ts` - Password reset service with URL logic
- `fragments-test/app/(auth)/reset-password.tsx` - Reset password screen
- `fragments-test/components/forgot-password-modal.tsx` - Forgot password modal

## Status
✅ Code fixed and deployed
⚠️ Requires Supabase configuration (see step 2 above)
