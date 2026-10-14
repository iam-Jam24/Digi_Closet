const ClothingItem = require('../models/ClothingItem');
const geminiService = require('../services/geminiService');

// POST /api/fashion/analyze — accepts either an uploaded image or a list of
// wardrobe item ids (validated against the user's actual wardrobe).
const analyze = async (req, res, next) => {
  try {
    const { occasion, itemIds } = req.body;
    let items = [];

    if (itemIds) {
      const parsedIds = Array.isArray(itemIds) ? itemIds : JSON.parse(itemIds);
      items = await ClothingItem.find({ _id: { $in: parsedIds }, owner: req.user._id });
    }

    const payload = { occasion, items };
    if (req.file) {
      payload.imageBase64 = req.file.buffer.toString('base64');
      payload.mimeType = req.file.mimetype;
    } else if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide an outfit photo or select wardrobe items to critique.',
      });
    }

    const result = await geminiService.critiqueOutfit(payload);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyze };
