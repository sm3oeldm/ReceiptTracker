require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Simple test route
app.post('/simple-test', (req, res) => {
  console.log('✅ Simple test hit!');
  console.log('📝 Body:', req.body);
  res.json({ success: true, body: req.body });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});