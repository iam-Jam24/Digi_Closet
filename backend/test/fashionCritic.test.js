const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
require('./helpers');

const gemini = require('../src/services/geminiService');
const { AIError } = gemini;
const { critiqueOutfit, toRegion } = require('../src/services/stylistService');

const realGenerateJSON = gemini.generateJSON;
afterEach(() => { gemini.generateJSON = realGenerateJSON; });

const image = { buffer: Buffer.from('photo'), mimeType: 'image/jpeg' };

const observation = (overrides = {}) => ({
  area: 'Shoulders', aspect: 'fit', status: 'good', title: 'Good shoulder fit', detail: 'Seams sit on the shoulder.', ...overrides,
});
const answer = (overrides = {}) => ({
  isOutfit: true,
  score: 7.84,
  category: 'Smart Casual',
  summary: 'Clean and earthy.',
  ratings: { fit: 7, colour: 8.26, coordination: 6 },
  observations: [
    observation({ box: [100, 300, 250, 700] }),
    observation({ area: 'Trouser length', status: 'improve', title: 'Slightly long', fix: 'Hem to a slight break', options: ['Cropped chinos', 'Slim straight jeans', 'Tailored trousers', 'Too many'], box: [800, 400, 950, 600] }),
  ],
  checks: [
    { aspect: 'footwear', verdict: 'fix', note: 'Bulky trainers fight the tailoring.' },
    { aspect: 'skin-tone', verdict: 'great', note: 'Warm camel flatters the skin.' },
    { aspect: 'mood', verdict: 'great', note: 'Unknown aspect.' },
    { aspect: 'pose', verdict: 'maybe', note: 'Bad verdict.' },
  ],
  finalTip: 'Try a cleaner trouser break.',
  ...overrides,
});

function stub(result) {
  const calls = [];
  gemini.generateJSON = async (args) => { calls.push(args); return result; };
  return calls;
}

test('toRegion converts box_2d to a normalised region and rejects bad boxes', () => {
  assert.deepEqual(toRegion([800, 400, 950, 600]), { x: 0.4, y: 0.8, width: 0.2, height: 0.15 });
  assert.deepEqual(toRegion([-50, 0, 2000, 1000]), { x: 0, y: 0, width: 1, height: 1 });
  assert.equal(toRegion([500, 500, 510, 510]), null);
  assert.equal(toRegion([500, 500, 400, 600]), null);
  assert.equal(toRegion([1, 2, 3]), null);
  assert.equal(toRegion(undefined), null);
});

test('a photo critique returns score, ratings and observations with regions', async () => {
  const calls = stub(answer());
  const result = await critiqueOutfit({ image });
  assert.equal(result.score, 7.8);
  assert.equal(result.category, 'Smart Casual');
  assert.deepEqual(result.ratings, { fit: 7, colour: 8.3, coordination: 6 });
  assert.equal(result.observations.length, 2);
  assert.deepEqual(result.observations[1], {
    id: 2, area: 'Trouser length', aspect: 'fit', status: 'improve', title: 'Slightly long',
    detail: 'Seams sit on the shoulder.', fix: 'Hem to a slight break',
    options: ['Cropped chinos', 'Slim straight jeans', 'Tailored trousers'], region: { x: 0.4, y: 0.8, width: 0.2, height: 0.15 },
  });
  assert.equal(result.observations[0].fix, null);
  assert.deepEqual(result.observations[0].options, []);
  // Checklist order, invalid aspects and verdicts dropped.
  assert.deepEqual(result.checks, [
    { aspect: 'skin-tone', verdict: 'great', note: 'Warm camel flatters the skin.' },
    { aspect: 'footwear', verdict: 'fix', note: 'Bulky trainers fight the tailoring.' },
  ]);
  assert.equal(calls[0].images.length, 1);
  assert.ok(calls[0].schema.properties.observations.items.properties.box);
});

test('a wardrobe critique has no image, no box in the schema and no regions', async () => {
  const calls = stub(answer());
  const result = await critiqueOutfit({ selectedItems: [{ _id: 'a', name: 'Tee', category: 'Tops' }] });
  assert.equal(calls[0].images.length, 0);
  assert.equal(calls[0].schema.properties.observations.items.properties.box, undefined);
  assert.ok(result.observations.every((o) => o.region === null));
});

test('invalid observations are dropped and unknown values fall back', async () => {
  stub(answer({
    category: 'Space Age',
    ratings: { fit: 'n/a' },
    observations: [observation({ status: 'meh' }), observation({ title: '' }), observation({ aspect: 'vibes', box: [0, 0, 5, 5] })],
  }));
  const result = await critiqueOutfit({ image });
  assert.equal(result.category, null);
  assert.deepEqual(result.ratings, { fit: null, colour: null, coordination: null });
  assert.equal(result.observations.length, 1);
  assert.equal(result.observations[0].aspect, 'coordination');
  assert.equal(result.observations[0].region, null);
});

test('no usable observations is an error; a non-outfit photo is a 422', async () => {
  stub(answer({ observations: [] }));
  await assert.rejects(critiqueOutfit({ image }), (err) => err instanceof AIError && err.statusCode === 502);
  stub({ isOutfit: false, reason: 'This is a landscape.' });
  await assert.rejects(critiqueOutfit({ image }), (err) => err.statusCode === 422 && /landscape/.test(err.message));
});
