import { body, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Sanitize inputs
export const sanitizeInputs = (req, res, next) => {
  // Basic sanitization - trim and escape
  for (let key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  }
  for (let key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key].trim();
    }
  }
  next();
};