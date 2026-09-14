const prisma = require('../config/db');

const getProfile = async (req, res, next) => {
  try {
    let profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    // Auto-create empty profile if none exists
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: req.user.id },
      });
    }

    res.json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const {
      height,
      preferredColors,
      preferredStyles,
      budgetMin,
      budgetMax,
      preferredOccasions,
    } = req.body;

    const profile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      update: {
        height: height || null,
        preferredColors: preferredColors || [],
        preferredStyles: preferredStyles || [],
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        preferredOccasions: preferredOccasions || [],
      },
      create: {
        userId: req.user.id,
        height: height || null,
        preferredColors: preferredColors || [],
        preferredStyles: preferredStyles || [],
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        preferredOccasions: preferredOccasions || [],
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
