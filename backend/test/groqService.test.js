const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('./helpers');

const availability = require('../src/services/aiAvailability');
const { GroqService } = require('../src/services/groqService');

beforeEach(() => availability.reset());

const reply = (content) => ({ status: 200, body: { choices: [{ message: { content }, finish_reason: 'stop' }] } });
const failure = (status, message, code) => ({ status, body: { error: { message, code } } });

// A stub fetch: `script` maps model name -> outcomes, consumed in order.
function stubFetch(script) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    const queue = script[body.model] || [];
    const outcome = queue.length > 1 ? queue.shift() : queue[0];
    if (!outcome) throw new Error(`no scripted outcome for ${body.model}`);
    return { ok: outcome.status < 400, status: outcome.status, statusText: '', json: async () => outcome.body };
  };
  return { calls, fetchImpl };
}

const service = (fetchImpl) => new GroqService({ fetchImpl, apiKey: 'k', retryDelayMs: 0 });
const schema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] };

test('generateJSON sends a json_schema request and parses the reply', async () => {
  const { calls, fetchImpl } = stubFetch({ 'groq-text-primary': [reply('{"ok":true}')] });
  assert.deepEqual(await service(fetchImpl).generateJSON({ prompt: 'p', schema, systemInstruction: 's' }), { ok: true });
  assert.equal(calls[0].response_format.type, 'json_schema');
  assert.deepEqual(calls[0].response_format.json_schema.schema, schema);
  assert.deepEqual(calls[0].messages.map((m) => m.role), ['system', 'user']);
});

test('requests with photos go to the vision model as image_url parts', async () => {
  const { calls, fetchImpl } = stubFetch({ 'groq-vision': [reply('<think>hmm</think>{"ok":true}')] });
  const groq = service(fetchImpl);
  const image = groq.imagePart(Buffer.from('jpg'), 'image/jpeg');
  assert.deepEqual(await groq.generateJSON({ prompt: 'p', schema, images: [image] }), { ok: true });
  assert.equal(calls[0].model, 'groq-vision');
  assert.equal(calls[0].messages[0].content[1].image_url.url, `data:image/jpeg;base64,${Buffer.from('jpg').toString('base64')}`);
});

test('a schema mismatch is retried once in JSON object mode', async () => {
  const { calls, fetchImpl } = stubFetch({
    'groq-text-primary': [failure(400, 'Generated JSON does not match the expected schema', 'json_validate_failed'), reply('{"ok":false}')],
  });
  assert.deepEqual(await service(fetchImpl).generateJSON({ prompt: 'p', schema }), { ok: false });
  assert.equal(calls[1].response_format.type, 'json_object');
  assert.match(calls[1].messages.at(-1).content, /JSON Schema/);
});

test('rate limits fall back to the second model; daily limits switch the model off', async () => {
  const { calls, fetchImpl } = stubFetch({
    'groq-text-primary': [failure(429, 'Rate limit reached on tokens per day (TPD): Limit 200000')],
    'groq-text-fallback': [reply('hello')],
  });
  const groq = service(fetchImpl);
  assert.equal(await groq.chat({ history: [{ role: 'assistant', content: 'hi' }], message: 'yo' }), 'hello');
  assert.equal(availability.isAvailable('groq:groq-text-primary'), false);
  await groq.chat({ history: [], message: 'again' });
  assert.deepEqual(calls.map((c) => c.model), ['groq-text-primary', 'groq-text-fallback', 'groq-text-fallback']);
});

test('a bad key is unavailable with a developer-only detail; no key means not configured', async () => {
  const { fetchImpl } = stubFetch({ 'groq-text-primary': [failure(401, 'Invalid API Key', 'invalid_api_key')] });
  await assert.rejects(service(fetchImpl).chat({ history: [], message: 'hi' }), (err) => err.statusCode === 503 && /GROQ_API_KEY/.test(err.detail) && !/GROQ/.test(err.message));
  const unconfigured = new GroqService({ apiKey: '' });
  await assert.rejects(unconfigured.chat({ history: [], message: 'hi' }), (err) => err.unavailable && /GROQ_API_KEY/.test(err.detail));
  assert.equal(unconfigured.canGenerateImages(), false);
});
