const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing Supabase auth directly...');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testAuth() {
  try {
    console.log('Testing user signup...');

    const { data, error } = await supabase.auth.signUp({
      email: `test${Date.now()}@example.com`,
      password: 'password123',
    });

    if (error) {
      console.error('❌ Supabase auth error:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Supabase auth successful!');
      console.log('User data:', data);
    }
  } catch (err) {
    console.error('❌ Exception in auth test:', err.message);
    console.error('Full error:', err);
  }
}

testAuth();