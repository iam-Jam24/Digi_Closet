const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('./helpers');

const availability = require('../src/services/aiAvailability');
const { AIError } = require('../src/services/geminiService');
const { generateImage, getCapabilities } = require('../src/services/imageGenerationService');
const { HuggingFaceImageProvider, hfToAIError, planEndpoint } = require('../src/services/huggingfaceImageProvider');

beforeEach(() => availability.reset());

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const request = { feature: 'makeover', prompt: 'p', images: [{ buffer: PNG, mimeType: 'image/png' }], style: { name: 'X', summary: '', clothingChanges: [], accessories: [], footwear: [] } };

// Stub providers, only ever constructed here.
function stubProvider(name, outcome, { available = true } = {}) {
  const provider = {
    name,
    calls: 0,
    isAvailable: () => available,
    generate: async () => {
      provider.calls += 1;
      if (outcome instanceof Error) throw outcome;
      return { buffer: PNG, mimeType: 'image/png', ...outcome };
    },
  };
  return provider;
}

const unavailable = () => new AIError('down', 503, { unavailable: true, detail: 'no quota' });

test('provider chain moves to the next provider only on unavailable errors', async () => {
  const first = stubProvider('first', unavailable());
  const second = stubProvider('second', { providerLabel: 'Second (free)' });
  const result = await generateImage(request, { providers: [first, second] });
  assert.equal(result.provider, 'second');
  assert.equal(result.providerLabel, 'Second (free)');
  assert.equal(first.calls, 1);
  assert.equal(second.calls, 1);
});

test('provider chain returns input errors (422) straight away', async () => {
  const first = stubProvider('first', new AIError('No person detected.', 422));
  const second = stubProvider('second', {});
  await assert.rejects(generateImage(request, { providers: [first, second] }), (err) => err.statusCode === 422);
  assert.equal(second.calls, 0);
});

test('provider chain skips providers that report themselves unavailable', async () => {
  const first = stubProvider('first', {}, { available: false });
  const second = stubProvider('second', {});
  assert.equal((await generateImage(request, { providers: [first, second] })).provider, 'second');
  assert.equal(first.calls, 0);
});

test('provider chain gives an honest 503 when every provider is down', async () => {
  const providers = [stubProvider('a', unavailable()), stubProvider('b', unavailable())];
  await assert.rejects(generateImage(request, { providers }), (err) => {
    assert.equal(err.statusCode, 503);
    assert.equal(err.unavailable, true);
    assert.doesNotMatch(err.message, /quota|billing|\.env/i);
    assert.match(err.detail, /a: no quota \| b: no quota/);
    return true;
  });
});

test('capabilities report the first available provider per feature', () => {
  const tryOnOnly = { name: 'tryon-only', isAvailable: (feature) => feature === 'try-on', generate: async () => ({}) };
  const off = { name: 'off', isAvailable: () => false, generate: async () => ({}) };
  assert.deepEqual(getCapabilities({ providers: [off, tryOnOnly] }), {
    tryOn: { available: true, provider: 'tryon-only', reason: null },
    makeover: { available: false, provider: null, reason: 'Image generation isn\'t available right now. Please check back later.' },
  });
});

test('capabilities follow the circuit breaker for the real providers', () => {
  availability.markUnavailable('gemini:image-primary');
  availability.markUnavailable('gemini:image-fallback');
  assert.equal(getCapabilities().makeover.provider, 'huggingface');
  availability.markUnavailable(`hf:${process.env.HF_EDIT_SPACE || 'black-forest-labs/FLUX.1-Kontext-Dev'}`);
  const caps = getCapabilities();
  assert.equal(caps.makeover.available, false);
  assert.equal(caps.tryOn.provider, 'huggingface', 'the try-on Space is still up');
});

test('hfToAIError maps Space failures to statuses and trips the breaker on GPU quota', () => {
  const space = 'owner/space';
  const quota = hfToAIError({ type: 'status', message: 'You have exceeded your GPU quota (60s requested vs. 0s left).' }, space);
  assert.equal(quota.statusCode, 503);
  assert.equal(quota.unavailable, true);
  assert.equal(availability.isAvailable('hf:owner/space'), false);
  assert.doesNotMatch(quota.message, /HF_TOKEN|\.env/);

  assert.equal(hfToAIError(new Error('Queue is full'), space).statusCode, 503);
  assert.equal(hfToAIError(new Error('Space is sleeping'), space).unavailable, true);
  assert.equal(hfToAIError(new Error('Request timed out after 180s'), space).statusCode, 504);
  const bad = hfToAIError(new Error('Error'), space);
  assert.equal(bad.statusCode, 422);
  assert.equal(bad.unavailable, false);
});

// Shapes as returned by view_api() for the default Spaces (trimmed).
const VTON_API = {
  named_endpoints: {
    '/tryon': {
      parameters: [
        { parameter_name: 'dict', parameter_has_default: false, component: 'Imageeditor' },
        { parameter_name: 'garm_img', parameter_has_default: false, component: 'Image' },
        { parameter_name: 'garment_des', parameter_has_default: false, component: 'Textbox' },
        { parameter_name: 'is_checked', parameter_has_default: true, component: 'Checkbox' },
        { parameter_name: 'is_checked_crop', parameter_has_default: true, component: 'Checkbox' },
        { parameter_name: 'denoise_steps', parameter_has_default: true, component: 'Number' },
      ],
      returns: [{ component: 'Image' }, { component: 'Image' }],
    },
  },
};
const EDIT_API = {
  named_endpoints: {
    '/lambda': { parameters: [{ parameter_name: 'image', parameter_has_default: false, component: 'Image' }], returns: [{ component: 'Image' }] },
    '/infer': {
      parameters: [
        { parameter_name: 'input_image', parameter_has_default: false, component: 'Image' },
        { parameter_name: 'prompt', parameter_has_default: false, component: 'Textbox' },
        { parameter_name: 'seed', parameter_has_default: true, component: 'Slider' },
      ],
      returns: [{ component: 'Image' }, { component: 'Slider' }],
    },
  },
};

test('planEndpoint picks the endpoint from view_api output', () => {
  assert.equal(planEndpoint(EDIT_API, { minImages: 1, needsText: true }).name, '/infer');
  const vton = planEndpoint(VTON_API, { minImages: 2, needsText: true });
  assert.equal(vton.name, '/tryon');
  assert.deepEqual(vton.images.map((p) => p.parameter_name), ['dict', 'garm_img']);
  assert.equal(planEndpoint(EDIT_API, { minImages: 2, needsText: true }), null);
});

function stubSpaces(behaviour) {
  const predicted = [];
  const connect = async (space) => ({
    view_api: async () => (space.includes('VTON') ? VTON_API : EDIT_API),
    predict: async (endpoint, args) => {
      predicted.push({ space, endpoint, args });
      const outcome = behaviour[space];
      if (outcome instanceof Error) throw outcome;
      return { data: [{ url: `https://example.test/${space}.png` }] };
    },
  });
  const fetchImpl = async () => ({ ok: true, arrayBuffer: async () => PNG });
  return { provider: new HuggingFaceImageProvider({ connect, fetchImpl }), predicted };
}

const shirt = { _id: '1', name: 'Blue oxford shirt', category: 'Shirts', colors: ['blue'] };
const jeans = { _id: '2', name: 'Black jeans', category: 'Jeans', colors: ['black'] };
const tryOn = (items) => ({ feature: 'try-on', images: [{ buffer: PNG, mimeType: 'image/png' }, ...items.map(() => ({ buffer: PNG, mimeType: 'image/png' }))], items });

test('HF provider uses the try-on Space for one top, building args from view_api', async () => {
  const { provider, predicted } = stubSpaces({});
  const result = await provider.generate(tryOn([shirt]));
  assert.equal(result.provider, 'huggingface:yisol/IDM-VTON');
  assert.equal(result.mimeType, 'image/png');
  const [{ endpoint, args }] = predicted;
  assert.equal(endpoint, '/tryon');
  assert.deepEqual(Object.keys(args).sort(), ['dict', 'garm_img', 'garment_des', 'is_checked_crop']);
  assert.deepEqual(args.dict.layers, []);
  assert.match(args.garment_des, /blue.*oxford shirt/i);
});

test('HF provider uses the editor for several items and falls back to it when try-on is down', async () => {
  const several = stubSpaces({});
  const result = await several.provider.generate(tryOn([shirt, jeans]));
  assert.equal(result.provider, 'huggingface:black-forest-labs/FLUX.1-Kontext-Dev');
  assert.match(several.predicted[0].args.prompt, /Blue oxford shirt[\s\S]*Black jeans/);

  const down = stubSpaces({ 'yisol/IDM-VTON': new Error('Space is sleeping') });
  assert.equal((await down.provider.generate(tryOn([shirt]))).provider, 'huggingface:black-forest-labs/FLUX.1-Kontext-Dev');
  assert.deepEqual(down.predicted.map((p) => p.space), ['yisol/IDM-VTON', 'black-forest-labs/FLUX.1-Kontext-Dev']);
});

test('HF provider does not retry another Space on an input error', async () => {
  const { provider, predicted } = stubSpaces({ 'yisol/IDM-VTON': new Error('Error') });
  await assert.rejects(provider.generate(tryOn([shirt])), (err) => err.statusCode === 422);
  assert.equal(predicted.length, 1);
});
