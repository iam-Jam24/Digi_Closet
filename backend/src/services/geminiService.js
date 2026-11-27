/**
 * Thin wrapper around the Google GenAI SDK.
 *
 * Every AI feature goes through generateJSON(), generateImage() or chat().
 * Failures are surfaced as AIError with an HTTP status the error middleware
 * can return; nothing here ever substitutes canned or mock output.
 *
 * AIError keeps two messages apart: `message` is safe to show users, while
 * `detail` (logged server-side only) names env vars, billing and so on.
 */

const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');
const availability = require('./aiAvailability');

const RETRYABLE = new Set([429, 500, 503, 504]);
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;
// Stop trying once this much time has passed, so users aren't left waiting minutes.
const TOTAL_BUDGET_MS = 60000;
// Image editing is much slower than text.
const IMAGE_REQUEST_TIMEOUT_MS = 120000;
const IMAGE_TOTAL_BUDGET_MS = 150000;

const UNAVAILABLE_MESSAGE = 'This AI feature isn\'t available right now. Please try again later.';

class AIError extends Error {
  /**
   * @param {string} message user-facing text
   * @param {number} statusCode HTTP status to return
   * @param {{ detail?: string, unavailable?: boolean }} [options]
   *   detail: developer-only explanation (logged, never sent to clients).
   *   unavailable: the provider can't serve this at all right now (no quota,
   *   not configured, down), so callers may try another provider.
   */
  constructor(message, statusCode = 502, { detail = '', unavailable = false } = {}) {
    super(message);
    this.name = 'AIError';
    this.statusCode = statusCode;
    this.detail = detail;
    this.unavailable = unavailable;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The SDK aborts on timeout without an HTTP status; treat that like a 504.
const statusOf = (err) => err.status || (err.name === 'AbortError' || /timed? ?out|aborted/i.test(err.message) ? 504 : undefined);

/**
 * A quota that retrying cannot fix: "limit: 0" (the model isn't on this
 * key's tier at all) or an exhausted per-day quota.
 */
function isZeroQuota(err) {
  if (statusOf(err) !== 429) return false;
  const text = String(err.message || '');
  return /limit:\s*0\b/.test(text)
    || /"quotaValue"\s*:\s*"0"/.test(text)
    || (/RESOURCE_EXHAUSTED/.test(text) && /PerDay/i.test(text));
}

// SDK messages can embed kilobytes of JSON; keep logs readable.
const brief = (text) => (text.length > 300 ? `${text.slice(0, 300)}…` : text);

function toAIError(err) {
  if (err instanceof AIError) return err;
  const status = statusOf(err);
  const raw = brief(err.message || String(err));
  if (/API key not valid|API_KEY_INVALID/i.test(raw) || status === 401 || status === 403) {
    return new AIError(UNAVAILABLE_MESSAGE, 503, {
      unavailable: true,
      detail: `Gemini rejected the API key (${status || 'invalid key'}). Check GEMINI_API_KEY in backend/.env.`,
    });
  }
  if (status === 400) {
    return new AIError('We couldn\'t process this request. If you uploaded an image, try a clearer JPEG or PNG.', 422, { detail: raw });
  }
  if (status === 404) {
    return new AIError(UNAVAILABLE_MESSAGE, 503, {
      unavailable: true,
      detail: `Gemini model not available for this API key: ${raw}. Check GEMINI_MODEL / GEMINI_IMAGE_MODEL in backend/.env.`,
    });
  }
  if (isZeroQuota(err)) {
    const model = /model: ([\w.-]+)/.exec(err.message)?.[1];
    return new AIError(UNAVAILABLE_MESSAGE, 503, {
      unavailable: true,
      detail: `This Gemini API key has no quota for ${model || 'this model'} (free tier, or daily quota used up). `
        + 'Image models need billing enabled on the key\'s Google Cloud project.',
    });
  }
  if (status === 429) {
    return new AIError('The AI stylist is busy right now. Please wait a minute and try again.', 429, { detail: raw });
  }
  if (RETRYABLE.has(status)) {
    return new AIError('The AI stylist is temporarily overloaded. Please try again in a moment.', 503, { unavailable: true, detail: raw });
  }
  return new AIError('The AI stylist couldn\'t complete this request. Please try again.', 502, { detail: `Gemini request failed: ${raw}` });
}

const breakerKey = (model) => `gemini:${model}`;

class GeminiService {
  constructor({ client, isConfigured = env.GEMINI_CONFIGURED, retryDelayMs = RETRY_DELAY_MS } = {}) {
    this.isConfigured = isConfigured;
    this.retryDelayMs = retryDelayMs;
    this.models = [env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL].filter(Boolean);
    this.imageModels = [env.GEMINI_IMAGE_MODEL, env.GEMINI_IMAGE_FALLBACK_MODEL].filter(Boolean);
    this.client = client;
    if (!this.client && this.isConfigured) {
      this.client = new GoogleGenAI({
        apiKey: env.GEMINI_API_KEY,
        httpOptions: { timeout: REQUEST_TIMEOUT_MS },
      });
    }
  }

  static imagePart(buffer, mimeType) {
    return { inlineData: { data: buffer.toString('base64'), mimeType } };
  }

  imagePart(buffer, mimeType) {
    return GeminiService.imagePart(buffer, mimeType);
  }

  // Models in `models` that the circuit breaker hasn't switched off.
  availableModels(models = this.models) {
    return this.isConfigured ? models.filter((model) => availability.isAvailable(breakerKey(model))) : [];
  }

  canGenerateImages() {
    return this.availableModels(this.imageModels).length > 0;
  }

  /**
   * Calls generateContent. On a transient error (overload, rate limit,
   * timeout) it alternates primary -> fallback -> primary, within an overall
   * time budget. A model with zero quota is switched off by the circuit
   * breaker and never tried again in this request (or later ones, until the
   * cooldown ends). `hasOutput` decides whether a response actually contains
   * what was asked for. Returns the raw SDK response.
   */
  async _generate({
    contents,
    config,
    models = this.models,
    timeoutMs = REQUEST_TIMEOUT_MS,
    budgetMs = TOTAL_BUDGET_MS,
    hasOutput = (response) => Boolean(response.text),
  }) {
    if (!this.isConfigured) {
      throw new AIError('AI features aren\'t available right now.', 503, {
        unavailable: true,
        detail: 'Gemini is not configured. Add GEMINI_API_KEY to backend/.env.',
      });
    }

    const usable = this.availableModels(models);
    if (!usable.length) {
      throw new AIError(UNAVAILABLE_MESSAGE, 503, {
        unavailable: true,
        detail: `Skipped ${models.join(', ')}: marked as having no quota (circuit breaker).`,
      });
    }

    const [primary, fallback] = usable;
    const attempts = fallback ? [primary, fallback, primary] : [primary, primary];
    const startedAt = Date.now();
    let lastError;
    let tried = 0;

    for (const model of attempts) {
      if (!availability.isAvailable(breakerKey(model))) continue;
      if (tried > 0) {
        if (Date.now() - startedAt > budgetMs) break;
        await sleep(this.retryDelayMs);
      }
      tried += 1;
      try {
        const response = await this.client.models.generateContent({
          model,
          contents,
          config: { ...config, httpOptions: { timeout: timeoutMs } },
        });
        if (!hasOutput(response)) {
          const reason = response.promptFeedback?.blockReason || response.candidates?.[0]?.finishReason;
          throw new AIError('The AI couldn\'t produce a result for this. Try a different image or wording.', 422, {
            detail: `Gemini ${model} returned no content${reason ? ` (${reason})` : ''}.`,
          });
        }
        return response;
      } catch (err) {
        lastError = err;
        const status = statusOf(err);
        // A zero quota is a billing setting, not a transient limit: switch the
        // model off and move on to the fallback without coming back.
        if (isZeroQuota(err)) {
          availability.markUnavailable(breakerKey(model), 'zero quota');
          console.warn(`Gemini ${model} has no quota on this key; skipping it for ${Math.round(env.AI_QUOTA_COOLDOWN_MS / 60000)} min.`);
          continue;
        }
        if (err instanceof AIError || !RETRYABLE.has(status)) throw toAIError(err);
        console.warn(`Gemini ${model} returned ${status} (attempt ${tried}).`);
      }
    }
    throw toAIError(lastError);
  }

  /**
   * Structured output: the model is constrained to `schema` (JSON Schema) and
   * the parsed object is returned. Callers still validate semantics such as
   * wardrobe ids, since a schema can't express "must be one of the user's items".
   */
  async generateJSON({ prompt, schema, images = [], systemInstruction, temperature = 0.7 }) {
    const response = await this._generate({
      contents: [{ role: 'user', parts: [{ text: prompt }, ...images] }],
      config: {
        systemInstruction,
        temperature,
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
      },
    });

    try {
      return JSON.parse(response.text);
    } catch {
      throw new AIError('The AI stylist returned an unreadable answer. Please try again.', 502, { detail: 'Gemini returned malformed JSON.' });
    }
  }

  /**
   * Image editing / generation: `images` are reference photos (person first,
   * then garments), `prompt` says what to produce. Returns the first image.
   */
  async generateImage({ prompt, images = [] }) {
    const findImage = (response) => response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
    const response = await this._generate({
      contents: [{ role: 'user', parts: [...images, { text: prompt }] }],
      config: { responseModalities: ['IMAGE'], imageConfig: { imageSize: '1K' } },
      models: this.imageModels,
      timeoutMs: IMAGE_REQUEST_TIMEOUT_MS,
      budgetMs: IMAGE_TOTAL_BUDGET_MS,
      hasOutput: (res) => Boolean(findImage(res)),
    });
    const { data, mimeType } = findImage(response).inlineData;
    return { buffer: Buffer.from(data, 'base64'), mimeType: mimeType || 'image/png' };
  }

  async chat({ history, message, systemInstruction }) {
    const contents = [
      ...history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      { role: 'user', parts: [{ text: message }] },
    ];
    const response = await this._generate({ contents, config: { systemInstruction, temperature: 0.8 } });
    return response.text.trim();
  }
}

module.exports = new GeminiService();
module.exports.GeminiService = GeminiService;
module.exports.AIError = AIError;
module.exports.toAIError = toAIError;
module.exports.isZeroQuota = isZeroQuota;
