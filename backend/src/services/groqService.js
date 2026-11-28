/**
 * Groq (api.groq.com, OpenAI-compatible chat completions) as the AI provider
 * for every text and photo-reading feature. Same interface as geminiService:
 * generateJSON(), chat(), imagePart(). Groq has no image generation models, so
 * Virtual Try-On and Style Makeover images come from the other providers in
 * IMAGE_GENERATION_PROVIDERS.
 *
 * - Text-only requests use GROQ_MODEL, then GROQ_FALLBACK_MODEL.
 * - Requests with photos use GROQ_VISION_MODEL (then its fallback, if set).
 * - JSON answers use response_format json_schema (best effort). When the
 *   model's JSON doesn't match the schema, Groq returns 400
 *   json_validate_failed and the request is retried once in JSON object mode
 *   with the schema spelled out in the prompt. Callers validate semantics.
 */

const env = require('../config/env');
const availability = require('./aiAvailability');
const { AIError } = require('./geminiService');

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const RETRYABLE = new Set([413, 429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;
const TOTAL_BUDGET_MS = 90000;
const UNAVAILABLE_MESSAGE = 'This AI feature isn\'t available right now. Please try again later.';

const breakerKey = (model) => `groq:${model}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const brief = (text) => (text.length > 300 ? `${text.slice(0, 300)}…` : text);
// Reasoning models can put their thinking in the content.
const stripThinking = (text) => String(text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();

class GroqError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// A daily request/token limit: waiting a minute won't help.
const isDailyLimit = (err) => err.status === 429 && /per day|\(RPD\)|\(TPD\)/i.test(err.message);

function toAIError(err) {
  if (err instanceof AIError) return err;
  const raw = brief(err.message || String(err));
  const { status } = err;
  if (status === 401 || status === 403) {
    return new AIError(UNAVAILABLE_MESSAGE, 503, {
      unavailable: true,
      detail: `Groq rejected the API key (${status}). Check GROQ_API_KEY in backend/.env.`,
    });
  }
  if (status === 404 || err.code === 'model_decommissioned' || err.code === 'model_not_found') {
    return new AIError(UNAVAILABLE_MESSAGE, 503, {
      unavailable: true,
      detail: `Groq model not available: ${raw}. Check GROQ_MODEL / GROQ_VISION_MODEL in backend/.env.`,
    });
  }
  if (isDailyLimit(err)) {
    return new AIError(UNAVAILABLE_MESSAGE, 503, { unavailable: true, detail: `Groq daily limit reached: ${raw}` });
  }
  if (status === 400) {
    return new AIError('We couldn\'t process this request. If you uploaded an image, try a clearer JPEG or PNG.', 422, { detail: raw });
  }
  if (status === 429 || status === 413) {
    return new AIError('The AI stylist is busy right now. Please wait a minute and try again.', 429, { detail: raw });
  }
  if (RETRYABLE.has(status) || !status) {
    return new AIError('The AI stylist is temporarily overloaded. Please try again in a moment.', 503, { unavailable: true, detail: raw });
  }
  return new AIError('The AI stylist couldn\'t complete this request. Please try again.', 502, { detail: `Groq request failed: ${raw}` });
}

class GroqService {
  constructor({ fetchImpl = fetch, apiKey = env.GROQ_API_KEY, retryDelayMs = RETRY_DELAY_MS } = {}) {
    this.fetch = fetchImpl;
    this.apiKey = apiKey;
    this.isConfigured = Boolean(apiKey);
    this.retryDelayMs = retryDelayMs;
    this.models = [env.GROQ_MODEL, env.GROQ_FALLBACK_MODEL].filter(Boolean);
    this.visionModels = [env.GROQ_VISION_MODEL, env.GROQ_VISION_FALLBACK_MODEL].filter(Boolean);
  }

  static imagePart(buffer, mimeType) {
    return { type: 'image_url', image_url: { url: `data:${mimeType};base64,${buffer.toString('base64')}` } };
  }

  imagePart(buffer, mimeType) {
    return GroqService.imagePart(buffer, mimeType);
  }

  availableModels(models = this.models) {
    return this.isConfigured ? models.filter((model) => availability.isAvailable(breakerKey(model))) : [];
  }

  // Groq has no image generation models.
  canGenerateImages() {
    return false;
  }

  async request(body) {
    let res;
    try {
      res = await this.fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      throw new GroqError(err.name === 'TimeoutError' ? 504 : 0, err.message);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new GroqError(res.ok ? 502 : res.status, data.error?.message || res.statusText, data.error?.code);
    }
    return data;
  }

  /**
   * One chat completion with fallback: on a transient error (rate limit,
   * overload, timeout) it alternates primary -> fallback -> primary within a
   * time budget. A model that is gone or out of daily quota is switched off by
   * the circuit breaker. Returns the reply text.
   */
  async _complete({ messages, models = this.models, temperature, responseFormat, schema }) {
    if (!this.isConfigured) {
      throw new AIError('AI features aren\'t available right now.', 503, {
        unavailable: true,
        detail: 'Groq is not configured. Add GROQ_API_KEY to backend/.env.',
      });
    }
    const usable = this.availableModels(models);
    if (!usable.length) {
      throw new AIError(UNAVAILABLE_MESSAGE, 503, {
        unavailable: true,
        detail: `Skipped ${models.join(', ')}: switched off by the circuit breaker (daily limit or model unavailable).`,
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
        if (Date.now() - startedAt > TOTAL_BUDGET_MS) break;
        await sleep(this.retryDelayMs);
      }
      tried += 1;
      const body = { model, messages, temperature };
      // gpt-oss reasons before answering; low effort keeps replies fast and
      // within the free tier's tokens-per-minute limit.
      if (/gpt-oss/.test(model)) body.reasoning_effort = 'low';
      try {
        let data;
        try {
          data = await this.request({ ...body, ...(responseFormat && { response_format: responseFormat }) });
        } catch (err) {
          // The answer didn't fit the schema: ask again in plain JSON mode.
          if (!(schema && err.code === 'json_validate_failed')) throw err;
          data = await this.request({
            ...body,
            messages: [...messages, { role: 'system', content: `Reply with one JSON object that follows this JSON Schema exactly:\n${JSON.stringify(schema)}` }],
            response_format: { type: 'json_object' },
          });
        }
        const text = stripThinking(data.choices?.[0]?.message?.content);
        if (!text) {
          throw new AIError('The AI couldn\'t produce a result for this. Try a different image or wording.', 422, {
            detail: `Groq ${model} returned no content (${data.choices?.[0]?.finish_reason || 'no reason'}).`,
          });
        }
        return text;
      } catch (err) {
        lastError = err;
        if (err instanceof AIError) throw err;
        const mapped = toAIError(err);
        if (mapped.unavailable && (isDailyLimit(err) || err.status === 404 || /model/.test(err.code || ''))) {
          availability.markUnavailable(breakerKey(model), mapped.detail);
          console.warn(`Groq ${model} unavailable; skipping it for ${Math.round(env.AI_QUOTA_COOLDOWN_MS / 60000)} min. ${mapped.detail}`);
          continue;
        }
        if (!RETRYABLE.has(err.status) && err.status) throw mapped;
        console.warn(`Groq ${model} returned ${err.status || 'a network error'} (attempt ${tried}).`);
      }
    }
    throw toAIError(lastError);
  }

  /**
   * Structured output: `schema` (JSON Schema) shapes the answer and the parsed
   * object is returned. `images` are imagePart() values; any image routes the
   * request to the vision model.
   */
  async generateJSON({ prompt, schema, images = [], systemInstruction, temperature = 0.7 }) {
    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: images.length ? [{ type: 'text', text: prompt }, ...images] : prompt });

    const text = await this._complete({
      messages,
      models: images.length ? this.visionModels : this.models,
      temperature,
      schema,
      responseFormat: { type: 'json_schema', json_schema: { name: 'answer', strict: false, schema } },
    });
    try {
      return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    } catch {
      throw new AIError('The AI stylist returned an unreadable answer. Please try again.', 502, { detail: 'Groq returned malformed JSON.' });
    }
  }

  async generateImage() {
    throw new AIError('Image generation isn\'t available right now. Please try again later.', 503, {
      unavailable: true,
      detail: 'Groq has no image generation models.',
    });
  }

  async chat({ history, message, systemInstruction }) {
    const messages = [
      ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
      ...history.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: message },
    ];
    return this._complete({ messages, temperature: 0.8 });
  }
}

module.exports = new GroqService();
module.exports.GroqService = GroqService;
module.exports.toAIError = toAIError;
