const env = require('../config/env');

const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);

  if (env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
    return res.status(400).json({
      success: false,
      message: message || 'Validation failed.',
    });
  }

  // Mongoose invalid ObjectId / cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier supplied.',
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
