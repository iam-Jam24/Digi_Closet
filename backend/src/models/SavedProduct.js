const mongoose = require('mongoose');

const savedProductSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    snapshot: {
      name: String,
      brand: String,
      price: Number,
      imageUrl: String,
      color: String,
      category: String,
    },
  },
  { timestamps: true }
);

savedProductSchema.index({ owner: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('SavedProduct', savedProductSchema);
