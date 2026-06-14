// Singleton Supabase client for reuse across the application
const { createClient } = require('@supabase/supabase-js');

let supabaseInstance = null;

/**
 * Get or create the Supabase service role client (singleton)
 * Uses service role key for backend operations (bypasses RLS)
 */
function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured. Check SUPABASE_URL and SUPABASE_SERVICE_KEY');
    }

    supabaseInstance = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseInstance;
}

/**
 * Create a Supabase client with user's JWT for RLS enforcement
 * Used when we want Row Level Security to apply
 */
function getSupabaseClientWithToken(token) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

module.exports = {
  getSupabaseClient,
  getSupabaseClientWithToken
};