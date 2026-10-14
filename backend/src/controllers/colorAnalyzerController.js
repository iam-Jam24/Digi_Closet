const geminiService = require('../services/geminiService');

// POST /api/colors/analyze
const analyze = async (req, res, next) => {
  try {
    const { colors, occasion } = req.body;
    const result = await geminiService.analyzeColors({ colors, occasion });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyze };
