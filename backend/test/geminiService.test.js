const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { apiError, ZERO_QUOTA_MESSAGE, stubClient, textResponse } = require('./helpers');

const availability = require('../src/services/aiAvailability');
const { GeminiService, AIError, toAIError, isZeroQuota } = require('../src/services/geminiService');

const service = (client) => new GeminiService({ client, isConfigured: true, retryDelayMs: 0 });

beforeEach(() => availability.reset());

test('toAIError maps statuses to user-safe messages and keeps developer detail', () => {
  const cases = [
    [apiError(429, ZERO_QUOTA_MESSAGE), 503, true],
    [apiError(429, 'Resource has been exhausted (e.g. check quota).'), 429, false],
    [apiError(503, 'The model is overloaded.'), 503, true],
    [apiError(504, 'Deadline exceeded'), 503, true],
    [apiError(400, 'Invalid image'), 422, false],
    [apiError(400, 'API key not valid. Please pass a valid API key.'), 503, true],
    [apiError(403, 'Permission denied'), 503, true],
    [apiError(404, 'models/x is not found'), 503, true],
    [apiError(500, 'Internal error'), 503, true],
    [new Error('socket hang up'), 502, false],
  ];
  for (const [err, status, unavailable] of cases) {
    const mapped = toAIError(err);
    assert.ok(mapped instanceof AIError);
    assert.equal(mapped.statusCode, status, err.message);
    assert.equal(mapped.unavailable, unavailable, err.message);
    // User-facing text never leaks setup details.
    assert.doesNotMatch(mapped.message, /\.env|Google Cloud|billing|GEMINI_|API key/i, err.message);
    assert.ok(mapped.detail, `detail kept for ${err.message}`);
  }
  assert.match(toAIError(apiError(429, ZERO_QUOTA_MESSAGE)).detail, /billing/);
});

test('isZeroQuota recognises limit: 0 and per-day RESOURCE_EXHAUSTED, not ordinary rate limits', () => {
  assert.equal(isZeroQuota(apiError(429, ZERO_QUOTA_MESSAGE)), true);
  assert.equal(isZeroQuota(apiError(429, '{"details":[{"quotaValue":"0"}]}')), true);
  assert.equal(isZeroQuota(apiError(429, 'RESOURCE_EXHAUSTED quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier')), true);
  assert.equal(isZeroQuota(apiError(429, 'RESOURCE_EXHAUSTED per minute, limit: 15')), false);
  assert.equal(isZeroQuota(apiError(503, 'limit: 0')), false);
});

test('zero quota on the primary skips to the fallback once and never returns to the primary', async () => {
  const client = stubClient({
    'text-primary': [apiError(429, ZERO_QUOTA_MESSAGE)],
    'text-fallback': [apiError(503, 'overloaded'), textResponse('{"ok":true}')],
  });
  const gemini = service(client);
  // The normal order is primary, fallback, primary. After the zero quota the
  // final primary attempt is skipped, so the fallback's 503 is surfaced.
  await assert.rejects(gemini.generateJSON({ prompt: 'x', schema: {} }), (err) => err.statusCode === 503);
  assert.deepEqual(client.calls, ['text-primary', 'text-fallback']);
});

test('circuit breaker skips a zero-quota model on later calls without a request', async () => {
  const client = stubClient({
    'text-primary': [apiError(429, ZERO_QUOTA_MESSAGE)],
    'text-fallback': [textResponse('{"ok":true}')],
  });
  const gemini = service(client);
  assert.deepEqual(await gemini.generateJSON({ prompt: 'x', schema: {} }), { ok: true });
  assert.deepEqual(client.calls, ['text-primary', 'text-fallback']);

  client.calls.length = 0;
  assert.equal(await gemini.chat({ history: [], message: 'hi', systemInstruction: '' }), '{"ok":true}');
  assert.deepEqual(client.calls, ['text-fallback'], 'primary is skipped while broken');
  assert.equal(availability.isAvailable('gemini:text-primary'), false);
});

test('when every model has zero quota, later calls fail fast with 503 and make no request', async () => {
  const client = stubClient({
    'image-primary': [apiError(429, ZERO_QUOTA_MESSAGE)],
    'image-fallback': [apiError(429, ZERO_QUOTA_MESSAGE)],
  });
  const gemini = service(client);
  await assert.rejects(gemini.generateImage({ prompt: 'x' }), (err) => err.statusCode === 503 && err.unavailable);
  assert.deepEqual(client.calls, ['image-primary', 'image-fallback']);
  assert.equal(gemini.canGenerateImages(), false);

  client.calls.length = 0;
  await assert.rejects(gemini.generateImage({ prompt: 'x' }), (err) => err.statusCode === 503 && err.unavailable);
  assert.deepEqual(client.calls, []);
  // Text models are unaffected.
  assert.equal(gemini.availableModels().length, 2);
});

test('the breaker cools down after AI_QUOTA_COOLDOWN_MS', async () => {
  availability.markUnavailable('gemini:image-primary', 'zero quota', 20);
  assert.equal(availability.isAvailable('gemini:image-primary'), false);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(availability.isAvailable('gemini:image-primary'), true);
});

test('ordinary rate limits still retry the primary after the fallback', async () => {
  const client = stubClient({
    'text-primary': [apiError(429, 'per minute, limit: 15'), textResponse('{"ok":1}')],
    'text-fallback': [apiError(429, 'per minute, limit: 15')],
  });
  assert.deepEqual(await service(client).generateJSON({ prompt: 'x', schema: {} }), { ok: 1 });
  assert.deepEqual(client.calls, ['text-primary', 'text-fallback', 'text-primary']);
});

test('not configured is reported as unavailable without a request', async () => {
  const gemini = new GeminiService({ isConfigured: false });
  await assert.rejects(gemini.chat({ history: [], message: 'hi' }), (err) => err.statusCode === 503 && err.unavailable && /GEMINI_API_KEY/.test(err.detail));
  assert.equal(gemini.canGenerateImages(), false);
});
