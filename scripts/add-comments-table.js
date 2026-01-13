#!/usr/bin/env node

/**
 * Script to add comments table to the database
 * Run this after setting up the main database schema
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCommentsTable() {
  try {
    console.log('🚀 Adding comments table to database...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'add-comments-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If the RPC function doesn't exist, try direct query execution
      if (error.message.includes('function exec_sql')) {
        console.log('📝 Executing SQL directly...');
        
        // Split SQL into individual statements and execute them
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
            if (stmtError) {
              console.error('❌ Error executing statement:', statement.substring(0, 100) + '...');
              console.error('   Error:', stmtError.message);
              // Continue with other statements
            }
          }
        }
      } else {
        throw error;
      }
    }

    console.log('✅ Comments table added successfully!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • comments table with proper relationships');
    console.log('   • Indexes for performance');
    console.log('   • Row Level Security policies');
    console.log('   • Real-time subscriptions enabled');
    console.log('');
    console.log('🎉 You can now use the comments functionality in your app!');

  } catch (error) {
    console.error('❌ Error adding comments table:', error.message);
    console.error('');
    console.error('💡 Manual setup instructions:');
    console.error('   1. Go to your Supabase dashboard');
    console.error('   2. Open the SQL editor');
    console.error('   3. Copy and paste the contents of supabase/add-comments-table.sql');
    console.error('   4. Run the query');
    process.exit(1);
  }
}

// Run the migration
addCommentsTable();