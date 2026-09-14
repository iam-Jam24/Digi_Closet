const express = require('express');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const wardrobeRoutes = require('./wardrobeRoutes');
const productRoutes = require('./productRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/wardrobe', wardrobeRoutes);
router.use('/products', productRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Digi Closet API is running.' });
});

module.exports = router;
