/**
 * Free image generation on public Hugging Face Spaces (ZeroGPU), via
 * @gradio/client. Used when Gemini image models have no quota.
 *
 * - Try-on with exactly one top / outerwear / dress that has a photo:
 *   a virtual try-on Space (HF_TRYON_SPACE, default yisol/IDM-VTON) that
 *   takes the person photo and the garment photo.
 * - Makeover, and any other try-on: an instruction-based image editor
 *   (HF_EDIT_SPACE, default black-forest-labs/FLUX.1-Kontext-Dev) that takes
 *   the person photo and a text prompt describing the change.
 *
 * Endpoint names and parameters are not hardcoded: they are read from each
 * Space's view_api() and the call is built from what it reports. Space
 * failures become AIError with the same status semantics as Gemini's.
 */

const { Client, handle_file } = require('@gradio/client');
const env = require('../config/env');
const availability = require('./aiAvailability');
const stylistService = require('./stylistService');
const { AIError } = require('./geminiService');
const { SLOT_BY_CATEGORY } = require('../models/ClothingItem');

const TRYON_SLOTS = new Set(['top', 'layer', 'dress']);
const IMAGE_COMPONENTS = new Set(['image', 'imageeditor']);
const CLIENT_CACHE_MS = 10 * 60 * 1000;
const UNAVAILABLE_MESSAGE = 'Image generation isn\'t available right now. Please try again later.';

const breakerKey = (space) => `hf:${space}`;
const component = (param) => String(param.component || '').toLowerCase();
const isImageParam = (param) => IMAGE_COMPONENTS.has(component(param));

// Human-readable name of a Space, for "Generated with ...".
const spaceLabel = (space) => space.split('/').pop();

function hfToAIError(err, space) {
  if (err instanceof AIError) return err;
  const text = String(err?.message || err?.original_msg || (typeof err === 'string' ? err : JSON.stringify(err)) || '');
  const detail = `Hugging Face Space ${space}: ${text}`;
  if (/GPU quota|ZeroGPU quota|exceeded your .*quota|quota exceeded|daily .*limit/i.test(text)) {
    availability.markUnavailable(breakerKey(space), 'zero GPU quota');
    return new AIError(UNAVAILABLE_MESSAGE, 503, {
      unavailable: true,
      detail: `${detail} (ZeroGPU quota used up; a free HF_TOKEN in backend/.env raises it).`,
    });
  }
  if (/timed? ?out|timeout/i.test(text)) {
    return new AIError('Image generation took too long. Please try again in a few minutes.', 504, { unavailable: true, detail });
  }
  if (/queue is full|too many requests|\b429\b/i.test(text)) {
    return new AIError('The free image generator is busy. Please try again in a few minutes.', 503, { unavailable: true, detail });
  }
  if (/sleep|paused|building|starting|not running|runtime error|could not (resolve|get|load)|space metadata|config|fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|socket|\b50[234]\b|\b404\b|GPU task aborted|worker error|CUDA out of memory/i.test(text)) {
    return new AIError(UNAVAILABLE_MESSAGE, 503, { unavailable: true, detail });
  }
  return new AIError('The image generator couldn\'t process this photo. Try a clear, well-lit, full-body photo.', 422, { detail });
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timed out after ${Math.round(ms / 1000)}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Picks the endpoint that takes at least `minImages` image inputs (and a
 * text input when `needsText`) and returns an image, from view_api() output.
 */
function planEndpoint(api, { minImages, needsText }) {
  for (const [name, endpoint] of Object.entries(api.named_endpoints || {})) {
    const params = endpoint.parameters || [];
    const images = params.filter(isImageParam);
    const texts = params.filter((p) => component(p) === 'textbox');
    const outputIndex = (endpoint.returns || []).findIndex(isImageParam);
    if (images.length >= minImages && (!needsText || texts.length) && outputIndex !== -1) {
      return { name, params, images, text: texts[0] || null, outputIndex };
    }
  }
  return null;
}

class HuggingFaceImageProvider {
  constructor({ connect = (space, options) => Client.connect(space, options), fetchImpl = fetch } = {}) {
    this.name = 'huggingface';
    this.connect = connect;
    this.fetch = fetchImpl;
    this.clients = new Map(); // space -> { client, api, at }
  }

  get tryOnSpace() { return env.HF_TRYON_SPACE; }
  get editSpace() { return env.HF_EDIT_SPACE; }

  // No network: availability is configuration plus circuit-breaker state.
  isAvailable(feature) {
    const editOk = Boolean(this.editSpace) && availability.isAvailable(breakerKey(this.editSpace));
    if (feature === 'makeover') return editOk;
    return editOk || (Boolean(this.tryOnSpace) && availability.isAvailable(breakerKey(this.tryOnSpace)));
  }

  async session(space) {
    const cached = this.clients.get(space);
    if (cached && Date.now() - cached.at < CLIENT_CACHE_MS) return cached;
    const client = await withTimeout(
      this.connect(space, env.HF_TOKEN ? { token: env.HF_TOKEN, hf_token: env.HF_TOKEN } : {}),
      60000
    );
    const api = await client.view_api();
    const entry = { client, api, at: Date.now() };
    this.clients.set(space, entry);
    return entry;
  }

  /**
   * Builds named arguments from the endpoint's own parameter list. Inputs we
   * don't set keep the Space's defaults; a required input we can't fill
   * means the Space changed shape, which is reported rather than guessed.
   */
  buildArgs(plan, { imageValues, text, space }) {
    const args = {};
    plan.images.forEach((param, index) => {
      if (index >= imageValues.length) return;
      const file = handle_file(new Blob([imageValues[index].buffer], { type: imageValues[index].mimeType }));
      args[param.parameter_name] = component(param) === 'imageeditor'
        ? { background: file, layers: [], composite: null }
        : file;
    });
    if (plan.text) args[plan.text.parameter_name] = text;
    for (const param of plan.params) {
      // Wardrobe and phone photos are rarely 3:4, so let try-on Spaces crop.
      if (component(param) === 'checkbox' && /crop/i.test(param.parameter_name)) args[param.parameter_name] = true;
      if (!(param.parameter_name in args) && !param.parameter_has_default) {
        throw new AIError(UNAVAILABLE_MESSAGE, 503, {
          unavailable: true,
          detail: `Space ${space} endpoint ${plan.name} needs input "${param.parameter_name}" (${param.component}) that DigiCloset doesn't know how to fill.`,
        });
      }
    }
    return args;
  }

  async downloadOutput(value, space) {
    const url = typeof value === 'string' ? value : value?.url;
    if (!url || !/^https?:/.test(url)) {
      throw new AIError(UNAVAILABLE_MESSAGE, 502, { detail: `Space ${space} returned no image URL: ${JSON.stringify(value)?.slice(0, 200)}` });
    }
    const response = await this.fetch(url, { headers: env.HF_TOKEN ? { Authorization: `Bearer ${env.HF_TOKEN}` } : {} });
    if (!response.ok) throw new Error(`Downloading the result failed with ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = sniffMimeType(buffer);
    if (!mimeType) throw new AIError(UNAVAILABLE_MESSAGE, 502, { detail: `Space ${space} returned an unsupported image format.` });
    return { buffer, mimeType };
  }

  async run(space, { minImages, imageValues, text }) {
    if (!availability.isAvailable(breakerKey(space))) {
      throw new AIError(UNAVAILABLE_MESSAGE, 503, { unavailable: true, detail: `Space ${space} skipped: no ZeroGPU quota (circuit breaker).` });
    }
    try {
      const { client, api } = await this.session(space);
      const plan = planEndpoint(api, { minImages, needsText: true });
      if (!plan) {
        throw new AIError(UNAVAILABLE_MESSAGE, 503, {
          unavailable: true,
          detail: `Space ${space} has no endpoint taking ${minImages} image(s) and a prompt and returning an image.`,
        });
      }
      const args = this.buildArgs(plan, { imageValues, text, space });
      const result = await withTimeout(client.predict(plan.name, args), env.HF_TIMEOUT_MS);
      const image = await this.downloadOutput(result.data?.[plan.outputIndex], space);
      return { ...image, provider: `huggingface:${space}`, providerLabel: `${spaceLabel(space)} (free)` };
    } catch (err) {
      this.clients.delete(space);
      throw hfToAIError(err, space);
    }
  }

  /**
   * @param {{ feature: 'try-on'|'makeover', images: Array<{buffer, mimeType}>, items?: object[], style?: object }} request
   *   images[0] is the person photo; for try-on, images[i + 1] is items[i]'s photo.
   */
  async generate({ feature, images, items = [], style }) {
    const [person, ...garments] = images;
    if (feature === 'makeover') {
      return this.run(this.editSpace, { minImages: 1, imageValues: [person], text: stylistService.makeoverPrompt(style) });
    }

    const single = items.length === 1 && garments[0] && TRYON_SLOTS.has(SLOT_BY_CATEGORY[items[0].category]);
    if (single && this.tryOnSpace) {
      try {
        return await this.run(this.tryOnSpace, {
          minImages: 2,
          imageValues: [person, garments[0]],
          text: stylistService.garmentDescription(items[0]),
        });
      } catch (err) {
        // Only fall back to the text-guided editor when the try-on Space is down.
        if (!err.unavailable || !this.editSpace) throw err;
        console.warn(`${err.detail || err.message} Falling back to ${this.editSpace}.`);
      }
    }
    return this.run(this.editSpace, { minImages: 1, imageValues: [person], text: stylistService.tryOnTextPrompt(items) });
  }
}

function sniffMimeType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

module.exports = new HuggingFaceImageProvider();
module.exports.HuggingFaceImageProvider = HuggingFaceImageProvider;
module.exports.hfToAIError = hfToAIError;
module.exports.planEndpoint = planEndpoint;
