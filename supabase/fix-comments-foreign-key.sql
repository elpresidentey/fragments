-- Fix Comments Foreign Key Relationship Issue
-- This script ensures the foreign key relationship is properly set up and refreshes the schema cache

-- First, check if the comments table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
        RAISE NOTICE 'Comments table does not exist. Creating it now...';
        
        -- Create comments table
        CREATE TABLE comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL,
          user_id UUID NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Drop existing foreign key constraints if they exist
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_post;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_user;

-- Add foreign key constraints with explicit names
ALTER TABLE comments 
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE comments 
  ADD CONSTRAINT comments_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES posts(id) 
  ON DELETE CASCADE;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Authenticated users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Create RLS policies
CREATE POLICY "Authenticated users can view comments" ON comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Refresh the schema cache (this is the key part)
NOTIFY pgrst, 'reload schema';

-- Verify the foreign keys exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='comments'
  AND tc.table_schema='public';
