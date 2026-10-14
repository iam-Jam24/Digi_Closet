const imageService = require('../services/imageService');
const tryOnService = require('../services/tryOnService');

// POST /api/try-on — accepts two uploaded images (userPhoto, garmentPhoto)
const createTryOn = async (req, res, next) => {
  try {
    const userPhoto = req.files?.userPhoto?.[0];
    const garmentPhoto = req.files?.garmentPhoto?.[0];

    if (!userPhoto || !garmentPhoto) {
      return res.status(400).json({
        success: false,
        message: 'Both a personal photo and a garment photo are required.',
      });
    }

    const uid = req.firebaseUser.uid;

    const userImage = await imageService.storeImage(userPhoto.buffer, {
      uid, folder: 'tryon-user', mimetype: userPhoto.mimetype,
    });
    const garmentImage = await imageService.storeImage(garmentPhoto.buffer, {
      uid, folder: 'tryon-garment', mimetype: garmentPhoto.mimetype,
    });

    const job = await tryOnService.createJob({
      ownerId: req.user._id,
      userImageUrl: userImage.url,
      garmentImageUrl: garmentImage.url,
    });

    const geminiService = require('../services/geminiService');
    let fitAnalysis = null;
    try {
      fitAnalysis = await geminiService.analyzeTryOnFit({
        userImageBase64: userPhoto.buffer.toString('base64'),
        garmentImageBase64: garmentPhoto.buffer.toString('base64'),
        userMimeType: userPhoto.mimetype,
        garmentMimeType: garmentPhoto.mimetype,
      });
    } catch (analysisErr) {
      console.error('Fit analysis failed:', analysisErr.message);
    }

    if (fitAnalysis) {
      job.fitAnalysis = fitAnalysis;
      await job.save();
    }

    const statusCode = job.status === 'awaiting_configuration' ? 202 : 201;

    res.status(statusCode).json({
      success: true,
      message: job.status === 'awaiting_configuration'
        ? 'Photos saved and AI Fit Analysis generated. Full 3D warp rendering is awaiting external provider setup.'
        : 'Try-on job created.',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/try-on/:id
const getTryOn = async (req, res, next) => {
  try {
    const job = await tryOnService.getJob({ jobId: req.params.id, ownerId: req.user._id });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Try-on job not found.' });
    }
    res.json({ success: true, data: { job } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTryOn, getTryOn };
