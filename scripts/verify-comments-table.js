#!/usr/bin/env node

/**
 * Verify comments table exists and is accessible
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

// Create Supabase client with same config as app
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

async function verifyCommentsTable() {
  console.log('🔍 Verifying comments table...');
  console.log('');

  try {
    // Test 1: Simple table existence check
    console.log('1. Testing table existence...');
    const { data, error } = await supabase
      .from('comments')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Table check failed:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error.details);
      return false;
    } else {
      console.log('✅ Comments table exists and is accessible');
    }

    // Test 2: Test schema structure
    console.log('');
    console.log('2. Testing table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('comments')
      .select('id, post_id, user_id, content, created_at, updated_at')
      .limit(1);

    if (schemaError) {
      console.log('❌ Schema check failed:', schemaError.message);
      return false;
    } else {
      console.log('✅ Table schema is correct');
    }

    // Test 3: Test join with users table
    console.log('');
    console.log('3. Testing join with users table...');
    const { data: joinData, error: joinError } = await supabase
      .from('comments')
      .select(`
        id,
        user:users (
          name,
          avatar_url
        )
      `)
      .limit(1);

    if (joinError) {
      console.log('❌ Join test failed:', joinError.message);
      return false;
    } else {
      console.log('✅ Join with users table works');
    }

    console.log('');
    console.log('🎉 All checks passed! Comments table is ready.');
    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

verifyCommentsTable().then(success => {
  process.exit(success ? 0 : 1);
});