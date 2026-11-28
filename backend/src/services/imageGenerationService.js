/**
 * Image generation for Virtual Try-On and Style Makeover.
 *
 * Providers are tried in the order of IMAGE_GENERATION_PROVIDERS (e.g.
 * "gemini,huggingface,openrouter"). The next provider is used only when the current one
 * can't serve requests at all right now (no quota, not configured, overloaded,
 * timed out, Space down). Input problems (422, e.g. no person in the photo)
 * are returned straight away. If every provider is down, the caller gets an
 * honest 503; nothing here substitutes placeholder images.
 *
 * A provider is { name, isAvailable(feature), generate(request) } where
 * request is { feature, prompt, images, items, style } (images[0] is the
 * person photo) and generate resolves to { buffer, mimeType, provider?, providerLabel? }.
 */

const env = require('../config/env');
const gemini = require('./geminiService');
const huggingface = require('./huggingfaceImageProvider');
const openrouter = require('./openrouterImageProvider');

const { GeminiService, AIError, toAIError } = gemini;

const geminiProvider = {
  name: 'gemini',
  isAvailable: () => gemini.canGenerateImages(),
  generate: async ({ prompt, images }) => ({
    ...(await gemini.generateImage({
      prompt,
      images: images.map((image) => GeminiService.imagePart(image.buffer, image.mimeType)),
    })),
    provider: 'gemini',
    providerLabel: 'Gemini',
  }),
};

const PROVIDERS = { gemini: geminiProvider, huggingface, openrouter };

const unknown = env.IMAGE_GENERATION_PROVIDERS.filter((name) => !PROVIDERS[name]);
if (unknown.length) {
  console.warn(`⚠️  Ignoring unknown IMAGE_GENERATION_PROVIDERS: ${unknown.join(', ')} (known: ${Object.keys(PROVIDERS).join(', ')}).`);
}

const configuredProviders = () => env.IMAGE_GENERATION_PROVIDERS.map((name) => PROVIDERS[name]).filter(Boolean);

const unavailableError = (detail) => new AIError(
  'Image generation isn\'t available right now. Please try again later.',
  503,
  { unavailable: true, detail }
);

/**
 * @param {{ feature: 'try-on'|'makeover', prompt: string, images: Array<{ buffer: Buffer, mimeType: string }>, items?: object[], style?: object }} request
 * @param {{ providers?: object[] }} [options] provider list override (tests)
 * @returns {Promise<{ buffer: Buffer, mimeType: string, provider: string, providerLabel: string }>}
 */
async function generateImage(request, { providers = configuredProviders() } = {}) {
  if (!providers.length) {
    throw unavailableError(`No usable image provider in IMAGE_GENERATION_PROVIDERS="${env.IMAGE_GENERATION_PROVIDERS.join(',')}".`);
  }
  const skipped = [];
  for (const provider of providers) {
    if (!provider.isAvailable(request.feature)) {
      skipped.push(`${provider.name}: unavailable (not configured or no quota)`);
      continue;
    }
    try {
      const result = await provider.generate(request);
      return { ...result, provider: result.provider || provider.name, providerLabel: result.providerLabel || provider.name };
    } catch (err) {
      const error = err instanceof AIError ? err : toAIError(err);
      if (!error.unavailable) throw error;
      console.warn(`Image provider ${provider.name} unavailable: ${error.detail || error.message}`);
      skipped.push(`${provider.name}: ${error.detail || error.message}`);
    }
  }
  throw unavailableError(`Every image provider failed. ${skipped.join(' | ')}`);
}

const FEATURE_KEYS = { tryOn: 'try-on', makeover: 'makeover' };

/**
 * Which provider would serve each feature right now, from configuration and
 * circuit-breaker state only. Makes no generation (or other paid) call.
 */
function getCapabilities({ providers = configuredProviders() } = {}) {
  const capabilities = {};
  for (const [key, feature] of Object.entries(FEATURE_KEYS)) {
    const provider = providers.find((p) => p.isAvailable(feature));
    capabilities[key] = provider
      ? { available: true, provider: provider.name, reason: null }
      : {
        available: false,
        provider: null,
        reason: 'Image generation isn\'t available right now. Please check back later.',
      };
  }
  return capabilities;
}

module.exports = { generateImage, getCapabilities, PROVIDERS };
