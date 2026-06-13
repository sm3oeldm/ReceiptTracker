const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debugProfileCheck() {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    display_name: 'Test User'
  };

  console.log('=== Debugging Profile Creation ===');

  try {
    console.log('\n1. Creating user with admin API...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Admin user creation failed:', authError.message);
      return;
    }

    console.log('✅ User created:', authData.user.id);

    console.log('\n2. Checking if profile exists immediately after user creation...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
      console.error('Error code:', profileError.code);
    } else if (profile && profile.length > 0) {
      console.log('✅ Profile already exists (likely from a trigger):');
      console.log(JSON.stringify(profile[0], null, 2));
    } else {
      console.log('✅ No profile exists yet');
    }

    console.log('\n3. Trying to upsert profile...');
    const { data: upsertData, error: upsertError } = await supabase
      .from('profiles')
      .upsert([{ id: authData.user.id, display_name: testUser.display_name }], {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('❌ Upsert failed:', upsertError.message);
      console.error('Error code:', upsertError.code);
      console.error('Details:', upsertError.details);
    } else {
      console.log('✅ Upsert successful');
      console.log('Data:', upsertData);
    }

  } catch (error) {
    console.error('❌ Exception:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugProfileCheck();
