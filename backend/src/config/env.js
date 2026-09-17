require('dotenv').config();

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

// Validate required environment variables
const required = ['JWT_SECRET', 'DATABASE_URL'];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

module.exports = env;
