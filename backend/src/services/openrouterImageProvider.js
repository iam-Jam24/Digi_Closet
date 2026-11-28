/**
 * Paid image generation through OpenRouter (openrouter.ai), used as the last
 * fallback when Gemini and the free Hugging Face Spaces can't serve requests.
 *
 * Calls the chat completions API with modalities ["image", "text"]: the prompt
 * and every input photo (person first, then garments) go in one user message,
 * and the edited photo comes back as a base64 data URL in message.images.
 * Models in OPENROUTER_IMAGE_MODELS are tried in order; one that reports no
 * credits or no access is skipped for AI_QUOTA_COOLDOWN_MS.
 */

const env = require('../config/env');
const availability = require('./aiAvailability');
const { AIError } = require('./geminiService');

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const UNAVAILABLE_MESSAGE = 'Image generation isn\'t available right now. Please try again later.';

const breakerKey = (model) => `openrouter:${model}`;
const modelLabel = (model) => model.split('/').pop();

/** Maps an OpenRouter HTTP status and error text to an AIError. */
function openrouterToAIError(status, text, model) {
  const detail = `OpenRouter ${model}: ${status || ''} ${text}`.trim();
  // 401 bad key, 402 out of credits, 403 moderation/region, 404 model gone.
  if (status === 401 || status === 402 || status === 404 || /insufficient credits|more credits/i.test(text)) {
    availability.markUnavailable(breakerKey(model), status === 402 ? 'no credits' : `HTTP ${status}`);
    return new AIError(UNAVAILABLE_MESSAGE, 503, { unavailable: true, detail });
  }
  if (status === 429 || status >= 500 || !status) {
    return new AIError(UNAVAILABLE_MESSAGE, 503, { unavailable: true, detail });
  }
  if (status === 403) {
    return new AIError('The image generator declined this photo. Try a different photo.', 422, { detail });
  }
  return new AIError('The image generator couldn\'t process this photo. Try a clear, well-lit, full-body photo.', 422, { detail });
}

class OpenRouterImageProvider {
  constructor({ fetchImpl = fetch } = {}) {
    this.name = 'openrouter';
    this.fetch = fetchImpl;
  }

  get models() {
    return env.OPENROUTER_API_KEY ? env.OPENROUTER_IMAGE_MODELS : [];
  }

  // No network: availability is configuration plus circuit-breaker state.
  isAvailable() {
    return this.models.some((model) => availability.isAvailable(breakerKey(model)));
  }

  async call(model, { prompt, images }) {
    let res;
    try {
      res = await this.fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'DigiCloset',
        },
        body: JSON.stringify({
          model,
          modalities: ['image', 'text'],
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...images.map((image) => ({
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.buffer.toString('base64')}` },
              })),
            ],
          }],
        }),
        signal: AbortSignal.timeout(env.OPENROUTER_TIMEOUT_MS),
      });
    } catch (err) {
      throw openrouterToAIError(0, err.name === 'TimeoutError' ? 'Request timed out' : err.message, model);
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw openrouterToAIError(data.error?.code || res.status, data.error?.message || res.statusText, model);
    }
    const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
    const match = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(url);
    if (!match) {
      const reply = String(data.choices?.[0]?.message?.content || '').slice(0, 200);
      throw new AIError('The image generator couldn\'t process this photo. Try a clear, well-lit, full-body photo.', 422, {
        detail: `OpenRouter ${model} returned no image. ${reply}`,
      });
    }
    return { buffer: Buffer.from(match[2], 'base64'), mimeType: match[1] };
  }

  /**
   * @param {{ prompt: string, images: Array<{buffer, mimeType}> }} request
   *   images[0] is the person photo, then any garment photos.
   */
  async generate({ prompt, images }) {
    let lastError = new AIError(UNAVAILABLE_MESSAGE, 503, { unavailable: true, detail: 'OpenRouter: no usable model.' });
    for (const model of this.models) {
      if (!availability.isAvailable(breakerKey(model))) continue;
      try {
        const image = await this.call(model, { prompt, images });
        return { ...image, provider: `openrouter:${model}`, providerLabel: modelLabel(model) };
      } catch (err) {
        if (!err.unavailable) throw err;
        console.warn(`Image provider openrouter: ${err.detail || err.message}`);
        lastError = err;
      }
    }
    throw lastError;
  }
}

module.exports = new OpenRouterImageProvider();
module.exports.OpenRouterImageProvider = OpenRouterImageProvider;
module.exports.openrouterToAIError = openrouterToAIError;
