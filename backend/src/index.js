require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:19000', 'http://10.0.2.2:19006'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});


// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);


// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Import routes
const authRoutes = require('./routes/auth')(supabase);
const groupsRoutes = require('./routes/groups');
const categoriesRoutes = require('./routes/categories');
const receiptsRoutes = require('./routes/receipts');
const reportsRoutes = require('./routes/reports');

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  console.error(err.stack);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
