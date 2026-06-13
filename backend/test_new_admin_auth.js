const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing admin user creation with new email...');

const adminClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testAdminAuth() {
  try {
    // Use a unique email
    const uniqueEmail = `newuser${Date.now()}@example.com`;
    console.log('Creating user:', uniqueEmail);

    const { data, error } = await adminClient.auth.admin.createUser({
      email: uniqueEmail,
      password: 'password123',
      email_confirm: true,
    });

    if (error) {
      console.error('❌ Admin auth error:', error.message);
      console.error('Error code:', error.code);
    } else {
      console.log('✅ Admin user creation successful!');
      console.log('User ID:', data.user?.id);

      // Test login
      console.log('\nTesting login...');
      const { data: loginData, error: loginError } = await adminClient.auth.signInWithPassword({
        email: uniqueEmail,
        password: 'password123',
      });

      if (loginError) {
        console.error('❌ Login failed:', loginError.message);
      } else {
        console.log('✅ Login successful!');
        console.log('Token:', loginData.session?.access_token ? 'PRESENT' : 'MISSING');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testAdminAuth();