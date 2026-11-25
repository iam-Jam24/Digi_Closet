const mongoose = require('mongoose');

const FEATURES = ['try-on', 'makeover'];

// The Style Makeover option a look was generated from.
const styleOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    styleCategory: { type: String, default: null },
    summary: { type: String, default: '' },
    clothingChanges: { type: [String], default: [] },
    accessories: { type: [String], default: [] },
    footwear: { type: [String], default: [] },
  },
  { _id: false }
);

// An AI-generated photo of the user: either wearing selected wardrobe items
// (try-on) or restyled from a makeover suggestion. Unsaved looks are pruned
// after a while; saved and favourite ones are kept.
const lookSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    feature: { type: String, enum: FEATURES, required: true },
    sourceImageUrl: { type: String, required: true },
    sourceImagePath: { type: String, required: true },
    clothingItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClothingItem' }],
    style: { type: styleOptionSchema, default: null },
    // Which image provider made the result, e.g. "gemini" or
    // "huggingface:black-forest-labs/FLUX.1-Kontext-Dev", plus a display name.
    provider: { type: String, default: null },
    providerLabel: { type: String, default: null },
    resultUrl: { type: String, required: true },
    resultPath: { type: String, required: true },
    saved: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

lookSchema.index({ owner: 1, feature: 1, createdAt: -1 });
lookSchema.index({ saved: 1, createdAt: 1 });

module.exports = mongoose.model('Look', lookSchema);
module.exports.FEATURES = FEATURES;
