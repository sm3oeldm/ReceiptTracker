const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '*** (present)' : 'MISSING');

try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  console.log('✅ Supabase client created successfully');

  // Test a simple query
  async function testConnection() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Supabase query error:', error.message);
        console.error('Full error:', error);
      } else {
        console.log('✅ Supabase connection successful!');
        console.log('Found categories:', data ? data.length : 0);
      }
    } catch (err) {
      console.error('❌ Exception during Supabase test:', err.message);
      console.error('Full exception:', err);
    }
  }

  testConnection();

} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message);
  console.error('Full error:', error);
}