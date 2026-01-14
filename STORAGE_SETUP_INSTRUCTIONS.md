# Supabase Storage Setup Instructions

## Error You Encountered

You got this error:
```
ERROR: 42710: relation "posts" is already member of publication "supabase_realtime"
```

This happened because the `setup-storage.sql` file included database setup commands that were already run. **This is harmless** - it just means your database is already configured correctly.

## Solution: Use the Storage-Only Script

I've created a new file that ONLY sets up storage (no database changes):

**File**: `fragments-test/supabase/setup-storage-only.sql`

## How to Set Up Storage

### Step 1: Run the Storage-Only SQL Script

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the entire contents of `fragments-test/supabase/setup-storage-only.sql`
6. Paste it into the SQL Editor
7. Click **Run**

This will:
- Create two storage buckets: `avatars` and `post-images`
- Set up all the necessary security policies
- Allow public read access (so anyone can view images)
- Allow authenticated users to upload their own images
- Prevent users from deleting/modifying other users' images

### Step 2: Verify the Setup

After running the script, you should see output showing:
- Two buckets created (`avatars` and `post-images`)
- Eight storage policies created

You can also verify by:
1. Going to **Storage** in the Supabase dashboard
2. You should see two buckets: `avatars` and `post-images`
3. Both should be marked as **Public**

### Step 3: Test Image Upload

1. Go to your app: https://fragments-test.vercel.app
2. Log in
3. Create a new post with an image
4. The image should upload successfully
5. You should see the image in your post
6. Other users should also be able to see the image

## What This Fixes

Once storage is set up, images will:
- ✅ Upload successfully when creating posts
- ✅ Display correctly in the feed
- ✅ Show up for all users (not just the person who posted)
- ✅ Be automatically compressed (5-10x smaller file size)
- ✅ Load quickly with caching

## Troubleshooting

### If images still don't work after setup:

1. **Check bucket exists**: Go to Storage in Supabase dashboard, verify `post-images` bucket exists
2. **Check bucket is public**: The bucket should have a "Public" badge
3. **Check policies**: Run the verification query at the end of the SQL script
4. **Check browser console**: Look for any error messages when uploading
5. **Try a fresh upload**: Create a new post with an image after setup

### If you see "Failed to upload image" errors:

This usually means:
- Storage bucket doesn't exist yet
- Bucket is not public
- Storage policies are not set up correctly

Solution: Re-run the `setup-storage-only.sql` script

## Why This Error Happened

The original `setup-storage.sql` file included this line:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
```

This was already done when you set up your database initially, so running it again caused the error. The new `setup-storage-only.sql` file removes all database-related commands and ONLY handles storage configuration.

## Summary

- ✅ Your database is fine (the error was harmless)
- ✅ Use `setup-storage-only.sql` instead
- ✅ This will set up storage without touching your database
- ✅ Images will work immediately after running the script
