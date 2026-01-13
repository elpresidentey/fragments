-- Fix users table RLS policy to allow comments to display user information
-- This allows authenticated users to view basic profile info (name, avatar) of other users
-- which is needed for displaying comment authors

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create a new policy that allows authenticated users to view basic profile info
CREATE POLICY "Authenticated users can view basic profile info" ON users
  FOR SELECT TO authenticated USING (true);

-- Keep the update and insert policies restrictive (users can only modify their own profile)
-- These should already exist from the main setup, but let's ensure they're correct

DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);