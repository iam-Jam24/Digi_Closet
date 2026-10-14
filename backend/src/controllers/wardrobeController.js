const ClothingItem = require('../models/ClothingItem');
const imageService = require('../services/imageService');
const geminiService = require('../services/geminiService');

// GET /api/wardrobe
const getItems = async (req, res, next) => {
  try {
    const { category, search, sort } = req.query;

    const filter = { owner: req.user._id };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { colors: { $regex: search, $options: 'i' } },
      ];
    }

    let sortSpec = { createdAt: -1 };
    if (sort === 'name') sortSpec = { name: 1 };
    if (sort === 'category') sortSpec = { category: 1 };
    if (sort === 'oldest') sortSpec = { createdAt: 1 };

    const items = await ClothingItem.find(filter).sort(sortSpec);

    res.json({
      success: true,
      data: { items, count: items.length },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/wardrobe/:id
const getItemById = async (req, res, next) => {
  try {
    const item = await ClothingItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }
    if (String(item.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this item.' });
    }
    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
};

// POST /api/wardrobe/classify — AI-assisted category/color/style suggestion
// from an uploaded image, for the user to review before saving.
const classifyImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }
    const suggestion = await geminiService.classifyClothingImage({
      imageBase64: req.file.buffer.toString('base64'),
      mimeType: req.file.mimetype,
    });
    res.json({ success: true, data: { suggestion } });
  } catch (error) {
    next(error);
  }
};

// POST /api/wardrobe/upload-image — uploads the image file and returns a URL
// to be used when creating/updating a wardrobe item.
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }
    const { url, path } = await imageService.storeImage(req.file.buffer, {
      uid: req.firebaseUser.uid,
      folder: 'wardrobe',
      mimetype: req.file.mimetype,
    });
    res.status(201).json({ success: true, data: { imageUrl: url, imagePath: path } });
  } catch (error) {
    next(error);
  }
};

// POST /api/wardrobe
const addItem = async (req, res, next) => {
  try {
    const {
      name, description, category, imageUrl, colors, pattern,
      season, style, occasions, size, fit, brand, notes, aiSuggested,
    } = req.body;

    const item = await ClothingItem.create({
      owner: req.user._id,
      name,
      description: description || '',
      category,
      imageUrl: imageUrl || null,
      colors: colors || [],
      pattern: pattern || null,
      season: season || [],
      style: style || null,
      occasions: occasions || [],
      size: size || null,
      fit: fit || null,
      brand: brand || null,
      notes: notes || '',
      aiSuggested: aiSuggested || undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Item added to wardrobe.',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/wardrobe/:id
const updateItem = async (req, res, next) => {
  try {
    const item = await ClothingItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }
    if (String(item.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this item.' });
    }

    const updatable = [
      'name', 'description', 'category', 'imageUrl', 'colors', 'pattern',
      'season', 'style', 'occasions', 'size', 'fit', 'brand', 'notes',
    ];
    for (const field of updatable) {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    }

    await item.save();

    res.json({
      success: true,
      message: 'Item updated.',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/wardrobe/:id
const deleteItem = async (req, res, next) => {
  try {
    const item = await ClothingItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (String(item.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this item.' });
    }

    if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
      imageService.deleteImage(item.imageUrl.replace('/uploads/', ''));
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: 'Item removed from wardrobe.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItems,
  getItemById,
  classifyImage,
  uploadImage,
  addItem,
  updateItem,
  deleteItem,
};
