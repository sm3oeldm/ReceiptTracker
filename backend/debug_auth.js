const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('=== Debugging Supabase Auth ===');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY length:', process.env.SUPABASE_SERVICE_KEY?.length || 0);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debugAuth() {
  try {
    console.log('\n1. Testing database connection...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (catError) {
      console.log('❌ Database error:', catError.message);
      console.log('Error code:', catError.code);
      console.log('Error details:', catError.details);
    } else {
      console.log('✅ Database connection works!');
      console.log('Found categories:', categories?.length);
    }

    console.log('\n2. Testing auth signup...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'debug@example.com',
      password: 'password123',
    });

    if (authError) {
      console.log('❌ Auth error:', authError.message);
      console.log('Error code:', authError.code);
      console.log('Error status:', authError.status);
      console.log('Full error:', JSON.stringify(authError, null, 2));
    } else {
      console.log('✅ Auth signup works!');
      console.log('User ID:', authData.user?.id);
    }

  } catch (error) {
    console.log('❌ Exception caught:');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
  }
}

debugAuth();