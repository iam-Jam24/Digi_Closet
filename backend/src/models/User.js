const mongoose = require('mongoose');

const SKIN_TONES = ['fair', 'light', 'light-medium', 'medium', 'tan', 'deep', 'dark'];
const UNDERTONES = ['warm', 'cool', 'neutral', 'olive', 'uncertain'];
const VEIN_COLORS = ['blue-purple', 'green', 'blue-green', 'inconclusive', 'not-provided'];
const COLOR_GUIDE_CATEGORIES = ['everyday', 'formal', 'casual', 'festive', 'accessories', 'neutrals', 'contrast'];

const stylePreferencesSchema = new mongoose.Schema(
  {
    preferredStyles: { type: [String], default: [] },
    favoriteColors: { type: [String], default: [] },
    dislikedColors: { type: [String], default: [] },
    preferredBrands: { type: [String], default: [] },
    preferredCategories: { type: [String], default: [] },
    preferredSizes: { type: [String], default: [] },
    aesthetics: { type: [String], default: [] },
    preferredOccasions: { type: [String], default: [] },
    budgetMin: { type: Number, default: null },
    budgetMax: { type: Number, default: null },
    preferredStores: { type: [String], default: [] },
  },
  { _id: false }
);

const physicalProfileSchema = new mongoose.Schema(
  {
    height: { type: String, default: null },
    weight: { type: String, default: null },
    faceShape: { type: String, default: null },
    clothingSizes: { type: String, default: null },
    fitPreferences: { type: String, default: null },
    consentGiven: { type: Boolean, default: false },
  },
  { _id: false }
);

const colorSwatchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { _id: false }
);

// How each colour in a combination is worn, garment by garment.
const combinationPiecesSchema = new mongoose.Schema(
  {
    tops: { type: String, default: '' },
    trousers: { type: String, default: '' },
    jackets: { type: String, default: '' },
    dresses: { type: String, default: '' },
    shoes: { type: String, default: '' },
    accessories: { type: String, default: '' },
  },
  { _id: false }
);

const colorCombinationSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    usage: { type: String, default: '' },
    hexes: { type: [String], default: [] },
    pieces: { type: combinationPiecesSchema, default: () => ({}) },
  },
  { _id: false }
);

const colorGuideEntrySchema = new mongoose.Schema(
  {
    category: { type: String, enum: COLOR_GUIDE_CATEGORIES, required: true },
    colors: { type: [colorSwatchSchema], default: [] },
    tip: { type: String, default: '' },
  },
  { _id: false }
);

// Only the derived palette is stored; the photos used to create it are not.
const personalColorPaletteSchema = new mongoose.Schema(
  {
    season: {
      type: String,
      enum: ['Spring', 'Summer', 'Autumn', 'Winter', 'Unknown'],
      default: 'Unknown',
    },
    // Estimated from the face photo; a styling estimate, not a measurement.
    skinTone: { type: String, enum: [...SKIN_TONES, null], default: null },
    undertone: {
      type: String,
      enum: UNDERTONES,
      default: 'uncertain',
    },
    undertoneNote: { type: String, default: '' },
    // 'not-provided' when no wrist photo was given; never guessed from a face.
    veinColor: { type: String, enum: VEIN_COLORS, default: 'not-provided' },
    veinNote: { type: String, default: '' },
    confidence: { type: String, enum: ['low', 'medium', 'high', null], default: null },
    contrast: { type: String, enum: ['low', 'medium', 'high', null], default: null },
    summary: { type: String, default: '' },
    lightingNote: { type: String, default: '' },
    recommendedColors: { type: [colorSwatchSchema], default: [] },
    neutralColors: { type: [colorSwatchSchema], default: [] },
    experimentColors: { type: [colorSwatchSchema], default: [] },
    avoidColors: { type: [colorSwatchSchema], default: [] },
    recommendedMetals: { type: [colorSwatchSchema], default: [] },
    lessFlatteringMetals: { type: [colorSwatchSchema], default: [] },
    combinations: { type: [colorCombinationSchema], default: [] },
    guide: { type: [colorGuideEntrySchema], default: [] },
    source: { type: String, enum: ['ai', 'custom'], default: 'ai' },
    analyzedAt: { type: Date, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    // An account has an email, a phone number (OTP sign-in), or both.
    email: { type: String, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    onboardingCompleted: { type: Boolean, default: false },
    stylePreferences: { type: stylePreferencesSchema, default: () => ({}) },
    physicalProfile: { type: physicalProfileSchema, default: () => ({}) },
    colorPalette: { type: personalColorPaletteSchema, default: () => ({}) },
    privacySettings: {
      allowPhysicalDataUse: { type: Boolean, default: false },
      allowAIPersonalization: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Unique only when present, so phone-only and email-only accounts can coexist.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
userSchema.index({ phoneNumber: 1 }, { unique: true, partialFilterExpression: { phoneNumber: { $type: 'string' } } });

module.exports = mongoose.model('User', userSchema);
module.exports.SKIN_TONES = SKIN_TONES;
module.exports.UNDERTONES = UNDERTONES;
module.exports.VEIN_COLORS = VEIN_COLORS;
module.exports.COLOR_GUIDE_CATEGORIES = COLOR_GUIDE_CATEGORIES;
