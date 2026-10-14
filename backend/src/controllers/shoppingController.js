const Product = require('../models/Product');
const ShoppingList = require('../models/ShoppingList');
const productSearchService = require('../services/productSearchService');

// POST /api/shopping/plan — builds a budget-aware shopping list from the
// real product catalog. Prioritizes versatile, lower-cost items so more
// categories fit the budget; never invents prices or discounts.
const plan = async (req, res, next) => {
  try {
    const { budget, categories, style, colors, occasion, brands } = req.body;

    if (!budget || budget <= 0) {
      return res.status(400).json({ success: false, message: 'A positive budget is required.' });
    }

    const filter = {};
    if (categories && categories.length) filter.category = { $in: categories };
    if (style) filter.style = { $regex: `^${style}$`, $options: 'i' };
    if (colors && colors.length) filter.color = { $in: colors.map((c) => new RegExp(`^${c}$`, 'i')) };
    if (brands && brands.length) filter.brand = { $in: brands.map((b) => new RegExp(`^${b}$`, 'i')) };

    const candidates = await Product.find(filter).sort({ price: 1 });

    const picked = [];
    let runningTotal = 0;
    const seenCategories = new Set();

    for (const product of candidates) {
      // Prefer at least one item per distinct category first (versatility),
      // then fill remaining budget with any other affordable items.
      if (runningTotal + product.price > budget) continue;
      if (seenCategories.has(product.category) && seenCategories.size < (categories?.length || 99)) continue;

      picked.push(product);
      runningTotal += product.price;
      seenCategories.add(product.category);
    }

    const overBudget = picked.length === 0 && candidates.length > 0;

    const shoppingList = await ShoppingList.create({
      owner: req.user._id,
      title: occasion ? `${occasion} shopping list` : 'My Shopping List',
      budget,
      occasion: occasion || null,
      items: picked.map((p) => ({
        product: p._id,
        snapshot: { name: p.name, brand: p.brand, price: p.price, imageUrl: p.imageUrl, category: p.category },
        reason: `Fits your ${budget ? 'budget' : 'preferences'} and complements a versatile wardrobe.`,
      })),
      estimatedTotal: runningTotal,
      overBudget,
    });

    res.status(201).json({
      success: true,
      data: {
        shoppingList,
        isDevCatalog: true,
        remainingBudget: budget - runningTotal,
        warning: overBudget
          ? 'No products matched your filters within this budget. Try widening your filters or increasing the budget.'
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/shopping/saved
const getSavedLists = async (req, res, next) => {
  try {
    const lists = await ShoppingList.find({ owner: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { lists, count: lists.length } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/shopping/saved/:id
const deleteList = async (req, res, next) => {
  try {
    const list = await ShoppingList.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ success: false, message: 'Shopping list not found.' });
    }
    if (String(list.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this list.' });
    }
    await list.deleteOne();
    res.json({ success: true, message: 'Shopping list deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { plan, getSavedLists, deleteList };
