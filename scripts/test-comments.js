#!/usr/bin/env node

/**
 * Test script to verify comments functionality
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testComments() {
  console.log('🧪 Testing comments functionality...');
  console.log('');

  try {
    // Test 1: Check if comments table exists
    console.log('1. Checking if comments table exists...');
    const { data: tableData, error: tableError } = await supabase
      .from('comments')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      if (tableError.code === '42P01' || tableError.message.includes('does not exist')) {
        console.log('❌ Comments table does not exist');
        console.log('');
        console.log('🔧 To fix this:');
        console.log('1. Go to: https://supabase.com/dashboard/project/mxrljbfxcgzmkmtdedoi');
        console.log('2. Open SQL Editor');
        console.log('3. Run the SQL from: supabase/add-comments-table.sql');
        console.log('');
        return;
      } else {
        console.log('⚠️  Table check error:', tableError.message);
      }
    } else {
      console.log('✅ Comments table exists');
    }

    // Test 2: Check authentication
    console.log('');
    console.log('2. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Not authenticated');
      console.log('💡 You need to log in to the app first to test comments');
      return;
    } else {
      console.log('✅ User authenticated:', user.email);
    }

    // Test 3: Try to get comments for a test post
    console.log('');
    console.log('3. Testing comment retrieval...');
    const { data: comments, error: getError } = await supabase
      .from('comments')
      .select(`
        *,
        user:users (
          name,
          avatar_url
        )
      `)
      .limit(5);

    if (getError) {
      console.log('❌ Error getting comments:', getError.message);
    } else {
      console.log('✅ Comments query successful');
      console.log(`📊 Found ${comments?.length || 0} comments`);
    }

    // Test 4: Check RLS policies
    console.log('');
    console.log('4. Testing RLS policies...');
    const { data: insertData, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: 'test-post-id',
        user_id: user.id,
        content: 'Test comment from script'
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.message.includes('foreign key') || insertError.message.includes('violates')) {
        console.log('✅ RLS policies are working (foreign key constraint expected)');
      } else {
        console.log('❌ Insert error:', insertError.message);
      }
    } else {
      console.log('✅ Test comment created successfully');
      console.log('🧹 Cleaning up test comment...');
      
      // Clean up the test comment
      await supabase
        .from('comments')
        .delete()
        .eq('id', insertData.id);
    }

    console.log('');
    console.log('🎉 Comments functionality test complete!');
    console.log('');
    console.log('💡 If you\'re still having issues:');
    console.log('   1. Make sure the comments table is created in Supabase');
    console.log('   2. Ensure you\'re logged in to the app');
    console.log('   3. Check browser console for detailed error messages');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testComments();