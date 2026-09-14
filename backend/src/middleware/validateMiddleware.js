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
const registerSchema = {
  name: { required: true, label: 'Name', minLength: 2, maxLength: 50 },
  email: { required: true, label: 'Email', type: 'email' },
  password: { required: true, label: 'Password', minLength: 6 },
  confirmPassword: { required: true, label: 'Confirm Password', match: 'password', matchLabel: 'Password' },
};

const loginSchema = {
  email: { required: true, label: 'Email', type: 'email' },
  password: { required: true, label: 'Password' },
};

const profileSchema = {
  height: { label: 'Height' },
  preferredColors: { label: 'Preferred Colors', isArray: true },
  preferredStyles: { label: 'Preferred Styles', isArray: true },
  budgetMin: { label: 'Budget Min', isNumber: true },
  budgetMax: { label: 'Budget Max', isNumber: true },
  preferredOccasions: { label: 'Preferred Occasions', isArray: true },
};

const wardrobeSchema = {
  name: { required: true, label: 'Item Name', minLength: 1, maxLength: 100 },
  category: {
    required: true,
    label: 'Category',
    enum: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'],
  },
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  profileSchema,
  wardrobeSchema,
};
