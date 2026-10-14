const Product = require('../models/Product');
const SavedProduct = require('../models/SavedProduct');
const productSearchService = require('../services/productSearchService');

// GET /api/products — uses productSearchService (dev catalog unless a real
// provider is configured), never fabricates listings.
const getProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, color, style, brand, occasion, query, sort } = req.query;
    const result = await productSearchService.search({
      query, category, brand, color, style, occasion, minPrice, maxPrice, sort,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/saved — save a product for later
const saveProduct = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const saved = await SavedProduct.findOneAndUpdate(
      { owner: req.user._id, product: product._id },
      {
        owner: req.user._id,
        product: product._id,
        snapshot: {
          name: product.name,
          brand: product.brand,
          price: product.price,
          imageUrl: product.imageUrl,
          color: product.color,
          category: product.category,
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Product saved.', data: { saved } });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/saved
const getSavedProducts = async (req, res, next) => {
  try {
    const saved = await SavedProduct.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { saved, count: saved.length } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/saved/:id
const unsaveProduct = async (req, res, next) => {
  try {
    const saved = await SavedProduct.findById(req.params.id);
    if (!saved) {
      return res.status(404).json({ success: false, message: 'Saved product not found.' });
    }
    if (String(saved.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to remove this.' });
    }
    await saved.deleteOne();
    res.json({ success: true, message: 'Removed from saved products.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  saveProduct,
  getSavedProducts,
  unsaveProduct,
};
