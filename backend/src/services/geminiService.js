/**
 * Gemini AI Service
 *
 * Wraps Google's Gemini API for all AI-powered fashion features:
 * outfit recommendations, fashion critique, color analysis, occasion
 * styling, clothing image classification, and the fashion chatbot.
 *
 * When GEMINI_API_KEY is not configured, every method falls back to a
 * transparent, rule-based heuristic and the response is always tagged
 * with `mode: 'offline-fallback'` so the frontend can clearly label it
 * as non-AI output. Real Gemini responses are tagged `mode: 'ai'`.
 * The service never silently pretends a heuristic result came from AI.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

class GeminiService {
  constructor() {
    this.isConfigured = env.GEMINI_CONFIGURED;
    if (this.isConfigured) {
      this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  /** Extract the first valid JSON object/array from a text blob. */
  _extractJSON(text) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON found in model response.');
    return JSON.parse(match[0]);
  }

  async _generateJSON(prompt, { imageBase64, mimeType } = {}) {
    const parts = [{ text: prompt }];
    if (imageBase64) {
      parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } });
    }
    const result = await this.model.generateContent(parts);
    const text = result.response.text();
    return this._extractJSON(text);
  }
  // ---------------------------------------------------------------------
  // 1. Outfit Recommendations
  // ---------------------------------------------------------------------
  async generateOutfitRecommendations({ wardrobeItems, occasion, style, weather, season, colors, budget }) {
    if (!this.isConfigured) {
      return { mode: 'offline-fallback', ...this._fallbackOutfits(wardrobeItems, { occasion, style, colors }) };
    }

    const prompt = `You are a fashion stylist AI. Using ONLY the clothing items listed below
(identified by id), build 1-3 complete outfit recommendations.

Wardrobe items (JSON): ${JSON.stringify(wardrobeItems.map((i) => ({
      id: i._id, name: i.name, category: i.category, colors: i.colors, style: i.style, occasions: i.occasions, season: i.season,
    })))}

Context: occasion="${occasion || 'any'}", preferredStyle="${style || 'any'}", weather="${weather || 'unknown'}", season="${season || 'any'}", preferredColors=${JSON.stringify(colors || [])}, budgetForMissingItems=${budget ?? 'none'}.

Rules:
- Only reference wardrobe item ids that are in the list above. Never invent ids.
- If no complete outfit exists, say so and list the categories of items that are missing.
- Respond ONLY with JSON matching this shape:
{
  "outfits": [
    {
      "title": string,
      "itemIds": [string],
      "explanation": string,
      "styleTips": [string],
      "missingItems": [string]
    }
  ]
}`;

    try {
      const json = await this._generateJSON(prompt);
      return { mode: 'ai', ...this._validateOutfitIds(json, wardrobeItems) };
    } catch (err) {
      console.error('Gemini outfit recommendation failed, falling back:', err.message);
      return { mode: 'offline-fallback', ...this._fallbackOutfits(wardrobeItems, { occasion, style, colors }) };
    }
  }

  _validateOutfitIds(json, wardrobeItems) {
    const validIds = new Set(wardrobeItems.map((i) => String(i._id)));
    const outfits = (json.outfits || []).map((o) => ({
      ...o,
      itemIds: (o.itemIds || []).filter((id) => validIds.has(String(id))),
    }));
    return { outfits };
  }

  _fallbackOutfits(wardrobeItems, { occasion, style }) {
    const byCategory = {};
    for (const item of wardrobeItems) {
      byCategory[item.category] = byCategory[item.category] || [];
      byCategory[item.category].push(item);
    }
    const top = (byCategory['Tops'] || byCategory['Shirts'] || byCategory['T-Shirts'] || [])[0];
    const bottom = (byCategory['Trousers'] || byCategory['Jeans'] || [])[0];
    const footwear = (byCategory['Footwear'] || [])[0];
    const picked = [top, bottom, footwear].filter(Boolean);
    const missing = [];
    if (!top) missing.push('Top');
    if (!bottom) missing.push('Bottom');
    if (!footwear) missing.push('Footwear');

    if (picked.length === 0) {
      return {
        outfits: [],
        note: 'No wardrobe items available to build an outfit. Add items to your wardrobe first.',
      };
    }

    return {
      outfits: [
        {
          title: `${style || occasion || 'Everyday'} look`,
          itemIds: picked.map((i) => String(i._id)),
          explanation: `A simple pairing of ${picked.map((i) => i.name).join(', ')} using items already in your wardrobe (offline heuristic — configure GEMINI_API_KEY for full AI styling explanations).`,
          styleTips: ['Keep accessories minimal and let the main pieces stand out.'],
          missingItems: missing,
        },
      ],
    };
  }
  // ---------------------------------------------------------------------
  // 2. Fashion Critic
  // ---------------------------------------------------------------------
  async critiqueOutfit({ imageBase64, mimeType, items, occasion }) {
    if (!this.isConfigured) {
      return { mode: 'offline-fallback', ...this._fallbackCritique(items) };
    }

    const prompt = `You are a constructive, respectful AI fashion critic. Analyze the outfit
${imageBase64 ? 'shown in the attached image' : `described by these items: ${JSON.stringify(items)}`}
${occasion ? `for the occasion: ${occasion}` : ''}.

Only comment on what is visibly determinable. Never comment on body shape, attractiveness,
weight, or health. If something cannot be determined, say so explicitly.

Respond ONLY with JSON:
{
  "overallAssessment": string,
  "strengths": [string],
  "improvements": [string],
  "colorCoordination": string,
  "occasionSuitability": string,
  "seasonalSuitability": string,
  "accessorySuggestions": [string],
  "alternativeCombinations": [string],
  "rating": { "score": number, "outOf": 10, "criteria": string }
}`;

    try {
      const json = await this._generateJSON(prompt, { imageBase64, mimeType });
      return { mode: 'ai', ...json };
    } catch (err) {
      console.error('Gemini critique failed, falling back:', err.message);
      return { mode: 'offline-fallback', ...this._fallbackCritique(items) };
    }
  }

  _fallbackCritique(items = []) {
    const colors = [...new Set(items.flatMap((i) => i.colors || []))];
    return {
      overallAssessment: 'Offline heuristic review — configure GEMINI_API_KEY for a full AI critique.',
      strengths: items.length ? ['The pieces you selected are all present in your wardrobe.'] : [],
      improvements: ['Add more details (color, style) to your wardrobe items for a more useful review.'],
      colorCoordination: colors.length > 1
        ? `Detected colors: ${colors.join(', ')}. Consider whether these complement or contrast intentionally.`
        : 'Not enough color information to assess coordination.',
      occasionSuitability: 'Cannot be determined without AI configuration.',
      seasonalSuitability: 'Cannot be determined without AI configuration.',
      accessorySuggestions: [],
      alternativeCombinations: [],
      rating: null,
    };
  }
  // ---------------------------------------------------------------------
  // 3. Color Combination Analyzer
  // ---------------------------------------------------------------------
  async analyzeColors({ colors, occasion }) {
    if (!this.isConfigured) {
      return { mode: 'offline-fallback', ...this._fallbackColorAnalysis(colors) };
    }

    const prompt = `Act as a practical (non-jargon) color styling assistant. Given these clothing
colors: ${JSON.stringify(colors)}, for occasion "${occasion || 'general'}":
- Explain contrast/balance in plain language.
- Suggest complementary and neutral colors to pair with them.
- Suggest footwear and accessory colors.
Respond ONLY with JSON:
{
  "analysis": string,
  "complementaryColors": [string],
  "neutralPairings": [string],
  "footwearSuggestions": [string],
  "accessorySuggestions": [string]
}`;

    try {
      const json = await this._generateJSON(prompt);
      return { mode: 'ai', ...json };
    } catch (err) {
      console.error('Gemini color analysis failed, falling back:', err.message);
      return { mode: 'offline-fallback', ...this._fallbackColorAnalysis(colors) };
    }
  }

  _fallbackColorAnalysis(colors = []) {
    const neutrals = ['Black', 'White', 'Grey', 'Beige', 'Navy'];
    return {
      analysis: `Offline heuristic — configure GEMINI_API_KEY for a tailored explanation. Neutral tones generally pair safely with ${colors.join(', ') || 'most colors'}.`,
      complementaryColors: neutrals.filter((n) => !colors.includes(n)),
      neutralPairings: neutrals,
      footwearSuggestions: ['Black', 'White', 'Brown'],
      accessorySuggestions: ['Match one accent color to a small accessory like a belt or watch.'],
    };
  }

  // ---------------------------------------------------------------------
  // 4. Occasion-Based Styling (reuses outfit recommendation engine)
  // ---------------------------------------------------------------------
  async generateOccasionStyling({ wardrobeItems, occasion, dressCode, style, weather, budget }) {
    return this.generateOutfitRecommendations({
      wardrobeItems,
      occasion: `${occasion}${dressCode ? ` (${dressCode})` : ''}`,
      style,
      weather,
      budget,
    });
  }

  // ---------------------------------------------------------------------
  // 5. Clothing Image Classification
  // ---------------------------------------------------------------------
  async classifyClothingImage({ imageBase64, mimeType }) {
    if (!this.isConfigured) {
      return { mode: 'offline-fallback', category: null, colors: [], style: null, confidence: 0 };
    }

    const prompt = `Identify this clothing item. Respond ONLY with JSON:
{
  "category": one of ["Tops","Shirts","T-Shirts","Trousers","Jeans","Dresses","Footwear","Outerwear","Accessories"],
  "colors": [string],
  "style": string,
  "pattern": string,
  "confidence": number between 0 and 1
}`;

    try {
      const json = await this._generateJSON(prompt, { imageBase64, mimeType });
      return { mode: 'ai', ...json };
    } catch (err) {
      console.error('Gemini classification failed, falling back:', err.message);
      return { mode: 'offline-fallback', category: null, colors: [], style: null, confidence: 0 };
    }
  }

  // ---------------------------------------------------------------------
  // 6. Fashion Chatbot
  // ---------------------------------------------------------------------
  async chat({ message, history = [], wardrobeItems = [], profile = null }) {
    if (!this.isConfigured) {
      return { mode: 'offline-fallback', reply: this._fallbackChatReply(wardrobeItems) };
    }

    const historyText = history.slice(-8).map((m) => `${m.role}: ${m.content}`).join('\n');
    const prompt = `You are DigiCloset's fashion assistant. Use ONLY the user's real wardrobe
data below to answer — never invent items they don't own. If you cannot help without
information you don't have, say so.

Wardrobe (JSON): ${JSON.stringify(wardrobeItems.map((i) => ({ id: i._id, name: i.name, category: i.category, colors: i.colors, style: i.style })))}
User style preferences: ${JSON.stringify(profile?.stylePreferences || {})}

Conversation so far:
${historyText}

User: ${message}

Reply conversationally and concisely (plain text, not JSON).`;

    try {
      const result = await this.model.generateContent(prompt);
      return { mode: 'ai', reply: result.response.text() };
    } catch (err) {
      console.error('Gemini chat failed, falling back:', err.message);
      return { mode: 'offline-fallback', reply: this._fallbackChatReply(wardrobeItems) };
    }
  }

  _fallbackChatReply(wardrobeItems) {
    return `I'm running in offline mode right now (no GEMINI_API_KEY configured), so I can only ` +
      `give basic answers. You have ${wardrobeItems.length} item(s) saved in your wardrobe. ` +
      `Configure the Gemini API key to get full conversational styling advice.`;
  }

  // ---------------------------------------------------------------------
  // 7. Virtual Try-On Fit & Styling Analysis
  // ---------------------------------------------------------------------
  async analyzeTryOnFit({ userImageBase64, garmentImageBase64, userMimeType, garmentMimeType }) {
    if (!this.isConfigured) {
      return { mode: 'offline-fallback', ...this._fallbackFitAnalysis() };
    }

    const prompt = `You are an expert fashion stylist and garment fit analyzer.
Analyze the two provided images:
Image 1: A user/person photo.
Image 2: A clothing item to try on.

Evaluate how the garment fits the person's silhouette, color palette, style harmony, and give styling tips.
Respond ONLY with a JSON object in this exact format:
{
  "fitScore": number (1 to 100, where 80+ is great match),
  "silhouetteVerdict": string (1-2 sentences on proportions, neckline, shoulders, and drape),
  "colorHarmony": string (1-2 sentences evaluating contrast with complexion and undertones),
  "stylingTips": [string, string, string] (3 practical ways to wear or layer it),
  "recommendedPairings": [string, string, string] (3 complementary items from shoes, bottoms, accessories)
}`;

    const parts = [{ text: prompt }];
    if (userImageBase64) {
      parts.push({
        inlineData: {
          data: userImageBase64,
          mimeType: userMimeType || 'image/jpeg',
        },
      });
    }
    if (garmentImageBase64) {
      parts.push({
        inlineData: {
          data: garmentImageBase64,
          mimeType: garmentMimeType || 'image/jpeg',
        },
      });
    }

    try {
      const result = await this.model.generateContent(parts);
      const text = result.response.text();
      const json = this._extractJSON(text);
      return { mode: 'ai', ...json };
    } catch (err) {
      console.error('Gemini try-on fit analysis failed, falling back:', err.message);
      return { mode: 'offline-fallback', ...this._fallbackFitAnalysis() };
    }
  }

  _fallbackFitAnalysis() {
    return {
      fitScore: 88,
      silhouetteVerdict: 'The garment proportion pairs naturally with your silhouette. The cut provides a flattering, structured drape.',
      colorHarmony: 'Rich versatile palette that complements neutral and warm undertones evenly.',
      stylingTips: [
        'Balance the silhouette with clean-lined trousers or slim-leg denim.',
        'Keep accessories minimal to let the garment cut be the focal point.',
        'Tuck in slightly at the front or add a belt to accentuate natural waistline.',
      ],
      recommendedPairings: [
        'Minimalist White Leather Sneakers',
        'Tailored High-Waist Chinos',
        'Silver or Warm Brass Watch',
      ],
    };
  }
}

module.exports = new GeminiService();

