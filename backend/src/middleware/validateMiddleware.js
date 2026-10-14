/**
 * Validation middleware factory.
 * Takes a schema object with field validators and returns Express middleware.
 */

const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rules.label || field} is required.`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rules.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${rules.label || field} must be a valid email address.`);
          }
        }

        if (rules.minLength && String(value).length < rules.minLength) {
          errors.push(`${rules.label || field} must be at least ${rules.minLength} characters.`);
        }

        if (rules.maxLength && String(value).length > rules.maxLength) {
          errors.push(`${rules.label || field} must be at most ${rules.maxLength} characters.`);
        }

        if (rules.match && req.body[rules.match] !== value) {
          errors.push(`${rules.label || field} does not match ${rules.matchLabel || rules.match}.`);
        }

        if (rules.isArray && !Array.isArray(value)) {
          errors.push(`${rules.label || field} must be an array.`);
        }

        if (rules.isNumber && isNaN(Number(value))) {
          errors.push(`${rules.label || field} must be a number.`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${rules.label || field} must be one of: ${rules.enum.join(', ')}.`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    next();
  };
};

// Predefined validation schemas
// Note: authentication (registration/login) is handled by Firebase Auth on
// the client; the backend only verifies ID tokens, so no auth schemas
// are needed here anymore.

const profileSchema = {
  height: { label: 'Height' },
  weight: { label: 'Weight' },
};

const wardrobeSchema = {
  name: { required: true, label: 'Item Name', minLength: 1, maxLength: 100 },
  category: {
    required: true,
    label: 'Category',
    enum: ['Tops', 'Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Dresses', 'Footwear', 'Outerwear', 'Accessories'],
  },
};

const outfitRecommendSchema = {
  occasion: { label: 'Occasion' },
};

const colorAnalyzeSchema = {
  colors: { required: true, label: 'Colors', isArray: true },
};

const shoppingPlanSchema = {
  budget: { required: true, label: 'Budget', isNumber: true },
};

const chatSchema = {
  message: { required: true, label: 'Message', minLength: 1, maxLength: 1000 },
};

module.exports = {
  validate,
  profileSchema,
  wardrobeSchema,
  outfitRecommendSchema,
  colorAnalyzeSchema,
  shoppingPlanSchema,
  chatSchema,
};
