// Centralized constants for the application

// File upload limits
const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB max file size
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
};

// Request body limits
const REQUEST_LIMITS = {
  JSON: '1mb',
  URL_ENCODED: '1mb'
};

// Invite code configuration
const INVITE_CODE = {
  LENGTH: 6,
  CHARSET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  MAX_ATTEMPTS: 10
};

// Currency configuration
const CURRENCY = {
  DEFAULT: 'AED',
  SUPPORTED: ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD']
};

// Rate limiting configuration
const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { success: false, error: 'Too many authentication requests, please try again later' }
  },
  RECEIPT_PARSE: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute (paid API)
    message: { success: false, error: 'Too many receipt parsing requests, please try again later' }
  },
  REPORTS: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute (heavy DB queries)
    message: { success: false, error: 'Too many report requests, please try again later' }
  },
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { success: false, error: 'Too many requests, please try again later' }
  }
};

// Receipt validation limits
const RECEIPT_VALIDATION = {
  MIN_TOTAL: 0.01,
  MAX_TOTAL: 1000000, // 1 million
  MAX_MERCHANT_LENGTH: 200,
  MAX_NOTES_LENGTH: 1000,
  MAX_ITEMS: 100,
  MAX_ITEM_NAME_LENGTH: 200,
  MAX_ITEM_PRICE: 100000
};

// Warranty & Return validation limits
const WARRANTY_VALIDATION = {
  MAX_WARRANTY_DURATION_LENGTH: 50,       // e.g. "2 years" or "90 days"
  MAX_RETURN_PERIOD_LENGTH: 50,           // e.g. "14 days"
  MAX_WARRANTY_NOTES_LENGTH: 500,
  EXPIRING_SOON_DAYS_RETURN: 7,          // countdown threshold for return expiry
  EXPIRING_SOON_DAYS_WARRANTY: 30,       // countdown threshold for warranty expiry
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR'
};

module.exports = {
  FILE_UPLOAD,
  REQUEST_LIMITS,
  INVITE_CODE,
  CURRENCY,
  RATE_LIMITS,
  RECEIPT_VALIDATION,
  WARRANTY_VALIDATION,
  PAGINATION,
  ERROR_CODES
};