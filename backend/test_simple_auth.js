const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing Supabase auth with simple email...');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testAuth() {
  try {
    console.log('Testing user signup with simple email...');

    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });

    if (error) {
      console.error('❌ Supabase auth error:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.status);
    } else {
      console.log('✅ Supabase auth successful!');
      console.log('User:', data.user?.email);
      console.log('Session:', data.session ? 'Created' : 'No session');
    }
  } catch (err) {
    console.error('❌ Exception in auth test:', err.message);
  }
}

testAuth();