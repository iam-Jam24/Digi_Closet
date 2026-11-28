/**
 * The AI provider behind every text and photo-reading feature, chosen by
 * AI_PROVIDER ("groq" or "gemini"). Both expose generateJSON(), chat() and
 * imagePart(), so stylistService doesn't depend on which one is in use.
 */

const env = require('../config/env');

const PROVIDERS = {
  groq: () => require('./groqService'),
  gemini: () => require('./geminiService'),
};

if (!PROVIDERS[env.AI_PROVIDER]) {
  console.warn(`⚠️  Unknown AI_PROVIDER "${env.AI_PROVIDER}"; using groq (known: ${Object.keys(PROVIDERS).join(', ')}).`);
}

module.exports = (PROVIDERS[env.AI_PROVIDER] || PROVIDERS.groq)();
