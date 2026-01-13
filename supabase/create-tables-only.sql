-- CREATE TABLES ONLY - Simple table creation without triggers
-- Run this in Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that allow all operations for authenticated users
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.posts;

CREATE POLICY "Enable all operations for authenticated users" ON public.users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.posts TO service_role;

-- Enable realtime for posts (ignore errors if already exists)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication
END $$;

SELECT 'Tables created successfully' as status;