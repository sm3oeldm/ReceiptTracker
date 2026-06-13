const { createClient } = require('@supabase/supabase-js');

// This middleware validates the JWT sent from the client
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  console.log('🔐 Auth middleware - checking token...');
  console.log('Token present:', !!token);
  console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'N/A');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  // Create a supabase client for the user request
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  console.log('🔐 Validating token with Supabase...');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  console.log('Validation result - error:', error?.message);
  console.log('Validation result - user:', !!user);

  if (error || !user) {
    console.log('❌ Invalid or expired token:', error?.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  console.log('✅ Token valid, user:', user.id);
  req.user = user;
  next();
};

module.exports = authMiddleware;
