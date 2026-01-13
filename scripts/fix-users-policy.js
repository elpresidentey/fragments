#!/usr/bin/env node

/**
 * Apply the users policy fix for comments functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('You need SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  console.log('Get it from: https://supabase.com/dashboard/project/mxrljbfxcgzmkmtdedoi/settings/api');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyUsersPolicyFix() {
  console.log('🔧 Applying users policy fix for comments...');
  console.log('');

  try {
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'fix-users-policy-for-comments.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL fix...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.log('❌ Failed to apply fix:', error.message);
      console.log('');
      console.log('🔧 Manual fix required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/mxrljbfxcgzmkmtdedoi');
      console.log('2. Open SQL Editor');
      console.log('3. Run the SQL from: supabase/fix-users-policy-for-comments.sql');
      return false;
    }

    console.log('✅ Users policy fix applied successfully');
    console.log('');
    console.log('🧪 Testing the fix...');

    // Test the fix by trying the join query
    const { data: testData, error: testError } = await supabase
      .from('comments')
      .select(`
        id,
        user:users (
          name,
          avatar_url
        )
      `)
      .limit(1);

    if (testError) {
      console.log('❌ Test failed:', testError.message);
      return false;
    } else {
      console.log('✅ Join with users table now works!');
      return true;
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    return false;
  }
}

applyUsersPolicyFix().then(success => {
  if (success) {
    console.log('');
    console.log('🎉 Comments functionality should now work properly!');
  }
  process.exit(success ? 0 : 1);
});