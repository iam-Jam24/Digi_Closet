require('dotenv').config();

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  MONGODB_URI: process.env.MONGODB_URI,

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_CONFIGURED: Boolean(process.env.GEMINI_API_KEY),

  WEATHER_PROVIDER: process.env.WEATHER_PROVIDER || 'open-meteo',

  PRODUCT_SEARCH_API_KEY: process.env.PRODUCT_SEARCH_API_KEY || '',
  PRODUCT_SEARCH_CONFIGURED: Boolean(process.env.PRODUCT_SEARCH_API_KEY),

  VIRTUAL_TRYON_API_KEY: process.env.VIRTUAL_TRYON_API_KEY || '',
  VIRTUAL_TRYON_PROVIDER_URL: process.env.VIRTUAL_TRYON_PROVIDER_URL || '',
  VIRTUAL_TRYON_CONFIGURED: Boolean(
    process.env.VIRTUAL_TRYON_API_KEY && process.env.VIRTUAL_TRYON_PROVIDER_URL
  ),
};

// Validate required environment variables
const required = ['MONGODB_URI'];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (!env.FIREBASE_AUTH_EMULATOR_HOST && !(env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY)) {
  console.warn(
    '⚠️  Firebase Admin is not fully configured. Set FIREBASE_AUTH_EMULATOR_HOST for local dev, ' +
    'or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY for production.'
  );
}

module.exports = env;
