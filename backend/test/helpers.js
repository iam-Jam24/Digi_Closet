// Test-only setup: env.js exits without MONGODB_URI, and tests must not depend
// on the developer's backend/.env (keys, provider list).
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/digi_closet_test';
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_MODEL = 'text-primary';
process.env.GEMINI_FALLBACK_MODEL = 'text-fallback';
process.env.GEMINI_IMAGE_MODEL = 'image-primary';
process.env.GEMINI_IMAGE_FALLBACK_MODEL = 'image-fallback';
process.env.IMAGE_GENERATION_PROVIDERS = 'gemini,huggingface';
process.env.HF_TOKEN = '';
process.env.AI_QUOTA_COOLDOWN_MS = '3600000';
process.env.OVERPASS_API_URL = 'https://overpass-a.test/api/interpreter,https://overpass-b.test/api/interpreter';

// An error shaped like the @google/genai SDK's ApiError.
function apiError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const ZERO_QUOTA_MESSAGE = '{"error":{"code":429,"message":"You exceeded your current quota. Quota exceeded for metric: '
  + 'generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: image-primary",'
  + '"status":"RESOURCE_EXHAUSTED"}}';

// A stub GenAI client: `script` maps model name -> list of outcomes, consumed
// in order (an Error is thrown, anything else is returned as the response).
function stubClient(script) {
  const calls = [];
  return {
    calls,
    models: {
      generateContent: async ({ model }) => {
        calls.push(model);
        const queue = script[model] || [];
        const outcome = queue.length > 1 ? queue.shift() : queue[0];
        if (outcome instanceof Error) throw outcome;
        if (!outcome) throw new Error(`no scripted outcome for ${model}`);
        return outcome;
      },
    },
  };
}

const textResponse = (text) => ({ text });

module.exports = { apiError, ZERO_QUOTA_MESSAGE, stubClient, textResponse };
