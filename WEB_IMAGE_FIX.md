# 🖼️ Fix Images Not Loading on Vercel

## Issue
Images are not loading on the deployed Vercel app. This is typically caused by:
1. CORS (Cross-Origin Resource Sharing) issues with Supabase Storage
2. Image URLs not being properly handled in the web build
3. Missing Supabase Storage bucket configuration

## Solution

### Step 1: Configure Supabase Storage CORS

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage Settings**
   - Click "Storage" in the left sidebar
   - Click "Policies" tab

3. **Create a Public Bucket (if not exists)**
   - Click "New Bucket"
   - Name: `avatars` or `post-images`
   - Make it **Public**
   - Click "Create bucket"

4. **Set up CORS for the bucket**
   - Go to "Configuration" → "Settings"
   - Add CORS policy:

```json
[
  {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "HEAD"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

### Step 2: Update Storage Policies

Run this SQL in your Supabase SQL Editor:

```sql
-- Allow public read access to storage buckets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' OR bucket_id = 'post-images' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING ( auth.uid()::text = (storage.foldername(name))[1] );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] );
```

### Step 3: Verify Image URLs

Check that your image URLs follow this format:
```
https://[project-ref].supabase.co/storage/v1/object/public/[bucket-name]/[file-path]
```

Example:
```
https://mxrljbfxcgzmkmtdedoi.supabase.co/storage/v1/object/public/avatars/user-123/profile.jpg
```

### Step 4: Test Image Loading

1. **Test in Browser Console**:
   ```javascript
   fetch('YOUR_IMAGE_URL')
     .then(response => console.log('Status:', response.status))
     .catch(error => console.error('Error:', error));
   ```

2. **Check Network Tab**:
   - Open DevTools (F12)
   - Go to Network tab
   - Look for failed image requests
   - Check the error messages

### Step 5: Alternative - Use Placeholder Images

If you're not using Supabase Storage yet, the app will use placeholder avatars (initials). To enable actual image uploads:

1. **Create Storage Buckets**:
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('avatars', 'avatars', true);
   
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('post-images', 'post-images', true);
   ```

2. **Update Your Code** to upload images to these buckets

### Step 6: Redeploy to Vercel

After making Supabase changes:

```bash
cd fragments-test
vercel --prod
```

## Common Issues & Solutions

### Issue 1: CORS Error
**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution**: 
- Add your Vercel domain to Supabase allowed origins
- Or use `*` for all origins (less secure but works for testing)

### Issue 2: 404 Not Found
**Error**: Image returns 404

**Solution**:
- Verify the bucket exists
- Check the file path is correct
- Ensure the bucket is public

### Issue 3: 403 Forbidden
**Error**: Image returns 403

**Solution**:
- Check storage policies allow public read
- Verify the bucket is marked as public

### Issue 4: Images Work Locally But Not on Vercel
**Solution**:
- Check environment variables are set in Vercel
- Verify Supabase URL is correct
- Test the image URL directly in browser

## Testing Checklist

- [ ] Supabase Storage buckets created
- [ ] Buckets are marked as public
- [ ] CORS policy configured
- [ ] Storage policies allow public read
- [ ] Image URLs are correctly formatted
- [ ] Environment variables set in Vercel
- [ ] App redeployed to Vercel
- [ ] Images load in production

## Quick Test

Visit your deployed app and open the browser console. Run:

```javascript
// Test if Supabase is accessible
fetch('https://mxrljbfxcgzmkmtdedoi.supabase.co/rest/v1/')
  .then(r => r.json())
  .then(d => console.log('Supabase accessible:', d))
  .catch(e => console.error('Supabase error:', e));
```

If this works, the issue is specifically with Storage, not Supabase in general.

---

## Current Status

Your app is using:
- **Supabase URL**: `https://mxrljbfxcgzmkmtdedoi.supabase.co`
- **Deployed URL**: `https://fragments-test.vercel.app`

The most likely issue is that Supabase Storage buckets haven't been created yet, or CORS isn't configured. Follow the steps above to fix it!
