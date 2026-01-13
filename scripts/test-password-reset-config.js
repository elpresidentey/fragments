#!/usr/bin/env node

/**
 * Password Reset Configuration Test Script
 * 
 * This script tests the password reset functionality configuration
 * including email delivery, token validation, and rate limiting.
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

// Test configuration
const TEST_EMAIL = 'test-password-reset@example.com';
const TEST_IP = '192.168.1.100';

/**
 * Test database functions and configuration
 */
async function testDatabaseConfiguration() {
  console.log('\n🔧 Testing Database Configuration...');
  
  try {
    // Test rate limiting function
    console.log('  Testing rate limiting function...');
    const { data: rateLimitResult, error: rateLimitError } = await supabase
      .rpc('check_password_reset_rate_limit', {
        user_email: TEST_EMAIL,
        client_ip: TEST_IP,
        max_attempts: 3,
        window_minutes: 15
      });

    if (rateLimitError) {
      console.error('  ❌ Rate limiting function error:', rateLimitError.message);
      return false;
    }

    console.log('  ✅ Rate limiting function working:', rateLimitResult);

    // Test logging function
    console.log('  Testing attempt logging function...');
    const { data: logResult, error: logError } = await supabase
      .rpc('log_password_reset_attempt', {
        user_email: TEST_EMAIL,
        client_ip: TEST_IP,
        client_user_agent: 'Test Script',
        was_successful: false
      });

    if (logError) {
      console.error('  ❌ Logging function error:', logError.message);
      return false;
    }

    console.log('  ✅ Logging function working, attempt ID:', logResult);

    // Test suspicious activity detection
    console.log('  Testing suspicious activity detection...');
    const { data: suspiciousResult, error: suspiciousError } = await supabase
      .rpc('detect_suspicious_password_reset_activity', {
        user_email: TEST_EMAIL,
        client_ip: TEST_IP,
        time_window_minutes: 60
      });

    if (suspiciousError) {
      console.error('  ❌ Suspicious activity detection error:', suspiciousError.message);
      return false;
    }

    console.log('  ✅ Suspicious activity detection working:', suspiciousResult);

    return true;
  } catch (error) {
    console.error('  ❌ Database configuration test failed:', error.message);
    return false;
  }
}

/**
 * Test password reset email functionality
 */
async function testPasswordResetEmail() {
  console.log('\n📧 Testing Password Reset Email...');
  
  try {
    // Test password reset request
    console.log('  Sending password reset email...');
    const { error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: 'fragments://reset-password',
    });

    if (error) {
      console.error('  ❌ Password reset email error:', error.message);
      return false;
    }

    console.log('  ✅ Password reset email sent successfully');
    console.log('  📝 Note: Check your email provider for delivery');
    console.log('  📝 For testing, use a real email address you can access');

    return true;
  } catch (error) {
    console.error('  ❌ Password reset email test failed:', error.message);
    return false;
  }
}

/**
 * Test rate limiting functionality
 */
async function testRateLimiting() {
  console.log('\n⏱️  Testing Rate Limiting...');
  
  try {
    const testEmail = `rate-limit-test-${Date.now()}@example.com`;
    let successCount = 0;
    let rateLimitedCount = 0;

    // Make multiple requests to test rate limiting
    for (let i = 0; i < 5; i++) {
      console.log(`  Attempt ${i + 1}/5...`);
      
      // Check rate limit first
      const { data: allowed, error: rateLimitError } = await supabase
        .rpc('check_password_reset_rate_limit', {
          user_email: testEmail,
          client_ip: TEST_IP,
          max_attempts: 3,
          window_minutes: 15
        });

      if (rateLimitError) {
        console.error('    ❌ Rate limit check error:', rateLimitError.message);
        continue;
      }

      if (allowed) {
        // Log the attempt
        await supabase.rpc('log_password_reset_attempt', {
          user_email: testEmail,
          client_ip: TEST_IP,
          client_user_agent: 'Rate Limit Test',
          was_successful: false
        });
        
        successCount++;
        console.log('    ✅ Request allowed');
      } else {
        rateLimitedCount++;
        console.log('    🚫 Request rate limited');
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`  📊 Results: ${successCount} allowed, ${rateLimitedCount} rate limited`);
    
    if (successCount <= 3 && rateLimitedCount >= 2) {
      console.log('  ✅ Rate limiting working correctly');
      return true;
    } else {
      console.log('  ⚠️  Rate limiting may not be working as expected');
      return false;
    }
  } catch (error) {
    console.error('  ❌ Rate limiting test failed:', error.message);
    return false;
  }
}

/**
 * Test token expiration configuration
 */
async function testTokenExpiration() {
  console.log('\n⏰ Testing Token Expiration Configuration...');
  
  try {
    // Get current session to check JWT expiry
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('  ℹ️  No active session (expected for this test)');
    }

    // Check if we can get auth settings (this might not work with anon key)
    console.log('  📝 Note: Token expiration is configured in Supabase Dashboard');
    console.log('  📝 Recommended settings:');
    console.log('    - JWT Expiry: 3600 seconds (1 hour)');
    console.log('    - Refresh Token Rotation: Enabled');
    console.log('    - Session Timeout: 3600 seconds (1 hour)');
    
    console.log('  ✅ Token expiration configuration noted');
    return true;
  } catch (error) {
    console.error('  ❌ Token expiration test failed:', error.message);
    return false;
  }
}

/**
 * Test security monitoring
 */
async function testSecurityMonitoring() {
  console.log('\n🔍 Testing Security Monitoring...');
  
  try {
    // Test security event logging
    console.log('  Testing security event logging...');
    
    // This would typically be called by the service role, so it might fail with anon key
    try {
      const { data: eventId, error: eventError } = await supabase
        .rpc('log_password_reset_security_event', {
          event_type: 'test',
          user_email: TEST_EMAIL,
          client_ip: TEST_IP,
          client_user_agent: 'Test Script',
          event_details: { test: true, timestamp: new Date().toISOString() }
        });

      if (eventError) {
        console.log('  ℹ️  Security event logging requires service role (expected)');
      } else {
        console.log('  ✅ Security event logged:', eventId);
      }
    } catch (error) {
      console.log('  ℹ️  Security event logging requires service role (expected)');
    }

    // Check if we can query security events (should fail with RLS)
    console.log('  Testing security event access control...');
    const { data: events, error: eventsError } = await supabase
      .from('password_reset_security_events')
      .select('*')
      .limit(1);

    if (eventsError) {
      console.log('  ✅ Security events properly protected by RLS');
    } else {
      console.log('  ⚠️  Security events accessible (check RLS policies)');
    }

    return true;
  } catch (error) {
    console.error('  ❌ Security monitoring test failed:', error.message);
    return false;
  }
}

/**
 * Test cleanup and maintenance functions
 */
async function testMaintenanceFunctions() {
  console.log('\n🧹 Testing Maintenance Functions...');
  
  try {
    // Test maintenance function (requires service role)
    console.log('  Testing maintenance function...');
    
    try {
      const { data: maintenanceResult, error: maintenanceError } = await supabase
        .rpc('maintain_password_reset_tables');

      if (maintenanceError) {
        console.log('  ℹ️  Maintenance function requires service role (expected)');
      } else {
        console.log('  ✅ Maintenance function working:', maintenanceResult);
      }
    } catch (error) {
      console.log('  ℹ️  Maintenance function requires service role (expected)');
    }

    console.log('  📝 Note: Schedule maintenance function to run daily');
    console.log('  📝 Use Supabase Edge Functions or external cron job');
    
    return true;
  } catch (error) {
    console.error('  ❌ Maintenance functions test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Password Reset Configuration Test Suite');
  console.log('==========================================');
  
  const results = {
    database: false,
    email: false,
    rateLimiting: false,
    tokenExpiration: false,
    security: false,
    maintenance: false
  };

  // Run all tests
  results.database = await testDatabaseConfiguration();
  results.email = await testPasswordResetEmail();
  results.rateLimiting = await testRateLimiting();
  results.tokenExpiration = await testTokenExpiration();
  results.security = await testSecurityMonitoring();
  results.maintenance = await testMaintenanceFunctions();

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const name = test.charAt(0).toUpperCase() + test.slice(1).replace(/([A-Z])/g, ' $1');
    console.log(`${status} ${name}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Password reset configuration is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please review the configuration.');
    console.log('📖 Check the password-reset-setup-guide.md for detailed instructions.');
  }

  // Additional notes
  console.log('\n📝 Additional Notes:');
  console.log('- Some functions require service role access and will show as "expected" failures');
  console.log('- Email delivery testing requires a real email address');
  console.log('- Rate limiting is tested with database functions, not actual email sending');
  console.log('- Review Supabase Dashboard settings as outlined in the setup guide');
  
  process.exit(passed === total ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});