# 🔧 Fix Supabase Foreign Key Relationship Error

## Error Description
```
PGRST200: Could not find a relationship between 'comments' and 'users' in the schema cache
```

This error occurs when Supabase's PostgREST schema cache doesn't recognize the foreign key relationship between tables, even if it exists in the database.

## Solution

### Option 1: Run SQL Script (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix Script**
   - Copy the contents of `supabase/fix-comments-foreign-key.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify the Fix**
   - The script will output the foreign key relationships
   - You should see two rows showing the relationships between comments→users and comments→posts

### Option 2: Manual Schema Cache Refresh

If the SQL script doesn't work, try manually refreshing the schema cache:

1. **Go to Supabase Dashboard → Settings → API**

2. **Find "PostgREST Schema Cache"**

3. **Click "Reload Schema"** or run this SQL:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### Option 3: Recreate the Comments Table

If the above doesn't work, recreate the table:

1. **Backup existing comments** (if any):
   ```sql
   CREATE TABLE comments_backup AS SELECT * FROM comments;
   ```

2. **Drop and recreate**:
   ```sql
   DROP TABLE IF EXISTS comments CASCADE;
   
   CREATE TABLE comments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create indexes
   CREATE INDEX idx_comments_post_id ON comments(post_id);
   CREATE INDEX idx_comments_user_id ON comments(user_id);
   CREATE INDEX idx_comments_created_at ON comments(created_at ASC);
   
   -- Enable RLS
   ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
   
   -- Add policies
   CREATE POLICY "Authenticated users can view comments" ON comments
     FOR SELECT TO authenticated USING (true);
   
   CREATE POLICY "Users can create comments" ON comments
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can update own comments" ON comments
     FOR UPDATE USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can delete own comments" ON comments
     FOR DELETE USING (auth.uid() = user_id);
   
   -- Enable realtime
   ALTER PUBLICATION supabase_realtime ADD TABLE comments;
   
   -- Refresh schema cache
   NOTIFY pgrst, 'reload schema';
   ```

3. **Restore data** (if you had any):
   ```sql
   INSERT INTO comments SELECT * FROM comments_backup;
   DROP TABLE comments_backup;
   ```

## Verification

After applying the fix, verify it works:

1. **Check Foreign Keys Exist**:
   ```sql
   SELECT 
       tc.constraint_name, 
       tc.table_name, 
       kcu.column_name, 
       ccu.table_name AS foreign_table_name
   FROM 
       information_schema.table_constraints AS tc 
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' 
     AND tc.table_name='comments';
   ```

2. **Test the API**:
   - Try creating a comment in your app
   - The error should be gone

## Why This Happens

This error typically occurs when:
1. The comments table was created after the initial schema load
2. The foreign keys were added later
3. PostgREST's schema cache wasn't refreshed
4. There was a deployment or migration issue

## Prevention

To prevent this in the future:
1. Always run `NOTIFY pgrst, 'reload schema';` after schema changes
2. Use Supabase migrations for schema changes
3. Restart your Supabase project if needed (Settings → General → Restart Project)

## Still Having Issues?

If the error persists:

1. **Restart your Supabase project**:
   - Go to Settings → General
   - Click "Restart Project"
   - Wait 2-3 minutes

2. **Check API logs**:
   - Go to Logs → API Logs
   - Look for any schema-related errors

3. **Contact Support**:
   - If nothing works, contact Supabase support with the error details

---

## Quick Fix Command

Run this single command in Supabase SQL Editor:

```sql
-- Quick fix: Ensure foreign keys exist and refresh cache
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE comments ADD CONSTRAINT comments_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
```

This should resolve the issue immediately! ✅
