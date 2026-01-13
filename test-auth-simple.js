// Simple auth test - no database dependencies
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
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

async function testAuth() {
  console.log('🔍 Testing minimal auth signup...');
  
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log(`Testing with email: ${testEmail}`);
    
    // Test minimal signup
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.error('❌ Auth signup failed:', error.message);
      return false;
    }
    
    console.log('✅ Auth signup successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email confirmed:', !!data.session);
    
    // Clean up
    if (data.session) {
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
}

testAuth().then(success => {
  if (success) {
    console.log('🎉 Auth test passed! Authentication is working.');
  } else {
    console.log('💥 Auth test failed.');
  }
  process.exit(success ? 0 : 1);
});