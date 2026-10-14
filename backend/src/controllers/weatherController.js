const weatherService = require('../services/weatherService');

// GET /api/weather?city=...  or ?lat=...&lon=...
const getWeather = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;
    if (!city && !(lat && lon)) {
      return res.status(400).json({ success: false, message: 'Provide a city or lat/lon.' });
    }
    const result = await weatherService.getCurrentWeather({ city, lat, lon });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWeather };
