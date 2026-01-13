-- COMPLETE DATABASE RESET - This will fix the "Database error saving new user" issue
-- Run this in Supabase SQL Editor

-- 1. Drop everything related to our custom tables and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Clean up any existing publications
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.posts;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if table wasn't in publication
END $$;

-- 3. Create users table with minimal structure
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

-- 6. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 7. Create simple RLS policies
CREATE POLICY "Enable all operations for authenticated users" ON public.users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- 9. Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.posts TO service_role;

SELECT 'Database completely reset - no triggers, simple RLS policies' as status;