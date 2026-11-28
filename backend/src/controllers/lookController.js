const mongoose = require('mongoose');
const Look = require('../models/Look');
const ClothingItem = require('../models/ClothingItem');
const { CATEGORIES } = require('../models/ClothingItem');
const imageService = require('../services/imageService');
const imageGeneration = require('../services/imageGenerationService');
const stylistService = require('../services/stylistService');

const MAX_TRY_ON_ITEMS = 5;
// Gemini rejects inline requests over ~20MB, and base64 adds a third. The
// Hugging Face Spaces take files one at a time (each already capped at 5MB by
// the upload middleware) and resize them themselves, so this is the binding limit.
const MAX_REFERENCE_BYTES = 14 * 1024 * 1024;
// Unsaved results are kept this long so a page reload doesn't lose them.
const UNSAVED_LOOK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ITEM_FIELDS = 'name category imageUrl';

const badRequest = (res, message) => res.status(400).json({ success: false, message });

/**
 * The person photo for a generation: a fresh upload, or (for "Generate
 * again") the stored photo of one of the caller's earlier looks.
 */
async function loadSourcePhoto(req) {
  const file = req.file || req.files?.photo?.[0];
  if (file) {
    // Checked before generation, since the photo is only stored afterwards.
    imageService.assertValidImage(file.buffer, file.mimetype);
    return { buffer: file.buffer, mimeType: file.mimetype, stored: null };
  }

  const { sourceLookId } = req.body;
  if (!mongoose.isValidObjectId(sourceLookId)) return null;
  const look = await Look.findOne({ _id: sourceLookId, owner: req.user._id });
  if (!look) return null;
  try {
    const image = await imageService.readImage(look.sourceImagePath);
    return { ...image, stored: { url: look.sourceImageUrl, path: look.sourceImagePath } };
  } catch {
    return null;
  }
}

/**
 * Generates the image first, then stores the person photo (if new) and the
 * result and saves the look. Nothing touches storage when generation fails;
 * anything stored is removed again if a later step fails.
 */
async function generateLook(req, {
  feature, source, prompt, references = [], items = [], style = null, garments = [], rate = false,
}) {
  const generated = await imageGeneration.generateImage({
    feature,
    prompt,
    images: [{ buffer: source.buffer, mimeType: source.mimeType }, ...references],
    items,
    style,
  });

  // The rating runs alongside storage; a failed rating never fails the look.
  const rating = rate
    ? stylistService.rateLook({ image: generated, items }).catch((err) => {
      console.warn(`Look rating failed: ${err.detail || err.message}`);
      return null;
    })
    : Promise.resolve(null);

  const uid = req.firebaseUser.uid;
  const created = [];
  try {
    let sourceImage = source.stored;
    if (!sourceImage) {
      sourceImage = await imageService.storeImage(source.buffer, { uid, folder: 'look-sources', mimetype: source.mimeType });
      created.push(sourceImage.path);
    }
    // Uploaded clothes are stored once; reused ones already have a copy.
    const storedGarments = [];
    for (const garment of garments) {
      if (garment.imagePath) {
        storedGarments.push(garment);
        continue;
      }
      const stored = await imageService.storeImage(garment.buffer, { uid, folder: 'tryon-garments', mimetype: garment.mimeType });
      created.push(stored.path);
      storedGarments.push({ name: garment.name, category: garment.category, imageUrl: stored.url, imagePath: stored.path });
    }
    const result = await imageService.storeImage(generated.buffer, { uid, folder: 'looks', mimetype: generated.mimeType });
    created.push(result.path);

    const look = await Look.create({
      owner: req.user._id,
      feature,
      sourceImageUrl: sourceImage.url,
      sourceImagePath: sourceImage.path,
      clothingItems: items.filter((item) => item._id).map((item) => item._id),
      garments: storedGarments,
      rating: await rating,
      style,
      provider: generated.provider,
      providerLabel: generated.providerLabel,
      resultUrl: result.url,
      resultPath: result.path,
    });
    return look.populate('clothingItems', ITEM_FIELDS);
  } catch (error) {
    created.forEach((p) => imageService.deleteImage(p).catch(() => {}));
    throw error;
  }
}

// Removes the image files of deleted looks. A source photo can be shared by
// several looks (Generate again), so it is only removed once unused.
async function discardLookImages(looks) {
  for (const look of looks) {
    imageService.deleteImage(look.resultPath).catch(() => {});
  }
  for (const sourcePath of new Set(looks.map((look) => look.sourceImagePath))) {
    if (!(await Look.exists({ sourceImagePath: sourcePath }))) {
      imageService.deleteImage(sourcePath).catch(() => {});
    }
  }
  for (const garmentPath of new Set(looks.flatMap((look) => (look.garments || []).map((g) => g.imagePath)))) {
    if (!(await Look.exists({ 'garments.imagePath': garmentPath }))) {
      imageService.deleteImage(garmentPath).catch(() => {});
    }
  }
}

async function pruneUnsavedLooks(ownerId) {
  const filter = { owner: ownerId, saved: false, createdAt: { $lt: new Date(Date.now() - UNSAVED_LOOK_TTL_MS) } };
  const stale = await Look.find(filter, 'sourceImagePath resultPath garments').lean();
  if (!stale.length) return;
  await Look.deleteMany({ _id: { $in: stale.map((look) => look._id) } });
  await discardLookImages(stale);
}

// GET /api/looks?feature=try-on|makeover&favorite=true — the caller's saved looks
const listLooks = async (req, res, next) => {
  try {
    await pruneUnsavedLooks(req.user._id);

    const filter = { owner: req.user._id, saved: true };
    if (Look.FEATURES.includes(req.query.feature)) filter.feature = req.query.feature;
    if (req.query.favorite === 'true') filter.favorite = true;

    const looks = await Look.find(filter).sort({ createdAt: -1 }).populate('clothingItems', ITEM_FIELDS);
    res.json({ success: true, data: { looks } });
  } catch (error) {
    next(error);
  }
};

// GET /api/looks/capabilities — whether try-on / makeover images can be
// generated right now and by which provider. Makes no generation call.
const getCapabilities = (req, res) => {
  res.json({ success: true, data: imageGeneration.getCapabilities() });
};

/**
 * Clothes uploaded for this try-on: fresh files with { name, category } in
 * `data.garments`, or (for "Generate again") the stored copies from the
 * earlier look named by `sourceLookId`.
 */
async function loadUploadedGarments(req) {
  const files = req.files?.garments || [];
  if (files.length) {
    const meta = Array.isArray(req.body.garments) ? req.body.garments : [];
    return files.map((file, index) => {
      imageService.assertValidImage(file.buffer, file.mimetype);
      const category = CATEGORIES.includes(meta[index]?.category) ? meta[index].category : 'Tops';
      const name = typeof meta[index]?.name === 'string' && meta[index].name.trim()
        ? meta[index].name.trim().slice(0, 60)
        : `Uploaded ${category.toLowerCase()}`;
      return { name, category, buffer: file.buffer, mimeType: file.mimetype };
    });
  }
  if (req.body.reuseGarments !== true || !mongoose.isValidObjectId(req.body.sourceLookId)) return [];
  const look = await Look.findOne({ _id: req.body.sourceLookId, owner: req.user._id }, 'garments').lean();
  return look?.garments || [];
}

// POST /api/looks/try-on — multipart `photo` + up to 5 `garments` files +
// `data` JSON { itemIds, garments: [{ name, category }] }; or JSON
// { itemIds, sourceLookId, reuseGarments } to reuse an earlier look's photos.
// Wardrobe items and uploaded clothes together are capped at 5.
const createTryOn = async (req, res, next) => {
  try {
    const itemIds = Array.isArray(req.body.itemIds) ? [...new Set(req.body.itemIds.map(String))] : [];
    if (!itemIds.every((id) => mongoose.isValidObjectId(id))) return badRequest(res, 'Invalid wardrobe item.');
    const garments = await loadUploadedGarments(req);
    if (!itemIds.length && !garments.length) return badRequest(res, 'Choose clothes from your wardrobe or upload clothing photos.');
    if (itemIds.length + garments.length > MAX_TRY_ON_ITEMS) return badRequest(res, `Choose at most ${MAX_TRY_ON_ITEMS} items at a time.`);

    const found = itemIds.length ? await ClothingItem.find({ _id: { $in: itemIds }, owner: req.user._id }) : [];
    if (found.length !== itemIds.length) {
      return res.status(404).json({ success: false, message: 'Some selected items are no longer in your wardrobe.' });
    }
    const wardrobeItems = itemIds.map((id) => found.find((item) => String(item._id) === id));
    const withoutPhoto = wardrobeItems.find((item) => !item.imagePath);
    if (withoutPhoto) return badRequest(res, `"${withoutPhoto.name}" has no photo. Add one in your wardrobe to try it on.`);

    const source = await loadSourcePhoto(req);
    if (!source) return badRequest(res, 'Upload a clear full-body photo of yourself.');

    const references = [
      ...(await Promise.all(wardrobeItems.map((item) => imageService.readImage(item.imagePath)))),
      ...(await Promise.all(garments.map((g) => (g.buffer ? { buffer: g.buffer, mimeType: g.mimeType } : imageService.readImage(g.imagePath))))),
    ];
    const totalBytes = [source, ...references].reduce((sum, image) => sum + image.buffer.length, 0);
    if (totalBytes > MAX_REFERENCE_BYTES) {
      return badRequest(res, 'These photos are too large to send together. Choose fewer items or use smaller photos.');
    }

    // Uploaded clothes are described to the model by their name and type.
    const items = [...wardrobeItems, ...garments.map(({ name, category }) => ({ name, category }))];
    const look = await generateLook(req, {
      feature: 'try-on',
      source,
      prompt: stylistService.tryOnPrompt(items),
      references,
      items,
      garments,
      rate: true,
    });
    res.status(201).json({ success: true, message: 'Your look is ready.', data: { look } });
  } catch (error) {
    next(error);
  }
};

// POST /api/looks/makeover/analyze — multipart `photo`; returns an outfit
// assessment and three style options. Nothing is stored.
const analyzeMakeover = async (req, res, next) => {
  try {
    if (!req.file) return badRequest(res, 'Upload a clear full-body photo of yourself.');
    const wardrobeItems = await ClothingItem.find({ owner: req.user._id }, 'name category colors').lean();
    const analysis = await stylistService.analyzeMakeover({
      photo: { buffer: req.file.buffer, mimeType: req.file.mimetype },
      user: req.user,
      wardrobeItems,
    });
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};

// POST /api/looks/makeover — multipart `photo` + `data` JSON { style },
// or JSON { style, sourceLookId } to reuse the photo of an earlier look.
const createMakeover = async (req, res, next) => {
  try {
    const style = stylistService.sanitizeStyleOption(req.body.style);
    if (!style) return badRequest(res, 'Choose one of the suggested styles.');

    const source = await loadSourcePhoto(req);
    if (!source) return badRequest(res, 'Upload a clear full-body photo of yourself.');

    const look = await generateLook(req, {
      feature: 'makeover',
      source,
      prompt: stylistService.makeoverPrompt(style),
      style,
    });
    res.status(201).json({ success: true, message: 'Your makeover is ready.', data: { look } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/looks/:id — { saved?, favorite? }. Favouriting also saves.
const updateLook = async (req, res, next) => {
  try {
    const look = await Look.findOne({ _id: req.params.id, owner: req.user._id });
    if (!look) return res.status(404).json({ success: false, message: 'Look not found.' });

    const { saved, favorite } = req.body;
    if (typeof saved === 'boolean') {
      look.saved = saved;
      if (!saved) look.favorite = false;
    }
    if (typeof favorite === 'boolean') {
      look.favorite = favorite;
      if (favorite) look.saved = true;
    }
    await look.save();
    await look.populate('clothingItems', ITEM_FIELDS);
    res.json({ success: true, data: { look } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/looks/:id
const deleteLook = async (req, res, next) => {
  try {
    const look = await Look.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!look) return res.status(404).json({ success: false, message: 'Look not found.' });
    await discardLookImages([look]);
    res.json({ success: true, message: 'Look deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCapabilities, listLooks, createTryOn, analyzeMakeover, createMakeover, updateLook, deleteLook };
