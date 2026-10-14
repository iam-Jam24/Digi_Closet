const ClothingItem = require('../models/ClothingItem');
const SavedOutfit = require('../models/SavedOutfit');
const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');

// POST /api/outfits/recommend
const recommend = async (req, res, next) => {
  try {
    const { occasion, style, season, colors, budget, city } = req.body;

    const wardrobeItems = await ClothingItem.find({ owner: req.user._id });

    let weather = null;
    if (city) {
      const weatherResult = await weatherService.getCurrentWeather({ city });
      if (weatherResult.found) {
        weather = `${weatherResult.condition}, ${weatherResult.temperatureC}°C in ${weatherResult.city}`;
      }
    }

    const result = await geminiService.generateOutfitRecommendations({
      wardrobeItems, occasion, style, weather, season, colors, budget,
    });

    res.json({ success: true, data: { ...result, weather, wardrobeCount: wardrobeItems.length } });
  } catch (error) {
    next(error);
  }
};

// POST /api/outfits/saved — save an outfit (from recommendation or manual pick)
const saveOutfit = async (req, res, next) => {
  try {
    const { title, itemIds, occasion, explanation, styleTips, missingItems, source } = req.body;

    if (!itemIds || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one clothing item is required.' });
    }

    // Validate every item id actually belongs to this user's wardrobe.
    const ownedItems = await ClothingItem.find({ _id: { $in: itemIds }, owner: req.user._id });
    if (ownedItems.length !== itemIds.length) {
      return res.status(400).json({ success: false, message: 'One or more items do not belong to your wardrobe.' });
    }

    const outfit = await SavedOutfit.create({
      owner: req.user._id,
      title: title || 'My Outfit',
      clothingItems: ownedItems.map((i) => i._id),
      occasion: occasion || null,
      explanation: explanation || '',
      styleTips: styleTips || [],
      missingItems: missingItems || [],
      source: source || 'manual',
    });

    res.status(201).json({ success: true, message: 'Outfit saved.', data: { outfit } });
  } catch (error) {
    next(error);
  }
};

// GET /api/outfits/saved
const getSavedOutfits = async (req, res, next) => {
  try {
    const outfits = await SavedOutfit.find({ owner: req.user._id })
      .populate('clothingItems')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { outfits, count: outfits.length } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/outfits/saved/:id/favorite
const toggleFavorite = async (req, res, next) => {
  try {
    const outfit = await SavedOutfit.findById(req.params.id);
    if (!outfit) {
      return res.status(404).json({ success: false, message: 'Outfit not found.' });
    }
    if (String(outfit.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this outfit.' });
    }
    outfit.favorite = !outfit.favorite;
    await outfit.save();
    res.json({ success: true, data: { outfit } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/outfits/saved/:id
const deleteOutfit = async (req, res, next) => {
  try {
    const outfit = await SavedOutfit.findById(req.params.id);
    if (!outfit) {
      return res.status(404).json({ success: false, message: 'Outfit not found.' });
    }
    if (String(outfit.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this outfit.' });
    }
    await outfit.deleteOne();
    res.json({ success: true, message: 'Outfit deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { recommend, saveOutfit, getSavedOutfits, toggleFavorite, deleteOutfit };
