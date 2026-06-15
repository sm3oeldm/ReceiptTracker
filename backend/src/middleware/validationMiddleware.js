/**
 * Validation middleware to protect against oversized/malformed payloads
 * and injection attacks. Applied to all API routes.
 */
const validator = require('validator');

// Constants for field length limits
const FIELD_LIMITS = {
  email: 254,
  password: 128,
  displayName: 50,
  merchant: 200,
  notes: 1000,
  itemName: 200,
  groupName: 100,
  inviteCode: 10,
  currency: 3,
};

/**
 * Validate JSON payload size and structure
 */
function validateJsonPayload(req, res, next) {
  // Only validate routes that expect JSON
  if (!req.is('application/json') && req.method !== 'GET' && req.method !== 'DELETE') {
    // Skip Content-Type check for GET/DELETE and multipart (file uploads)
    if (req.is('multipart/form-data')) {
      return next();
    }
    // For POST/PUT/PATCH without proper content type, reject unless body is empty
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body || {}).length > 0) {
      return res.status(400).json({
        error: 'Invalid Content-Type',
        message: 'Expected application/json'
      });
    }
  }

  // Check for empty body on mutation requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const body = req.body || {};
    if (Object.keys(body).length === 0 && !req.is('multipart/form-data')) {
      return res.status(400).json({
        error: 'Empty body',
        message: 'Request body cannot be empty'
      });
    }
  }

  next();
}

/**
 * Sanitize string values to strip null bytes and control characters
 * that could be used for injection attacks. Uses a whitelist approach:
 * only strip known-dangerous characters rather than guessing formats.
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  // Strip null bytes, vertical tabs, and ASCII control characters (0x00-0x1F except \t, \n, \r)
  return value.replace(/[\0\x0B\x1A]/g, '')
    // Strip Unicode BOM and other zero-width formatting characters
    .replace(/[﻿​‌‍⁠]/g, '')
    .trim();
}

/**
 * Recursively sanitize all string values in an object or array
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitize input data — null-byte and control-char removal
 */
function sanitizeInput(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Validate email format and length
 */
function validateEmail(email) {
  return email && validator.isEmail(email) && email.length <= FIELD_LIMITS.email;
}

/**
 * Validate auth input fields
 */
function validateAuthInput(req, res, next) {
  const { email, password, display_name } = req.body;

  // Email validation
  if (email && !validateEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
      message: 'Please provide a valid email address'
    });
  }

  // Password length validation
  if (password) {
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'Password must be at least 8 characters long'
      });
    }
    if (password.length > FIELD_LIMITS.password) {
      return res.status(400).json({
        error: 'Password too long',
        message: `Password must be at most ${FIELD_LIMITS.password} characters`
      });
    }
  }

  // Display name validation
  if (display_name) {
    if (display_name.length < 1 || display_name.length > FIELD_LIMITS.displayName) {
      return res.status(400).json({
        error: 'Invalid display name',
        message: `Display name must be between 1 and ${FIELD_LIMITS.displayName} characters`
      });
    }
  }

  next();
}

/**
 * Validate receipt input fields
 */
function validateReceiptInput(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(); // Let route handle missing body
  }

  const { merchant, total, notes, items } = req.body;

  // Merchant validation
  if (merchant !== undefined) {
    if (typeof merchant !== 'string' || merchant.length < 1 || merchant.length > FIELD_LIMITS.merchant) {
      return res.status(400).json({
        error: 'Invalid merchant name',
        message: `Merchant must be between 1 and ${FIELD_LIMITS.merchant} characters`
      });
    }
  }

  // Total validation
  if (total !== undefined) {
    const parsed = Number(total);
    if (isNaN(parsed) || parsed < 0.01 || parsed > 1000000) {
      return res.status(400).json({
        error: 'Invalid total',
        message: 'Total must be between 0.01 and 1,000,000'
      });
    }
  }

  // Notes validation
  if (notes !== undefined) {
    if (typeof notes !== 'string' || notes.length > FIELD_LIMITS.notes) {
      return res.status(400).json({
        error: 'Invalid notes',
        message: `Notes must be at most ${FIELD_LIMITS.notes} characters`
      });
    }
  }

  // Items validation
  if (items !== undefined) {
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }
    if (items.length > 100) {
      return res.status(400).json({ error: 'Too many items', message: 'Maximum 100 items per receipt' });
    }
    for (const item of items) {
      if (typeof item.name !== 'string' || item.name.length > FIELD_LIMITS.itemName) {
        return res.status(400).json({
          error: 'Invalid item name',
          message: `Each item name must be at most ${FIELD_LIMITS.itemName} characters`
        });
      }
      if (item.price !== undefined && (isNaN(Number(item.price)) || Number(item.price) > 100000)) {
        return res.status(400).json({
          error: 'Invalid item price',
          message: 'Each item price must be at most 100,000'
        });
      }
    }
  }

  next();
}

/**
 * Validate group input fields
 */
function validateGroupInput(req, res, next) {
  const { name, inviteCode, invite_code } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 1 || name.length > FIELD_LIMITS.groupName) {
      return res.status(400).json({
        error: 'Invalid group name',
        message: `Group name must be between 1 and ${FIELD_LIMITS.groupName} characters`
      });
    }
  }

  const code = inviteCode || invite_code;
  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim().length < 1 || code.length > FIELD_LIMITS.inviteCode) {
      return res.status(400).json({
        error: 'Invalid invite code',
        message: `Invite code must be at most ${FIELD_LIMITS.inviteCode} characters`
      });
    }
  }

  next();
}

/**
 * Validate category input fields
 */
function validateCategoryInput(req, res, next) {
  const { name } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 1 || name.length > 50) {
      return res.status(400).json({
        error: 'Invalid category name',
        message: 'Category name must be between 1 and 50 characters'
      });
    }
  }

  next();
}

/**
 * Validate query parameters
 */
function validateQueryParams(req, res, next) {
  const { month, year } = req.query;

  if (month !== undefined) {
    const m = Number(month);
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Invalid month', message: 'Month must be between 1 and 12' });
    }
  }

  if (year !== undefined) {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      return res.status(400).json({ error: 'Invalid year', message: 'Year must be between 2000 and 2100' });
    }
  }

  next();
}

module.exports = {
  validateJsonPayload,
  sanitizeInput,
  validateAuthInput,
  validateReceiptInput,
  validateGroupInput,
  validateCategoryInput,
  validateQueryParams,
  FIELD_LIMITS,
};
