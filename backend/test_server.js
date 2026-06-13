const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Simple test endpoint
app.post('/test-register', async (req, res) => {
  console.log('✅ Test endpoint hit!');
  const { email, password } = req.body;

  try {
    console.log('Creating user:', email);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('Admin error:', error);
      return res.status(400).json({ error: error.message, code: error.code });
    }

    console.log('User created:', data.user.id);
    res.json({ success: true, userId: data.user.id });

  } catch (err) {
    console.error('Exception:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});