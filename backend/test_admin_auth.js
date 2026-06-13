const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing admin user creation (bypasses email rate limit)...');

const adminClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testAdminAuth() {
  try {
    console.log('Creating user via admin API...');

    const { data, error } = await adminClient.auth.admin.createUser({
      email: 'admin_test@example.com',
      password: 'password123',
      email_confirm: true,  // Skip email confirmation
    });

    if (error) {
      console.error('❌ Admin auth error:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.status);
    } else {
      console.log('✅ Admin user creation successful!');
      console.log('User ID:', data.user?.id);
      console.log('User email:', data.user?.email);

      // Now try to login with this user
      console.log('\nTesting login with created user...');
      const { data: loginData, error: loginError } = await adminClient.auth.signInWithPassword({
        email: 'admin_test@example.com',
        password: 'password123',
      });

      if (loginError) {
        console.error('❌ Login failed:', loginError.message);
      } else {
        console.log('✅ Login successful!');
        console.log('Access token:', loginData.session?.access_token ? 'PRESENT' : 'MISSING');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testAdminAuth();