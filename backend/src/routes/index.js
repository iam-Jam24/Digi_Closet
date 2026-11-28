const express = require('express');
const mongoose = require('mongoose');
const env = require('../config/env');
const imageGeneration = require('../services/imageGenerationService');
const ai = require('../services/aiService');

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const wardrobeRoutes = require('./wardrobeRoutes');
const productRoutes = require('./productRoutes');
const outfitRoutes = require('./outfitRoutes');
const fashionCriticRoutes = require('./fashionCriticRoutes');
const colorAnalyzerRoutes = require('./colorAnalyzerRoutes');
const shoppingRoutes = require('./shoppingRoutes');
const lookRoutes = require('./lookRoutes');
const plannerRoutes = require('./plannerRoutes');
const chatRoutes = require('./chatRoutes');
const weatherRoutes = require('./weatherRoutes');
const locationFindsRoutes = require('./locationFindsRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/wardrobe', wardrobeRoutes);
router.use('/products', productRoutes);
router.use('/outfits', outfitRoutes);
router.use('/fashion', fashionCriticRoutes);
router.use('/colors', colorAnalyzerRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/looks', lookRoutes);
router.use('/planner', plannerRoutes);
router.use('/chat', chatRoutes);
router.use('/weather', weatherRoutes);
router.use('/location-finds', locationFindsRoutes);

// Health check
router.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? 'Digi Closet API is running.' : 'API is up but the database is not connected.',
    database: dbConnected ? 'connected' : 'disconnected',
    ai: ai.isConfigured
      ? { provider: env.AI_PROVIDER, model: ai.models[0], visionModel: (ai.visionModels || ai.models)[0] }
      : `${env.AI_PROVIDER} not configured`,
    imageGeneration: {
      providers: env.IMAGE_GENERATION_PROVIDERS,
      ...imageGeneration.getCapabilities(),
    },
    productSearch: env.PRODUCT_SEARCH_CONFIGURED ? env.PRODUCT_SEARCH_PROVIDER : 'not configured',
    locationFinds: 'openstreetmap',
  });
});

module.exports = router;
