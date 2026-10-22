const weatherService = require('../services/weatherService');

// GET /api/weather?city=...  or ?lat=...&lon=...
const getWeather = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;
    const result = await weatherService.getCurrentWeather({
      city: city || (!lat && !lon ? 'Bengaluru' : undefined),
      lat,
      lon,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWeather };
