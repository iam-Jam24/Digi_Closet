const mongoose = require('mongoose');

const CATEGORIES = [
  'Tops', 'Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Dresses',
  'Footwear', 'Outerwear', 'Accessories',
];

const SEASONS = ['Summer', 'Winter', 'Monsoon', 'Spring', 'Autumn', 'All Season'];

const clothingItemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    category: { type: String, required: true, enum: CATEGORIES },
    imageUrl: { type: String, default: null },
    colors: { type: [String], default: [] },
    pattern: { type: String, default: null },
    season: { type: [String], default: [] },
    style: { type: String, default: null },
    occasions: { type: [String], default: [] },
    size: { type: String, default: null },
    fit: { type: String, default: null },
    brand: { type: String, default: null },
    notes: { type: String, default: '', maxlength: 500 },
    aiSuggested: {
      category: { type: String, default: null },
      colors: { type: [String], default: [] },
      style: { type: String, default: null },
      accepted: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

clothingItemSchema.index({ owner: 1, category: 1 });
clothingItemSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('ClothingItem', clothingItemSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.SEASONS = SEASONS;
