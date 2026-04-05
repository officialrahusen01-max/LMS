import jwt from 'jsonwebtoken';
import config from '../configuration/config.js';
import AppError from '../utils/AppError.js';


// Authenticate middleware - validates JWT and attaches user to req.user
export const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: 'Invalid or expired token'
    });
  }
};

// Authorize middleware - checks if user has required roles
export const authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: 'User not authenticated'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        status: false,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}`
      });
    }

    next();
  };
};

// Fast-fail middleware to ensure the authenticated user is an approved instructor.
// Usage: place before course creation/publish routes to quickly reject unapproved users.
export const ensureApprovedInstructor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: false, message: 'User not authenticated' });
  }

  const userRoles = req.user.roles || [];
  // Admins bypass approval
  if (userRoles.includes('admin')) return next();

  // JWT payload includes approvedInstructor (and status) via getJwtPayload
  if (req.user.approvedInstructor && req.user.status === 'active') {
    return next();
  }

  return res.status(403).json({ status: false, message: 'Instructor account not approved or inactive' });
};

// Optional authentication middleware - attaches user if token present, doesn't fail if not
export const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
    }

    next();
  } catch (err) {
    // Token invalid or expired, but continue anyway
    next();
  }
};
