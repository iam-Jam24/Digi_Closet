const express = require('express');

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const wardrobeRoutes = require('./wardrobeRoutes');
const productRoutes = require('./productRoutes');
const outfitRoutes = require('./outfitRoutes');
const fashionCriticRoutes = require('./fashionCriticRoutes');
const colorAnalyzerRoutes = require('./colorAnalyzerRoutes');
const occasionStylingRoutes = require('./occasionStylingRoutes');
const shoppingRoutes = require('./shoppingRoutes');
const tryOnRoutes = require('./tryOnRoutes');
const chatRoutes = require('./chatRoutes');
const weatherRoutes = require('./weatherRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/wardrobe', wardrobeRoutes);
router.use('/products', productRoutes);
router.use('/outfits', outfitRoutes);
router.use('/fashion', fashionCriticRoutes);
router.use('/colors', colorAnalyzerRoutes);
router.use('/styling', occasionStylingRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/try-on', tryOnRoutes);
router.use('/chat', chatRoutes);
router.use('/weather', weatherRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Digi Closet API is running.' });
});

module.exports = router;
