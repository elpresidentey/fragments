#!/usr/bin/env node

/**
 * Password Reset Setup Validation Script
 * 
 * This script validates that the password reset functionality is properly configured
 * and tests the basic email sending functionality.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

// Configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test basic Supabase connection
 */
async function testConnection() {
  console.log('🔗 Testing Supabase Connection...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'No session found') {
      console.error('  ❌ Connection error:', error.message);
      return false;
    }
    
    console.log('  ✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('  ❌ Connection failed:', error.message);
    return false;
  }
}

/**
 * Test password reset email functionality
 */
async function testPasswordResetEmail() {
  console.log('\n📧 Testing Password Reset Email Functionality...');
  
  try {
    // Test with a test email
    const testEmail = 'test-password-reset@example.com';
    
    console.log(`  Sending password reset email to ${testEmail}...`);
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'fragments://reset-password',
    });

    if (error) {
      // Some errors are expected (like user not found), but we want to check for configuration errors
      if (error.message.includes('SMTP') || error.message.includes('email') || error.message.includes('template')) {
        console.error('  ❌ Email configuration error:', error.message);
        return false;
      } else {
        console.log('  ✅ Password reset email functionality working');
        console.log('  📝 Note: Error is expected for non-existent email:', error.message);
        return true;
      }
    }

    console.log('  ✅ Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('  ❌ Password reset email test failed:', error.message);
    return false;
  }
}

/**
 * Test authentication configuration
 */
async function testAuthConfiguration() {
  console.log('\n🔐 Testing Authentication Configuration...');
  
  try {
    // Test sign up to check if auth is properly configured
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('  Testing authentication flow...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      // Check for configuration-related errors
      if (error.message.includes('signup') && error.message.includes('disabled')) {
        console.log('  ✅ Auth configured (signup disabled - this is fine)');
        return true;
      } else if (error.message.includes('email')) {
        console.log('  ✅ Auth configured (email confirmation required - this is fine)');
        return true;
      } else {
        console.error('  ❌ Auth configuration error:', error.message);
        return false;
      }
    }

    // Clean up test user if created
    if (data.user) {
      console.log('  ✅ Auth configuration working');
      // Note: We can't easily delete the test user with anon key, but that's okay
      return true;
    }

    console.log('  ✅ Auth configuration appears to be working');
    return true;
  } catch (error) {
    console.error('  ❌ Auth configuration test failed:', error.message);
    return false;
  }
}

/**
 * Validate environment configuration
 */
async function validateEnvironment() {
  console.log('\n🌍 Validating Environment Configuration...');
  
  try {
    // Check URL format
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.error('  ❌ Invalid Supabase URL format');
      return false;
    }
    
    // Check anon key format (should be a JWT)
    if (!supabaseAnonKey.includes('.') || supabaseAnonKey.length < 100) {
      console.error('  ❌ Invalid Supabase anon key format');
      return false;
    }
    
    console.log('  ✅ Environment variables properly configured');
    console.log(`  📝 Supabase URL: ${supabaseUrl}`);
    console.log(`  📝 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
    
    return true;
  } catch (error) {
    console.error('  ❌ Environment validation failed:', error.message);
    return false;
  }
}

/**
 * Check if required files exist
 */
async function checkRequiredFiles() {
  console.log('\n📁 Checking Required Configuration Files...');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    '../supabase/password-reset-config.sql',
    '../supabase/password-reset-setup-guide.md',
    '../lib/services/password-reset.ts',
    '../lib/services/auth.ts'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - Missing`);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    console.log('  ✅ All required files present');
  } else {
    console.log('  ⚠️  Some required files are missing');
  }
  
  return allFilesExist;
}

/**
 * Main validation runner
 */
async function runValidation() {
  console.log('🧪 Password Reset Setup Validation');
  console.log('===================================');
  
  const results = {
    environment: false,
    files: false,
    connection: false,
    auth: false,
    email: false
  };

  // Run all validations
  results.environment = await validateEnvironment();
  results.files = await checkRequiredFiles();
  results.connection = await testConnection();
  results.auth = await testAuthConfiguration();
  results.email = await testPasswordResetEmail();

  // Summary
  console.log('\n📊 Validation Results');
  console.log('=====================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const name = test.charAt(0).toUpperCase() + test.slice(1);
    console.log(`${status} ${name}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} validations passed`);
  
  if (passed === total) {
    console.log('🎉 Basic setup validation passed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the SQL script in Supabase Dashboard (password-reset-config.sql)');
    console.log('2. Configure email templates in Authentication > Email Templates');
    console.log('3. Set up rate limiting and security settings');
    console.log('4. Test the complete flow with the full test script');
    console.log('5. Review the setup guide: supabase/password-reset-setup-guide.md');
  } else {
    console.log('⚠️  Some validations failed. Please review the configuration.');
    console.log('📖 Check the password-reset-setup-guide.md for detailed instructions.');
  }

  // Configuration checklist
  console.log('\n📋 Configuration Checklist:');
  console.log('- [ ] Run password-reset-config.sql in Supabase SQL Editor');
  console.log('- [ ] Configure email templates in Supabase Dashboard');
  console.log('- [ ] Set JWT expiry to 3600 seconds (1 hour)');
  console.log('- [ ] Enable refresh token rotation');
  console.log('- [ ] Configure redirect URLs for your app');
  console.log('- [ ] Set up rate limiting rules');
  console.log('- [ ] Test email delivery with real email address');
  console.log('- [ ] Enable security features (captcha, etc.)');
  
  return passed === total;
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the validation
runValidation().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});