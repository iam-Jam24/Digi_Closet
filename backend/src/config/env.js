require('dotenv').config();

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URLS: (process.env.CLIENT_URL || '').split(',').map((url) => url.trim()).filter(Boolean),

  MONGODB_URI: process.env.MONGODB_URI,

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',
  // cloudinary://API_KEY:API_SECRET@CLOUD_NAME (Cloudinary dashboard > API Keys).
  // When set, image uploads go to Cloudinary instead of Firebase Storage.
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || '',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_CONFIGURED: Boolean(process.env.GEMINI_API_KEY),
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite',
  // Image editing models used by Virtual Try-On and Style Makeover. These are
  // paid-tier only: the Gemini free tier allows zero image generations, so on
  // a free key the next provider in IMAGE_GENERATION_PROVIDERS is used.
  GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
  GEMINI_IMAGE_FALLBACK_MODEL: process.env.GEMINI_IMAGE_FALLBACK_MODEL || 'gemini-2.5-flash-image',

  // How long a model or provider that reported zero quota is skipped.
  AI_QUOTA_COOLDOWN_MS: parseInt(process.env.AI_QUOTA_COOLDOWN_MS, 10) || 60 * 60 * 1000,

  // Image providers tried in order for try-on / makeover images; see
  // services/imageGenerationService.js. The older single-value
  // IMAGE_GENERATION_PROVIDER is still honoured when the list is unset.
  IMAGE_GENERATION_PROVIDERS: (process.env.IMAGE_GENERATION_PROVIDERS || process.env.IMAGE_GENERATION_PROVIDER || 'gemini,huggingface')
    .split(',').map((name) => name.trim().toLowerCase()).filter(Boolean),

  // Free image generation on public Hugging Face Spaces. HF_TOKEN is optional;
  // a (free) token gives a larger ZeroGPU quota than anonymous use.
  HF_TOKEN: process.env.HF_TOKEN || '',
  HF_TRYON_SPACE: process.env.HF_TRYON_SPACE || 'yisol/IDM-VTON',
  HF_EDIT_SPACE: process.env.HF_EDIT_SPACE || 'black-forest-labs/FLUX.1-Kontext-Dev',
  HF_TIMEOUT_MS: parseInt(process.env.HF_TIMEOUT_MS, 10) || 180000,

  WEATHER_PROVIDER: process.env.WEATHER_PROVIDER || 'open-meteo',

  // Only "serpapi" (Google Shopping via serpapi.com) is implemented today.
  PRODUCT_SEARCH_PROVIDER: process.env.PRODUCT_SEARCH_PROVIDER || 'serpapi',
  PRODUCT_SEARCH_API_KEY: process.env.PRODUCT_SEARCH_API_KEY || '',
  PRODUCT_SEARCH_CONFIGURED: Boolean(process.env.PRODUCT_SEARCH_API_KEY),
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
