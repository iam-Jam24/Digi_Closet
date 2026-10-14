const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getProducts, getProductById, saveProduct, getSavedProducts, unsaveProduct,
} = require('../controllers/productController');

const router = express.Router();

// Public catalog browsing (no auth required to window-shop)
router.get('/', getProducts);

// Saved products require auth
router.get('/saved', authenticate, getSavedProducts);
router.post('/saved', authenticate, saveProduct);
router.delete('/saved/:id', authenticate, unsaveProduct);

router.get('/:id', getProductById);

module.exports = router;
