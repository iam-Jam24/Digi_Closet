const stylistService = require('../services/stylistService');

const hasPalette = (palette) => palette?.recommendedColors?.length > 0;

// POST /api/colors/palette/analyze — a face photo and an optional wrist photo
// are analysed in memory and never written to disk or the database.
// Requires explicit consent.
const analyzePersonalPalette = async (req, res, next) => {
  try {
    if (req.body.consent !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'Please confirm you consent to sending these photos to Google Gemini for analysis.',
      });
    }
    const face = req.files?.image?.[0];
    if (!face) {
      return res.status(400).json({ success: false, message: 'Please upload a clear face photo.' });
    }
    const wrist = req.files?.wristImage?.[0];

    const palette = await stylistService.analyzeColorPalette({
      face: { buffer: face.buffer, mimeType: face.mimetype },
      wrist: wrist && { buffer: wrist.buffer, mimeType: wrist.mimetype },
      user: req.user,
    });

    res.json({ success: true, data: { palette } });
  } catch (error) {
    next(error);
  }
};

// GET /api/colors/palette
const getPersonalPalette = async (req, res, next) => {
  try {
    const palette = req.user.colorPalette;
    res.json({ success: true, data: { palette: hasPalette(palette) ? palette : null } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/colors/palette — save an AI palette or a manually edited one
const savePersonalPalette = async (req, res, next) => {
  try {
    const body = req.body || {};
    const palette = {
      ...stylistService.normalizePalette(body),
      source: body.source === 'ai' ? 'ai' : 'custom',
      analyzedAt: new Date(),
    };

    if (!hasPalette(palette)) {
      return res.status(400).json({ success: false, message: 'A palette needs at least one recommended colour.' });
    }

    req.user.colorPalette = palette;
    await req.user.save();
    res.json({ success: true, message: 'Colour palette saved.', data: { palette: req.user.colorPalette } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/colors/palette
const deletePersonalPalette = async (req, res, next) => {
  try {
    req.user.colorPalette = {};
    await req.user.save();
    res.json({ success: true, message: 'Colour palette removed.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzePersonalPalette, getPersonalPalette, savePersonalPalette, deletePersonalPalette };
