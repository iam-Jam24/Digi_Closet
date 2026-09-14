const env = require('../config/env');

const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);

  if (env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma known request error
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found.',
    });
  }

  // Custom error with status
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production'
      ? 'Something went wrong.'
      : err.message || 'Something went wrong.',
  });
};

module.exports = errorHandler;
