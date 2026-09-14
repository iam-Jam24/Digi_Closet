const prisma = require('../config/db');

const getProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, color, style } = req.query;

    const where = {};

    if (category) {
      where.category = category;
    }

    if (color) {
      where.color = { equals: color, mode: 'insensitive' };
    }

    if (style) {
      where.style = { equals: style, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { products, count: products.length },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProductById };
