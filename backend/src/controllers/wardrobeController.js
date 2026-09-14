const prisma = require('../config/db');

const getItems = async (req, res, next) => {
  try {
    const { category } = req.query;

    const where = { userId: req.user.id };
    if (category) {
      where.category = category;
    }

    const items = await prisma.wardrobeItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { items, count: items.length },
    });
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { name, category, color, brand, imageUrl, notes } = req.body;

    const item = await prisma.wardrobeItem.create({
      data: {
        userId: req.user.id,
        name,
        category,
        color: color || null,
        brand: brand || null,
        imageUrl: imageUrl || null,
        notes: notes || null,
      },
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

const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const item = await prisma.wardrobeItem.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    if (item.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this item.',
      });
    }

    await prisma.wardrobeItem.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Item removed from wardrobe.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getItems, addItem, deleteItem };
