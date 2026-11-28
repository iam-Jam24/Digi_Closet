const ClothingItem = require('../models/ClothingItem');
const stylistService = require('../services/stylistService');
const imageService = require('../services/imageService');
const imageGeneration = require('../services/imageGenerationService');

function parseIds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(raw).split(',').map((id) => id.trim()).filter(Boolean);
  }
}

// POST /api/fashion/analyze — multipart: optional `image`, optional `itemIds`
// (JSON array of the user's wardrobe ids), optional `occasion`.
const analyze = async (req, res, next) => {
  try {
    const { occasion } = req.body;
    const itemIds = parseIds(req.body.itemIds);

    const wardrobeItems = await ClothingItem.find({ owner: req.user._id });
    const selectedItems = wardrobeItems.filter((item) => itemIds.includes(String(item._id)));

    if (!req.file && selectedItems.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Upload an outfit photo or select at least two items from your wardrobe.',
      });
    }

    const result = await stylistService.critiqueOutfit({
      image: req.file && { buffer: req.file.buffer, mimeType: req.file.mimetype },
      selectedItems,
      wardrobeItems,
      occasion,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// POST /api/fashion/visualize — multipart `image` + `data` JSON { area, fix }.
// Returns the photo edited to show one suggested fix, as a data URL. It is a
// preview only: nothing is stored.
const visualize = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload the outfit photo to preview a fix.' });
    imageService.assertValidImage(req.file.buffer, req.file.mimetype);
    const fix = typeof req.body.fix === 'string' ? req.body.fix.trim().slice(0, 100) : '';
    const area = typeof req.body.area === 'string' ? req.body.area.trim().slice(0, 40) : '';
    if (!fix) return res.status(400).json({ success: false, message: 'Choose a suggestion to preview.' });

    const generated = await imageGeneration.generateImage({
      feature: 'makeover',
      prompt: stylistService.critiqueFixPrompt({ area, fix }),
      images: [{ buffer: req.file.buffer, mimeType: req.file.mimetype }],
    });
    res.json({
      success: true,
      data: { image: `data:${generated.mimeType};base64,${generated.buffer.toString('base64')}`, provider: generated.providerLabel },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/fashion/capabilities — whether fix previews can be generated now.
const capabilities = (req, res) => {
  res.json({ success: true, data: { visualize: imageGeneration.getCapabilities().makeover } });
};

module.exports = { analyze, visualize, capabilities };
