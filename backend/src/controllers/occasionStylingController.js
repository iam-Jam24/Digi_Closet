const ClothingItem = require('../models/ClothingItem');
const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');

// POST /api/styling/occasion
const style = async (req, res, next) => {
  try {
    const { occasion, dressCode, style: preferredStyle, city, budget } = req.body;

    if (!occasion) {
      return res.status(400).json({ success: false, message: 'Occasion is required.' });
    }

    const wardrobeItems = await ClothingItem.find({ owner: req.user._id });

    let weather = null;
    if (city) {
      const weatherResult = await weatherService.getCurrentWeather({ city });
      if (weatherResult.found) {
        weather = `${weatherResult.condition}, ${weatherResult.temperatureC}°C in ${weatherResult.city}`;
      }
    }

    const result = await geminiService.generateOccasionStyling({
      wardrobeItems, occasion, dressCode, style: preferredStyle, weather, budget,
    });

    res.json({ success: true, data: { ...result, weather, wardrobeCount: wardrobeItems.length } });
  } catch (error) {
    next(error);
  }
};

module.exports = { style };
