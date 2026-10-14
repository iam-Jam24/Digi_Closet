const rateLimit = require('express-rate-limit');

/**
 * Stricter rate limit for expensive AI-backed endpoints
 * (outfit recommendations, fashion critic, chatbot, color analysis, try-on).
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a moment and try again.',
  },
});

module.exports = { aiRateLimiter };
