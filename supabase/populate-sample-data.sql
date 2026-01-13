-- POPULATE SAMPLE DATA - Creates 30 users and posts for testing
-- Run this in Supabase SQL Editor AFTER creating the tables

-- First, create the tables if they don't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.posts;

CREATE POLICY "Enable all operations for authenticated users" ON public.users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.posts TO service_role;

-- Clear existing sample data
DELETE FROM public.posts WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE 'demo%@fragments.app'
);
DELETE FROM public.users WHERE email LIKE 'demo%@fragments.app';

-- Insert 30 sample users
INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at) VALUES
(gen_random_uuid(), 'demo1@fragments.app', 'Alex Chen', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '30 days', NOW()),
(gen_random_uuid(), 'demo2@fragments.app', 'Sarah Johnson', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '29 days', NOW()),
(gen_random_uuid(), 'demo3@fragments.app', 'Mike Rodriguez', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '28 days', NOW()),
(gen_random_uuid(), 'demo4@fragments.app', 'Emily Davis', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '27 days', NOW()),
(gen_random_uuid(), 'demo5@fragments.app', 'David Kim', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '26 days', NOW()),
(gen_random_uuid(), 'demo6@fragments.app', 'Jessica Brown', 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '25 days', NOW()),
(gen_random_uuid(), 'demo7@fragments.app', 'Ryan Wilson', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '24 days', NOW()),
(gen_random_uuid(), 'demo8@fragments.app', 'Amanda Taylor', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '23 days', NOW()),
(gen_random_uuid(), 'demo9@fragments.app', 'Chris Martinez', 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '22 days', NOW()),
(gen_random_uuid(), 'demo10@fragments.app', 'Lisa Anderson', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '21 days', NOW()),
(gen_random_uuid(), 'demo11@fragments.app', 'James Thompson', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '20 days', NOW()),
(gen_random_uuid(), 'demo12@fragments.app', 'Maria Garcia', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '19 days', NOW()),
(gen_random_uuid(), 'demo13@fragments.app', 'Kevin Lee', 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '18 days', NOW()),
(gen_random_uuid(), 'demo14@fragments.app', 'Rachel White', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '17 days', NOW()),
(gen_random_uuid(), 'demo15@fragments.app', 'Daniel Harris', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '16 days', NOW()),
(gen_random_uuid(), 'demo16@fragments.app', 'Sophie Clark', 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '15 days', NOW()),
(gen_random_uuid(), 'demo17@fragments.app', 'Tyler Lewis', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '14 days', NOW()),
(gen_random_uuid(), 'demo18@fragments.app', 'Natalie Walker', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '13 days', NOW()),
(gen_random_uuid(), 'demo19@fragments.app', 'Jordan Hall', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '12 days', NOW()),
(gen_random_uuid(), 'demo20@fragments.app', 'Chloe Allen', 'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '11 days', NOW()),
(gen_random_uuid(), 'demo21@fragments.app', 'Marcus Young', 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '10 days', NOW()),
(gen_random_uuid(), 'demo22@fragments.app', 'Grace King', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '9 days', NOW()),
(gen_random_uuid(), 'demo23@fragments.app', 'Austin Wright', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '8 days', NOW()),
(gen_random_uuid(), 'demo24@fragments.app', 'Zoe Lopez', 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '7 days', NOW()),
(gen_random_uuid(), 'demo25@fragments.app', 'Ethan Hill', 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '6 days', NOW()),
(gen_random_uuid(), 'demo26@fragments.app', 'Maya Scott', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '5 days', NOW()),
(gen_random_uuid(), 'demo27@fragments.app', 'Noah Green', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '4 days', NOW()),
(gen_random_uuid(), 'demo28@fragments.app', 'Ava Adams', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '3 days', NOW()),
(gen_random_uuid(), 'demo29@fragments.app', 'Lucas Baker', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '2 days', NOW()),
(gen_random_uuid(), 'demo30@fragments.app', 'Mia Nelson', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '1 day', NOW());

-- Insert sample posts for each user (2-4 posts per user)
WITH user_data AS (
  SELECT id, name FROM public.users WHERE email LIKE 'demo%@fragments.app'
)
INSERT INTO public.posts (user_id, content, created_at) 
SELECT 
  u.id,
  CASE 
    WHEN random() < 0.2 THEN 'Just shipped a new feature! 🚀 Excited to see how users respond to the improved workflow.'
    WHEN random() < 0.4 THEN 'Beautiful sunset today ☀️ Sometimes you need to step away from the code and appreciate the world around you.'
    WHEN random() < 0.6 THEN 'Working on some interesting React patterns. The new hooks API is really changing how we think about state management.'
    WHEN random() < 0.8 THEN 'Coffee shop coding session ☕ There''s something about the ambient noise that helps me focus on complex problems.'
    ELSE 'Debugging is like being a detective in a crime movie where you are also the murderer 🕵️‍♂️'
  END,
  NOW() - (random() * INTERVAL '7 days')
FROM user_data u
CROSS JOIN generate_series(1, floor(random() * 3 + 2)::int);

-- Add more varied content
WITH user_data AS (
  SELECT id, name FROM public.users WHERE email LIKE 'demo%@fragments.app'
)
INSERT INTO public.posts (user_id, content, created_at) 
SELECT 
  u.id,
  CASE (random() * 20)::int
    WHEN 0 THEN 'Just finished reading "Clean Code" - highly recommend it to any developer looking to improve their craft 📚'
    WHEN 1 THEN 'TypeScript is growing on me. The type safety really helps catch bugs early in development 💪'
    WHEN 2 THEN 'Anyone else excited about the new React 18 features? Concurrent rendering is a game changer!'
    WHEN 3 THEN 'Late night coding session. Sometimes the best solutions come when the world is quiet 🌙'
    WHEN 4 THEN 'Pair programming session went great today. Two minds really are better than one 👥'
    WHEN 5 THEN 'Just deployed to production. That feeling never gets old! 🎉'
    WHEN 6 THEN 'Learning Rust in my spare time. The memory safety guarantees are fascinating 🦀'
    WHEN 7 THEN 'Code review feedback: "This is elegant!" Best compliment a developer can receive ✨'
    WHEN 8 THEN 'Refactored 500 lines down to 50. Sometimes less really is more 🎯'
    WHEN 9 THEN 'Docker containers make deployment so much easier. Remember the "works on my machine" days? 🐳'
    WHEN 10 THEN 'Git merge conflicts resolved. Feeling like a merge master today! 🔀'
    WHEN 11 THEN 'Testing is not just about finding bugs, it''s about building confidence in your code 🧪'
    WHEN 12 THEN 'Open source contribution accepted! Love giving back to the community 🤝'
    WHEN 13 THEN 'CSS Grid is amazing. Remember when we used floats for everything? 📐'
    WHEN 14 THEN 'Microservices vs monolith debate continues. Context matters more than architecture 🏗️'
    WHEN 15 THEN 'API design is an art form. Good APIs feel intuitive and natural to use 🎨'
    WHEN 16 THEN 'Database optimization saved 2 seconds on page load. Users will never know, but I do 📊'
    WHEN 17 THEN 'Code documentation is love letters to your future self 💌'
    WHEN 18 THEN 'Agile retrospective insights: communication beats process every time 🗣️'
    ELSE 'Weekend project: building a CLI tool. Sometimes the best learning happens outside work hours 🛠️'
  END,
  NOW() - (random() * INTERVAL '14 days')
FROM user_data u
WHERE random() < 0.7; -- Only 70% of users get a second post

SELECT 'Sample data populated successfully! 30 users and ~90 posts created.' as status;