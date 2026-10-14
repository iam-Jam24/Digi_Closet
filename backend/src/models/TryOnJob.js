const mongoose = require('mongoose');

const tryOnJobSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userImageUrl: { type: String, required: true },
    garmentImageUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'awaiting_configuration'],
      default: 'pending',
    },
    resultUrl: { type: String, default: null },
    errorMessage: { type: String, default: null },
    fitAnalysis: {
      fitScore: { type: Number, default: null },
      silhouetteVerdict: { type: String, default: null },
      colorHarmony: { type: String, default: null },
      stylingTips: { type: [String], default: [] },
      recommendedPairings: { type: [String], default: [] },
      mode: { type: String, default: null },
    },
  },
  { timestamps: true }
);

tryOnJobSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('TryOnJob', tryOnJobSchema);
