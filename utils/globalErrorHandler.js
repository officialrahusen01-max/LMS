import logger from './logger.js';

/**
 * Global error handler middleware
 * Catches all errors thrown by route handlers and middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  // Default to 500 (server error), not 200
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error for monitoring
  logger.error(`[${statusCode}] ${message}`, {
    path: req.path,
    method: req.method,
    error: err.stack
  });

  // Send response
  res.status(statusCode).json({
    status: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default globalErrorHandler;
