/**
 * Product Search Service
 *
 * No licensed product search / affiliate API is configured yet
 * (PRODUCT_SEARCH_API_KEY is unset). In that state, this service searches
 * the locally seeded MongoDB `Product` collection — real documents, real
 * prices — and every result is explicitly flagged `isDevCatalog: true` so
 * the frontend can show a "Development Catalog" banner. No listings,
 * prices, or ratings are invented; they come straight from the seed data.
 *
 * Once a real provider is wired in (PRODUCT_SEARCH_API_KEY set), replace
 * the body of `search()` with a live API call while keeping the same
 * return shape.
 */

const Product = require('../models/Product');
const env = require('../config/env');

class ProductSearchService {
  constructor() {
    this.isLiveConfigured = env.PRODUCT_SEARCH_CONFIGURED;
  }

  async search({ query, category, brand, color, style, occasion, minPrice, maxPrice, sort }) {
    if (this.isLiveConfigured) {
      // Boundary for a real provider — not implemented until credentials exist.
      throw Object.assign(new Error('Live product search provider is not yet implemented.'), { statusCode: 501 });
    }

    const filter = {};
    if (category) filter.category = category;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (color) filter.color = { $regex: `^${color}$`, $options: 'i' };
    if (style) filter.style = { $regex: `^${style}$`, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    let sortSpec = { createdAt: -1 };
    if (sort === 'price_asc') sortSpec = { price: 1 };
    if (sort === 'price_desc') sortSpec = { price: -1 };

    const products = await Product.find(filter).sort(sortSpec);

    return {
      isDevCatalog: true,
      source: 'local-seed-catalog',
      products,
      count: products.length,
    };
  }
}

module.exports = new ProductSearchService();
