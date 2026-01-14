# 🚨 Deployment Issue: Foreign Key Relationship Error

## Issue Encountered

After successfully deploying to Vercel at **https://fragments-test.vercel.app**, the app encountered a database error:

```
PGRST200: Could not find a relationship between 'comments' and 'users' in the schema cache
```

## Root Cause

The Supabase PostgREST schema cache doesn't recognize the foreign key relationship between the `comments` and `users` tables, even though the relationship exists in the database. This typically happens when:

1. The comments table was added after the initial database setup
2. The schema cache wasn't refreshed after adding the foreign keys
3. PostgREST needs to be notified of schema changes

## Solution

### Step 1: Run the Fix Script

Go to your **Supabase Dashboard** → **SQL Editor** and run the script located at:
```
supabase/fix-comments-foreign-key.sql
```

This script will:
- Verify the comments table exists
- Drop and recreate foreign key constraints
- Refresh the PostgREST schema cache
- Verify the relationships are properly set up

### Step 2: Verify the Fix

After running the script, test it locally:

```bash
cd fragments-test
node scripts/test-foreign-keys.js
```

This will verify that all foreign key relationships are working correctly.

### Step 3: Test on Vercel

Visit your deployed app at **https://fragments-test.vercel.app** and:
1. Register or login
2. Create a post
3. Click on the post to view details
4. Try adding a comment

The error should be resolved! ✅

## Quick Fix (Copy & Paste)

If you want a quick fix, run this in Supabase SQL Editor:

```sql
-- Ensure foreign keys exist and refresh cache
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE comments ADD CONSTRAINT comments_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
```

## Alternative: Restart Supabase Project

If the SQL fix doesn't work:

1. Go to **Supabase Dashboard** → **Settings** → **General**
2. Click **"Restart Project"**
3. Wait 2-3 minutes for the project to restart
4. Test the app again

## Files Created

1. **`supabase/fix-comments-foreign-key.sql`** - SQL script to fix the issue
2. **`scripts/test-foreign-keys.js`** - Node script to verify the fix
3. **`SUPABASE_FOREIGN_KEY_FIX.md`** - Detailed troubleshooting guide

## Prevention

To prevent this in the future:
- Always run `NOTIFY pgrst, 'reload schema';` after schema changes
- Use Supabase migrations for all database changes
- Restart the Supabase project after major schema updates

## Status

- ✅ App deployed to Vercel: https://fragments-test.vercel.app
- ✅ Environment variables configured
- ✅ Build successful
- ⚠️  Database foreign key issue identified
- 📝 Fix scripts created and ready to run

## Next Steps

1. Run the fix script in Supabase SQL Editor
2. Verify with the test script
3. Test the deployed app
4. Enjoy your fully functional Fragments app! 🎉

---

**Note**: This is a common issue with Supabase when adding tables after initial setup. The fix is simple and takes less than 1 minute to apply.
