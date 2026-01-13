// Populate sample data - Creates 30 users and posts for testing
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample users data
const sampleUsers = [
  { name: 'Alex Chen', email: 'demo1@fragments.app', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
  { name: 'Sarah Johnson', email: 'demo2@fragments.app', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face' },
  { name: 'Mike Rodriguez', email: 'demo3@fragments.app', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { name: 'Emily Davis', email: 'demo4@fragments.app', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
  { name: 'David Kim', email: 'demo5@fragments.app', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
  { name: 'Jessica Brown', email: 'demo6@fragments.app', avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face' },
  { name: 'Ryan Wilson', email: 'demo7@fragments.app', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150&h=150&fit=crop&crop=face' },
  { name: 'Amanda Taylor', email: 'demo8@fragments.app', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face' },
  { name: 'Chris Martinez', email: 'demo9@fragments.app', avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face' },
  { name: 'Lisa Anderson', email: 'demo10@fragments.app', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face' },
  { name: 'James Thompson', email: 'demo11@fragments.app', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
  { name: 'Maria Garcia', email: 'demo12@fragments.app', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
  { name: 'Kevin Lee', email: 'demo13@fragments.app', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face' },
  { name: 'Rachel White', email: 'demo14@fragments.app', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face' },
  { name: 'Daniel Harris', email: 'demo15@fragments.app', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face' },
  { name: 'Sophie Clark', email: 'demo16@fragments.app', avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=150&h=150&fit=crop&crop=face' },
  { name: 'Tyler Lewis', email: 'demo17@fragments.app', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face' },
  { name: 'Natalie Walker', email: 'demo18@fragments.app', avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face' },
  { name: 'Jordan Hall', email: 'demo19@fragments.app', avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face' },
  { name: 'Chloe Allen', email: 'demo20@fragments.app', avatar: 'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=150&h=150&fit=crop&crop=face' },
  { name: 'Marcus Young', email: 'demo21@fragments.app', avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&h=150&fit=crop&crop=face' },
  { name: 'Grace King', email: 'demo22@fragments.app', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face' },
  { name: 'Austin Wright', email: 'demo23@fragments.app', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face' },
  { name: 'Zoe Lopez', email: 'demo24@fragments.app', avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150&h=150&fit=crop&crop=face' },
  { name: 'Ethan Hill', email: 'demo25@fragments.app', avatar: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop&crop=face' },
  { name: 'Maya Scott', email: 'demo26@fragments.app', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face' },
  { name: 'Noah Green', email: 'demo27@fragments.app', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face' },
  { name: 'Ava Adams', email: 'demo28@fragments.app', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face' },
  { name: 'Lucas Baker', email: 'demo29@fragments.app', avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face' },
  { name: 'Mia Nelson', email: 'demo30@fragments.app', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face' }
];

// Sample post content
const samplePosts = [
  'Just shipped a new feature! 🚀 Excited to see how users respond to the improved workflow.',
  'Beautiful sunset today ☀️ Sometimes you need to step away from the code and appreciate the world around you.',
  'Working on some interesting React patterns. The new hooks API is really changing how we think about state management.',
  'Coffee shop coding session ☕ There\'s something about the ambient noise that helps me focus on complex problems.',
  'Debugging is like being a detective in a crime movie where you are also the murderer 🕵️‍♂️',
  'Just finished reading "Clean Code" - highly recommend it to any developer looking to improve their craft 📚',
  'TypeScript is growing on me. The type safety really helps catch bugs early in development 💪',
  'Anyone else excited about the new React 18 features? Concurrent rendering is a game changer!',
  'Late night coding session. Sometimes the best solutions come when the world is quiet 🌙',
  'Pair programming session went great today. Two minds really are better than one 👥',
  'Just deployed to production. That feeling never gets old! 🎉',
  'Learning Rust in my spare time. The memory safety guarantees are fascinating 🦀',
  'Code review feedback: "This is elegant!" Best compliment a developer can receive ✨',
  'Refactored 500 lines down to 50. Sometimes less really is more 🎯',
  'Docker containers make deployment so much easier. Remember the "works on my machine" days? 🐳',
  'Git merge conflicts resolved. Feeling like a merge master today! 🔀',
  'Testing is not just about finding bugs, it\'s about building confidence in your code 🧪',
  'Open source contribution accepted! Love giving back to the community 🤝',
  'CSS Grid is amazing. Remember when we used floats for everything? 📐',
  'Microservices vs monolith debate continues. Context matters more than architecture 🏗️',
  'API design is an art form. Good APIs feel intuitive and natural to use 🎨',
  'Database optimization saved 2 seconds on page load. Users will never know, but I do 📊',
  'Code documentation is love letters to your future self 💌',
  'Agile retrospective insights: communication beats process every time 🗣️',
  'Weekend project: building a CLI tool. Sometimes the best learning happens outside work hours 🛠️'
];

function generateRandomId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getRandomDate(daysAgo) {
  const now = new Date();
  const randomHours = Math.random() * 24 * daysAgo;
  return new Date(now.getTime() - randomHours * 60 * 60 * 1000);
}

async function populateData() {
  console.log('🔍 Starting sample data population...');
  
  try {
    // First, create tables if they don't exist
    console.log('📋 Creating tables...');
    
    // Clear existing sample data
    console.log('🧹 Clearing existing sample data...');
    await supabase.from('posts').delete().like('user_id', '%');
    await supabase.from('users').delete().like('email', 'demo%@fragments.app');
    
    // Insert users
    console.log('👥 Creating 30 sample users...');
    const usersToInsert = sampleUsers.map((user, index) => ({
      id: generateRandomId(),
      email: user.email,
      name: user.name,
      avatar_url: user.avatar,
      created_at: getRandomDate(30 - index).toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data: insertedUsers, error: usersError } = await supabase
      .from('users')
      .insert(usersToInsert)
      .select();
    
    if (usersError) {
      console.error('❌ Error creating users:', usersError);
      return;
    }
    
    console.log(`✅ Created ${insertedUsers.length} users`);
    
    // Insert posts
    console.log('📝 Creating sample posts...');
    const postsToInsert = [];
    
    insertedUsers.forEach(user => {
      // Each user gets 2-4 posts
      const numPosts = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numPosts; i++) {
        const randomPost = samplePosts[Math.floor(Math.random() * samplePosts.length)];
        postsToInsert.push({
          user_id: user.id,
          content: randomPost,
          created_at: getRandomDate(14).toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
    
    // Insert posts in batches to avoid hitting limits
    const batchSize = 20;
    let totalPosts = 0;
    
    for (let i = 0; i < postsToInsert.length; i += batchSize) {
      const batch = postsToInsert.slice(i, i + batchSize);
      const { data: insertedPosts, error: postsError } = await supabase
        .from('posts')
        .insert(batch);
      
      if (postsError) {
        console.error('❌ Error creating posts batch:', postsError);
        continue;
      }
      
      totalPosts += batch.length;
      console.log(`📝 Created batch of ${batch.length} posts (${totalPosts}/${postsToInsert.length})`);
    }
    
    console.log(`✅ Successfully created ${totalPosts} posts`);
    console.log('🎉 Sample data population complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${insertedUsers.length}`);
    console.log(`   📝 Posts: ${totalPosts}`);
    console.log('');
    console.log('🌐 Your feed should now be populated with sample content!');
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
  }
}

populateData().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});