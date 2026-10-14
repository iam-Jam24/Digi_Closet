const mongoose = require('mongoose');

const savedOutfitSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    clothingItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClothingItem' }],
    occasion: { type: String, default: null },
    explanation: { type: String, default: '' },
    styleTips: { type: [String], default: [] },
    missingItems: { type: [String], default: [] },
    previewUrl: { type: String, default: null },
    favorite: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['outfit-recommendation', 'occasion-styling', 'manual'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

savedOutfitSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('SavedOutfit', savedOutfitSchema);
