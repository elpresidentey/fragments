/**
 * Test Foreign Key Relationships
 * This script verifies that the foreign key relationships are properly set up
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testForeignKeys() {
  console.log('🔍 Testing Foreign Key Relationships...\n');

  try {
    // Test 1: Check if we can query comments with user data
    console.log('Test 1: Query comments with user relationship');
    const { data: commentsWithUsers, error: error1 } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        user:users(id, name, email)
      `)
      .limit(5);

    if (error1) {
      console.error('❌ Failed to query comments with users:', error1.message);
      console.error('   Details:', error1.details);
      console.error('   Hint:', error1.hint);
      return false;
    } else {
      console.log('✅ Successfully queried comments with user relationship');
      console.log(`   Found ${commentsWithUsers?.length || 0} comments`);
    }

    // Test 2: Check if we can query comments with post data
    console.log('\nTest 2: Query comments with post relationship');
    const { data: commentsWithPosts, error: error2 } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        post:posts(id, content)
      `)
      .limit(5);

    if (error2) {
      console.error('❌ Failed to query comments with posts:', error2.message);
      console.error('   Details:', error2.details);
      console.error('   Hint:', error2.hint);
      return false;
    } else {
      console.log('✅ Successfully queried comments with post relationship');
      console.log(`   Found ${commentsWithPosts?.length || 0} comments`);
    }

    // Test 3: Check if we can query posts with comments
    console.log('\nTest 3: Query posts with comments relationship');
    const { data: postsWithComments, error: error3 } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        comments(id, content, user:users(name))
      `)
      .limit(5);

    if (error3) {
      console.error('❌ Failed to query posts with comments:', error3.message);
      console.error('   Details:', error3.details);
      console.error('   Hint:', error3.hint);
      return false;
    } else {
      console.log('✅ Successfully queried posts with comments relationship');
      console.log(`   Found ${postsWithComments?.length || 0} posts`);
    }

    console.log('\n✅ All foreign key relationship tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - comments → users: Working ✓');
    console.log('   - comments → posts: Working ✓');
    console.log('   - posts → comments: Working ✓');
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the tests
testForeignKeys()
  .then(success => {
    if (success) {
      console.log('\n🎉 Foreign key relationships are properly configured!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Please run the fix script in Supabase SQL Editor:');
      console.log('   File: supabase/fix-comments-foreign-key.sql');
      console.log('   Or see: SUPABASE_FOREIGN_KEY_FIX.md for instructions');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
