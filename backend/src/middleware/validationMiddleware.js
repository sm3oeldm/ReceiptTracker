/**
 * Validation middleware to protect against oversized/malformed payloads
 */
const validationMiddleware = {
  /**
   * Validate JSON payload size and structure
   */
  validateJsonPayload: (req, res, next) => {
    // Check Content-Type
    if (!req.is('application/json')) {
      return res.status(400).json({
        error: 'Invalid Content-Type',
        message: 'Expected application/json'
      });
    }

    // Check if body is empty when it shouldn't be (for POST/PUT/PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) &&
        Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Empty body',
        message: 'Request body cannot be empty'
      });
    }

    next();
  },

  /**
   * Sanitize input data to prevent injection attacks
   */
  sanitizeInput: (req, res, next) => {
    // Recursively sanitize string values in the request body
    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Basic sanitization: remove potentially dangerous characters
          // This is a simple example - adjust based on your needs
          sanitized[key] = value
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/['"]/g, ''); // Remove quotes
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    next();
  },

  /**
   * Validate specific fields based on route
   */
  validateAuthInput: (req, res, next) => {
    const { email, password, display_name } = req.body;

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Password length validation
    if (password && password.length < 6) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Display name validation
    if (display_name && display_name.length > 50) {
      return res.status(400).json({
        error: 'Display name too long',
        message: 'Display name must be less than 50 characters'
      });
    }

    next();
  }
};

module.exports = validationMiddleware;