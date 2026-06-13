const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debugRegistration() {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    display_name: 'Test User'
  };

  console.log('=== Debugging Registration ===');
  console.log('Test email:', testUser.email);

  try {
    console.log('\n1. Creating user with admin API...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Admin user creation failed:', authError.message);
      console.error('Full error:', JSON.stringify(authError, null, 2));
      return;
    }

    console.log('✅ User created successfully');
    console.log('User ID:', authData.user.id);
    console.log('User email:', authData.user.email);

    console.log('\n2. Checking if profile already exists...');
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id);

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', fetchError.message);
    } else if (existingProfile && existingProfile.length > 0) {
      console.log('⚠️  Profile already exists:', existingProfile);
    } else {
      console.log('✅ No existing profile found');
    }

    console.log('\n3. Attempting to insert profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: authData.user.id, display_name: testUser.display_name }])
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      console.error('Full error:', JSON.stringify(profileError, null, 2));
    } else {
      console.log('✅ Profile created:', profileData);
    }

  } catch (error) {
    console.error('❌ Exception:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugRegistration();
