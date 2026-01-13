#!/usr/bin/env node

/**
 * Script to check if comments table exists and create it if needed
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCommentsTable() {
  try {
    console.log('🔍 Checking if comments table exists...');

    // Try to query the comments table
    const { data, error } = await supabase
      .from('comments')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.code === '42P01') {
        console.log('❌ Comments table does not exist');
        console.log('');
        console.log('📋 To fix this, you need to create the comments table:');
        console.log('');
        console.log('1. Go to your Supabase Dashboard:');
        console.log('   https://supabase.com/dashboard/project/mxrljbfxcgzmkmtdedoi');
        console.log('');
        console.log('2. Navigate to SQL Editor');
        console.log('');
        console.log('3. Copy and paste this SQL:');
        console.log('');
        
        // Read and display the SQL
        const sqlPath = path.join(__dirname, '..', 'supabase', 'add-comments-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('```sql');
        console.log(sql);
        console.log('```');
        console.log('');
        console.log('4. Click "Run" to execute the query');
        console.log('');
        console.log('5. Refresh your app and try commenting again');
        
        return false;
      } else {
        console.error('❌ Error checking comments table:', error.message);
        return false;
      }
    }

    console.log('✅ Comments table exists!');
    console.log(`📊 Current comment count: ${data?.length || 0}`);
    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Test comment creation
async function testCommentCreation() {
  try {
    console.log('🧪 Testing comment creation...');

    // Try to create a test comment (this will fail due to RLS, but will tell us if table exists)
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: 'test-post-id',
        user_id: 'test-user-id',
        content: 'Test comment'
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('permission denied') || error.message.includes('RLS')) {
        console.log('✅ Comments table exists (RLS is working correctly)');
        console.log('💡 You need to be authenticated to create comments');
        return true;
      } else if (error.message.includes('does not exist')) {
        console.log('❌ Comments table does not exist');
        return false;
      } else {
        console.log('⚠️  Unexpected error:', error.message);
        return false;
      }
    }

    console.log('✅ Test comment created successfully');
    return true;

  } catch (error) {
    console.error('❌ Error testing comment creation:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Checking comments functionality...');
  console.log('');

  const tableExists = await checkCommentsTable();
  
  if (tableExists) {
    await testCommentCreation();
  }

  console.log('');
  console.log('🔧 If you continue having issues:');
  console.log('   1. Make sure you\'re logged in to the app');
  console.log('   2. Check the browser console for error messages');
  console.log('   3. Verify the comments table was created correctly');
}

main();