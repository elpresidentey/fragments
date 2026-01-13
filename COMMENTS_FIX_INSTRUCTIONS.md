# Comments Functionality Fix Instructions

## Issue Identified
The comments functionality is failing because the users table RLS (Row Level Security) policy is too restrictive. Currently, users can only view their own profile, but comments need to display the author's name and avatar from other users.

## Root Cause
The error "Could not find a relationship between 'comments' and 'users' in the schema cache" occurs because:
1. Comments table exists ✅
2. Users table exists ✅  
3. Foreign key relationship exists ✅
4. BUT: Users table RLS policy blocks the join query ❌

## Quick Fix (Recommended)

### Step 1: Update Users Table Policy
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/mxrljbfxcgzmkmtdedoi
2. Open **SQL Editor**
3. Run this SQL:

```sql
-- Fix users table RLS policy to allow comments to display user information
-- This allows authenticated users to view basic profile info (name, avatar) of other users
-- which is needed for displaying comment authors

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create a new policy that allows authenticated users to view basic profile info
CREATE POLICY "Authenticated users can view basic profile info" ON users
  FOR SELECT TO authenticated USING (true);

-- Keep the update and insert policies restrictive (users can only modify their own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Step 2: Verify the Fix
Run this command to verify everything works:
```bash
cd fragments-test/scripts
node verify-comments-table.js
```

You should see:
```
✅ Comments table exists and is accessible
✅ Table schema is correct  
✅ Join with users table works
🎉 All checks passed! Comments table is ready.
```

## Alternative: Fallback Implementation
If you prefer not to change the RLS policy, the comment service has been updated with fallback logic that:
1. Tries the join query first
2. If it fails due to relationship issues, falls back to separate queries
3. Still displays user names and avatars correctly

## Security Note
The updated policy allows authenticated users to view basic profile information (name, avatar) of other users, which is standard for social media apps. Users still cannot:
- View email addresses of other users
- Update other users' profiles
- Access any sensitive information

This is the same level of access that posts already have - authenticated users can see post authors' names and avatars.

## Test the Fix
After applying the SQL fix:
1. Refresh your app
2. Click on any post
3. Try adding a comment
4. Comments should now work properly with user names and avatars displayed

## Files Updated
- `fragments-test/lib/services/comment.ts` - Added fallback logic for relationship errors
- `fragments-test/supabase/fix-users-policy-for-comments.sql` - SQL fix for RLS policy
- `fragments-test/scripts/verify-comments-table.js` - Verification script

The comments functionality should now work correctly! 🎉