const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    color: { type: String, required: true },
    style: { type: String, required: true },
    rating: { type: Number, default: 0 },
    imageUrl: { type: String, default: null },
    description: { type: String, default: '' },
    sourceUrl: { type: String, default: null },
    isDevCatalog: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, style: 1, color: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
