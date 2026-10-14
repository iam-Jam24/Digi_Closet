const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    snapshot: {
      name: String,
      brand: String,
      price: Number,
      imageUrl: String,
      category: String,
    },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const shoppingListSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'My Shopping List' },
    budget: { type: Number, required: true },
    occasion: { type: String, default: null },
    items: { type: [shoppingListItemSchema], default: [] },
    estimatedTotal: { type: Number, default: 0 },
    overBudget: { type: Boolean, default: false },
  },
  { timestamps: true }
);

shoppingListSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
