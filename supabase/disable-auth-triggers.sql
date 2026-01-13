-- DISABLE ALL AUTH TRIGGERS - Run this first to stop database errors
-- This will completely disable any problematic triggers

-- Drop all existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

SELECT 'All triggers and tables dropped successfully' as status;