const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
require('./helpers');

const gemini = require('../src/services/geminiService');
const { AIError } = gemini;
const { analyzeColorPalette, normalizePalette } = require('../src/services/stylistService');

const realGenerateJSON = gemini.generateJSON;
afterEach(() => { gemini.generateJSON = realGenerateJSON; });

const swatch = (name, hex = '#556B2F') => ({ name, hex, note: `${name} note` });
const face = { buffer: Buffer.from('face'), mimeType: 'image/jpeg' };
const wrist = { buffer: Buffer.from('wrist'), mimeType: 'image/png' };

// A complete, valid model answer; tests override single fields.
const modelAnswer = (overrides = {}) => ({
  isSuitable: true,
  photoQuality: 'good',
  confidence: 'high',
  skinTone: 'medium',
  undertone: 'warm',
  undertoneNote: 'Gold reads warmly against the skin.',
  veinsClearlyVisible: true,
  veinColor: 'green',
  veinNote: 'Green veins visible.',
  season: 'Autumn',
  contrast: 'medium',
  summary: 'Warm, earthy colours suit you.',
  recommended: [swatch('Olive'), swatch('Rust', '#B7410E'), swatch('Camel', '#C19A6B')],
  neutrals: [swatch('Cream', '#FFFDD0')],
  experiment: [swatch('Teal', '#008080')],
  avoid: [swatch('Icy pink', '#F4C2C2')],
  recommendedMetals: [swatch('Gold', '#D4AF37')],
  lessFlatteringMetals: [swatch('Platinum', '#E5E4E2')],
  combinations: [{ name: 'Olive + cream', hexes: ['#556B2F', '#FFFDD0'], usage: 'Olive chinos, cream tee', pieces: { tops: 'Cream tee', shoes: 'Tan loafers' } }],
  guide: [{ category: 'formal', colors: [swatch('Navy', '#1F2A44')], tip: 'Navy suits.' }, { category: 'everyday', colors: [swatch('Olive')], tip: 'Olive daily.' }],
  ...overrides,
});

function stubGemini(answer) {
  const calls = [];
  gemini.generateJSON = async (args) => { calls.push(args); return answer; };
  return calls;
}

test('without a wrist photo, vein colour is "not-provided" even if the model claims one', async () => {
  const calls = stubGemini(modelAnswer({ veinColor: 'green' }));
  const palette = await analyzeColorPalette({ face });
  assert.equal(palette.veinColor, 'not-provided');
  assert.equal(palette.veinNote, '');
  assert.equal(calls[0].images.length, 1);
  assert.match(calls[0].prompt, /No wrist photo was provided/);
});

test('with a wrist photo, a valid vein colour is kept and anything else becomes inconclusive', async () => {
  let calls = stubGemini(modelAnswer({ veinColor: 'blue-green' }));
  assert.equal((await analyzeColorPalette({ face, wrist })).veinColor, 'blue-green');
  assert.equal(calls[0].images.length, 2);

  calls = stubGemini(modelAnswer({ veinColor: 'purple-ish' }));
  assert.equal((await analyzeColorPalette({ face, wrist })).veinColor, 'inconclusive');
});

test('a vein colour is ignored unless the model confirms the veins are clearly visible', async () => {
  stubGemini(modelAnswer({ veinsClearlyVisible: false, veinColor: 'blue-green' }));
  assert.equal((await analyzeColorPalette({ face, wrist })).veinColor, 'inconclusive');
  stubGemini(modelAnswer({ veinsClearlyVisible: undefined, veinColor: 'green' }));
  assert.equal((await analyzeColorPalette({ face, wrist })).veinColor, 'inconclusive');
});

test('a poor-quality photo always gives low confidence', async () => {
  stubGemini(modelAnswer({ photoQuality: 'poor', confidence: 'high' }));
  assert.equal((await analyzeColorPalette({ face })).confidence, 'low');
});

test('the analysis returns skin tone, undertone, palette, metals, combinations and guide', async () => {
  stubGemini(modelAnswer());
  const palette = await analyzeColorPalette({ face, wrist });
  assert.equal(palette.skinTone, 'medium');
  assert.equal(palette.undertone, 'warm');
  assert.equal(palette.recommendedColors.length, 3);
  assert.equal(palette.avoidColors[0].name, 'Icy pink');
  assert.deepEqual(palette.recommendedMetals.map((m) => m.name), ['Gold']);
  assert.equal(palette.combinations[0].pieces.tops, 'Cream tee');
  assert.equal(palette.combinations[0].pieces.trousers, '');
  // Guide follows the fixed category order, not the model's.
  assert.deepEqual(palette.guide.map((g) => g.category), ['everyday', 'formal']);
});

test('an unsuitable photo is a 422 with the model\'s reason', async () => {
  stubGemini({ isSuitable: false, unsuitableReason: 'No face visible.' });
  await assert.rejects(analyzeColorPalette({ face }), (err) => err instanceof AIError && err.statusCode === 422 && /No face/.test(err.message));
});

test('an incomplete answer (no skin tone or too few colours) is rejected', async () => {
  stubGemini(modelAnswer({ skinTone: 'beige' }));
  await assert.rejects(analyzeColorPalette({ face }), (err) => err.statusCode === 502);
  stubGemini(modelAnswer({ recommended: [swatch('Olive')] }));
  await assert.rejects(analyzeColorPalette({ face }), (err) => err.statusCode === 502);
});

test('the user\'s saved palette is not sent when re-analysing', async () => {
  const calls = stubGemini(modelAnswer());
  const user = {
    stylePreferences: { preferredStyles: ['Minimal'] },
    colorPalette: { recommendedColors: [{ name: 'Old Teal', hex: '#008080' }] },
  };
  await analyzeColorPalette({ face, user });
  assert.match(calls[0].prompt, /Preferred styles: Minimal/);
  assert.doesNotMatch(calls[0].prompt, /Old Teal/);
});

test('normalizePalette drops invalid colours and unknown values instead of guessing', () => {
  const palette = normalizePalette({
    skinTone: 'golden',
    undertone: 'olive',
    veinColor: 'red',
    confidence: 'certain',
    recommendedColors: [swatch('Good', '#abcdef'), swatch('Bad', 'blue'), { name: '', hex: '#000000' }],
    combinations: [{ name: 'One colour', hexes: ['#000000'] }],
    guide: [{ category: 'party', colors: [swatch('Red', '#FF0000')] }, { category: 'festive', colors: [] }],
  });
  assert.equal(palette.skinTone, null);
  assert.equal(palette.undertone, 'olive');
  assert.equal(palette.veinColor, 'not-provided');
  assert.equal(palette.confidence, null);
  assert.deepEqual(palette.recommendedColors, [{ name: 'Good', hex: '#ABCDEF', note: 'Good note' }]);
  assert.deepEqual(palette.combinations, []);
  assert.deepEqual(palette.guide, []);
});
