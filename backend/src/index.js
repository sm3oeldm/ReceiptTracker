require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ==== Security Middleware ====

// Helmet with CSP and other security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Basic security headers (Referrer-Policy, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Body parsing with size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ==== Rate Limiting ====

// Global rate limiter for all API routes
const apiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150, // limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiRateLimiter);

// ==== Secret Validation ====

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.GEMINI_API_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY');
  process.exit(1);
}

// ==== CORS Configuration ====

app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:19000', 'http://10.0.2.2:19006'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ==== Request Logging ====

app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ==== Supabase & Gemini Initialization ====

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ==== Routes Import ====

const authRoutes = require('./routes/auth')(supabase);
const groupsRoutes = require('./routes/groups');
const categoriesRoutes = require('./routes/categories');
const receiptsRoutes = require('./routes/receipts');
const reportsRoutes = require('./routes/reports');

// ==== Apply Route Middleware ====

// Auth-specific rate limiter (still keep for auth routes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

// ==== Define Routes ====

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/reports', reportsRoutes);

// ==== Health Check ====

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ==== Error Handling ====

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  // Omit stack trace in production to avoid information leakage
  if (process.env.NODE_ENV !== 'development') {
    // Do not log stack in production
  } else {
    console.error(err.stack);
  }
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==== 404 Handler ====

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// ==== Start Server ====

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});