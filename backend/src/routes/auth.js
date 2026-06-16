// Clean auth route that accepts Supabase client as parameter
const express = require('express');
const { validateAuthInput } = require('../middleware/validationMiddleware');

module.exports = (supabase) => {
  const router = express.Router();

  // REGISTER - Using admin API to bypass email rate limits
  router.post('/register', validateAuthInput, async (req, res) => {
    const { email, password, display_name } = req.body;

    // Input validation
    if (!email || !password || !display_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'email, password, and display_name are required'
      });
    }

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Note: Middleware (validateAuthInput) already enforces 8-char minimum;
    // this is a safety net for direct route access
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    try {
      console.log('📝 Registering user:', email);
      const startTime = Date.now();

      // Use admin API which doesn't send emails
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Skip email confirmation to avoid rate limits
      });

      console.log(`⏱️ Auth creation took ${Date.now() - startTime}ms`);

      if (authError) {
        console.error('❌ Admin user creation failed:', authError.message);
        return res.status(400).json({
          error: authError.message,
          code: authError.code || 'unknown_error'
        });
      }

      if (!authData.user) {
        return res.status(400).json({ error: 'User creation failed: no user returned' });
      }

      console.log('✅ User created:', authData.user.id);

      // Try to upsert the profile - if it fails due to RLS, we'll skip it
      // since the trigger should have created it already
      try {
        console.log('ℹ️  Upserting profile...');
        const profileStartTime = Date.now();
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert([{ id: authData.user.id, display_name: display_name }], {
            onConflict: 'id'
          })
          .select();
        console.log(`⏱️ Profile upsert took ${Date.now() - profileStartTime}ms`);

        if (profileError) {
          console.warn('⚠️  Profile upsert failed (might be RLS), skipping:', profileError.message);
          // Continue anyway - the trigger should have created the profile
        } else {
          console.log('✅ Profile upserted:', profileData?.length || 0, 'rows affected');
        }
      } catch (error) {
        console.warn('⚠️  Profile upsert exception, skipping:', error.message);
        // Continue anyway - the trigger should have created the profile
      }
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          display_name: display_name
        }
      });
    } catch (error) {
      console.error('❌ Registration exception:', error.message);
      res.status(500).json({
        error: 'Registration failed',
        details: error.message
      });
    }
  });

  // LOGIN
  router.post('/login', validateAuthInput, async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'email and password are required'
      });
    }

    try {
      console.log('🔑 Login attempt for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('❌ Login failed:', error.message);
        return res.status(400).json({
          error: error.message,
          code: error.code || 'unknown_error'
        });
      }

      if (!data.session?.access_token) {
        console.error('❌ No access token received');
        return res.status(400).json({ error: 'Authentication failed: no token' });
      }

      console.log('✅ Login successful');

      // Fetch display_name from profiles
      let displayName = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.user.id)
          .single();
        if (profile) displayName = profile.display_name;
      } catch (profileErr) {
        console.warn('⚠️ Could not fetch display_name on login:', profileErr.message);
      }

      res.json({
        success: true,
        accessToken: data.session.access_token,
        expiresIn: data.session.expires_in,
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: displayName
        }
      });

    } catch (error) {
      console.error('❌ Login exception:', error.message);
      res.status(500).json({
        error: 'Login failed',
        details: error.message
      });
    }
  });

  return router;
};