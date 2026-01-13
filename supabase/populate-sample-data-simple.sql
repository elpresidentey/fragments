-- POPULATE SAMPLE DATA - Creates 30 users and posts for testing (without auth constraints)
-- Run this in Supabase SQL Editor

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table WITHOUT foreign key constraint to auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.users
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.posts TO service_role;

-- Insert 30 sample users
INSERT INTO public.users (email, name, avatar_url, created_at, updated_at) VALUES
('demo1@fragments.app', 'Alex Chen', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '30 days', NOW()),
('demo2@fragments.app', 'Sarah Johnson', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '29 days', NOW()),
('demo3@fragments.app', 'Mike Rodriguez', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '28 days', NOW()),
('demo4@fragments.app', 'Emily Davis', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '27 days', NOW()),
('demo5@fragments.app', 'David Kim', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '26 days', NOW()),
('demo6@fragments.app', 'Jessica Brown', 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '25 days', NOW()),
('demo7@fragments.app', 'Ryan Wilson', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '24 days', NOW()),
('demo8@fragments.app', 'Amanda Taylor', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '23 days', NOW()),
('demo9@fragments.app', 'Chris Martinez', 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '22 days', NOW()),
('demo10@fragments.app', 'Lisa Anderson', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '21 days', NOW()),
('demo11@fragments.app', 'James Thompson', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '20 days', NOW()),
('demo12@fragments.app', 'Maria Garcia', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '19 days', NOW()),
('demo13@fragments.app', 'Kevin Lee', 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '18 days', NOW()),
('demo14@fragments.app', 'Rachel White', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '17 days', NOW()),
('demo15@fragments.app', 'Daniel Harris', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '16 days', NOW()),
('demo16@fragments.app', 'Sophie Clark', 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '15 days', NOW()),
('demo17@fragments.app', 'Tyler Lewis', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '14 days', NOW()),
('demo18@fragments.app', 'Natalie Walker', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '13 days', NOW()),
('demo19@fragments.app', 'Jordan Hall', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '12 days', NOW()),
('demo20@fragments.app', 'Chloe Allen', 'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '11 days', NOW()),
('demo21@fragments.app', 'Marcus Young', 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '10 days', NOW()),
('demo22@fragments.app', 'Grace King', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '9 days', NOW()),
('demo23@fragments.app', 'Austin Wright', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '8 days', NOW()),
('demo24@fragments.app', 'Zoe Lopez', 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '7 days', NOW()),
('demo25@fragments.app', 'Ethan Hill', 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '6 days', NOW()),
('demo26@fragments.app', 'Maya Scott', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '5 days', NOW()),
('demo27@fragments.app', 'Noah Green', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '4 days', NOW()),
('demo28@fragments.app', 'Ava Adams', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '3 days', NOW()),
('demo29@fragments.app', 'Lucas Baker', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '2 days', NOW()),
('demo30@fragments.app', 'Mia Nelson', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face', NOW() - INTERVAL '1 day', NOW());

-- Insert sample posts for each user (2-4 posts per user)
WITH user_data AS (
  SELECT id, name FROM public.users WHERE email LIKE 'demo%@fragments.app'
)
INSERT INTO public.posts (user_id, content, created_at) 
SELECT 
  u.id,
  CASE 
    WHEN random() < 0.1 THEN 'Just shipped a new feature! 🚀 Excited to see how users respond to the improved workflow.'
    WHEN random() < 0.2 THEN 'Beautiful sunset today ☀️ Sometimes you need to step away from the code and appreciate the world around you.'
    WHEN random() < 0.3 THEN 'Working on some interesting React patterns. The new hooks API is really changing how we think about state management.'
    WHEN random() < 0.4 THEN 'Coffee shop coding session ☕ There''s something about the ambient noise that helps me focus on complex problems.'
    WHEN random() < 0.5 THEN 'Debugging is like being a detective in a crime movie where you are also the murderer 🕵️‍♂️'
    WHEN random() < 0.6 THEN 'Just finished reading "Clean Code" - highly recommend it to any developer looking to improve their craft 📚'
    WHEN random() < 0.7 THEN 'TypeScript is growing on me. The type safety really helps catch bugs early in development 💪'
    WHEN random() < 0.8 THEN 'Anyone else excited about the new React 18 features? Concurrent rendering is a game changer!'
    WHEN random() < 0.9 THEN 'Late night coding session. Sometimes the best solutions come when the world is quiet 🌙'
    ELSE 'Pair programming session went great today. Two minds really are better than one 👥'
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
  CASE (random() * 15)::int
    WHEN 0 THEN 'Just deployed to production. That feeling never gets old! 🎉'
    WHEN 1 THEN 'Learning Rust in my spare time. The memory safety guarantees are fascinating 🦀'
    WHEN 2 THEN 'Code review feedback: "This is elegant!" Best compliment a developer can receive ✨'
    WHEN 3 THEN 'Refactored 500 lines down to 50. Sometimes less really is more 🎯'
    WHEN 4 THEN 'Docker containers make deployment so much easier. Remember the "works on my machine" days? 🐳'
    WHEN 5 THEN 'Git merge conflicts resolved. Feeling like a merge master today! 🔀'
    WHEN 6 THEN 'Testing is not just about finding bugs, it''s about building confidence in your code 🧪'
    WHEN 7 THEN 'Open source contribution accepted! Love giving back to the community 🤝'
    WHEN 8 THEN 'CSS Grid is amazing. Remember when we used floats for everything? 📐'
    WHEN 9 THEN 'Microservices vs monolith debate continues. Context matters more than architecture 🏗️'
    WHEN 10 THEN 'API design is an art form. Good APIs feel intuitive and natural to use 🎨'
    WHEN 11 THEN 'Database optimization saved 2 seconds on page load. Users will never know, but I do 📊'
    WHEN 12 THEN 'Code documentation is love letters to your future self 💌'
    WHEN 13 THEN 'Agile retrospective insights: communication beats process every time 🗣️'
    ELSE 'Weekend project: building a CLI tool. Sometimes the best learning happens outside work hours 🛠️'
  END,
  NOW() - (random() * INTERVAL '14 days')
FROM user_data u
WHERE random() < 0.8; -- 80% of users get a second post

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

SELECT 'Sample data populated successfully! 30 users and ~90 posts created.' as status;