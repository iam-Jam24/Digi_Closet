const { test } = require('node:test');
const assert = require('node:assert/strict');
require('./helpers');

const { haversineKm, coarsen } = require('../src/services/locationFinds/geo');
const { classifyStore } = require('../src/services/locationFinds/storeClassifier');
const { createOsmProvider, normaliseElement } = require('../src/services/locationFinds/osmProvider');
const { createLocationFindsService, MAX_RESULTS } = require('../src/services/locationFinds');

const JAIPUR = { lat: 26.9124, lng: 75.7873 };

// A point `km` kilometres due north of `origin` (1° latitude ≈ 111.195 km).
const north = (origin, km) => ({ lat: origin.lat + km / 111.195, lng: origin.lng });

// --- geo ---------------------------------------------------------------

test('haversine matches known distances', () => {
  assert.equal(haversineKm(JAIPUR, JAIPUR), 0);
  // Jaipur -> Delhi is ~238 km in a straight line.
  const delhi = { lat: 28.6139, lng: 77.209 };
  assert.ok(Math.abs(haversineKm(JAIPUR, delhi) - 238) < 3);
  assert.ok(Math.abs(haversineKm(JAIPUR, north(JAIPUR, 5)) - 5) < 0.01);
});

test('coarsen rounds to 3 decimals', () => {
  assert.deepEqual(coarsen({ lat: 26.912449, lng: 75.787351 }), { lat: 26.912, lng: 75.787 });
});

// --- classifier --------------------------------------------------------

const cats = (store) => classifyStore({ name: '', ...store }).categories;

test('plain clothing store falls back to All-Fashion, never a niche', () => {
  const result = classifyStore({ name: 'Sharma Garments', shop: 'clothes' });
  assert.deepEqual(result.categories, ['all-fashion']);
  assert.equal(result.primaryCategory, 'all-fashion');
  assert.equal(result.categoryBasis, 'general');
});

test('name keywords classify ethnic, bridal, formal and streetwear stores', () => {
  assert.deepEqual(cats({ name: 'Royal Saree Palace' }), ['ethnic', 'womens']);
  assert.deepEqual(cats({ name: 'Dulhan Bridal Studio' }), ['bridal', 'festive']);
  assert.deepEqual(cats({ name: 'The Suit Room' }), ['formal']);
  assert.deepEqual(cats({ name: 'Urban Hype Streetwear' }), ['streetwear']);
  assert.deepEqual(cats({ name: 'Manyavar' }), ['ethnic', 'festive', 'mens']);
});

test("matching is whole-word: 'women' does not imply men, 'Mango' is not men", () => {
  assert.deepEqual(cats({ name: "Women's Corner" }), ['womens']);
  assert.deepEqual(cats({ name: 'Mango' }), ['all-fashion']);
  assert.deepEqual(cats({ name: 'Suitcase World' }), ['all-fashion']);
});

test('OSM listing tags are used and reported as the basis', () => {
  const result = classifyStore({ name: 'Kapoor & Sons', shop: 'clothes', clothes: ['men', 'suits'] });
  assert.deepEqual(result.categories, ['formal', 'mens']);
  assert.equal(result.primaryCategory, 'formal');
  assert.equal(result.categoryBasis, 'listing');
});

test('department stores stay All-Fashion even with other hints', () => {
  const result = classifyStore({ name: 'Shoppers Stop', shop: 'department_store', clothes: ['women', 'men'] });
  assert.ok(result.categories.includes('all-fashion'));
  assert.ok(result.categories.includes('womens'));
});

test('gender alone is the primary category only when nothing more specific exists', () => {
  assert.equal(classifyStore({ name: 'Ladies Kurti Corner' }).primaryCategory, 'ethnic');
  assert.equal(classifyStore({ name: 'Gents Collection' }).primaryCategory, 'mens');
});

// --- OSM normalisation -------------------------------------------------

test('normaliseElement keeps only mapped data and validates contact fields', () => {
  const store = normaliseElement({
    type: 'way',
    id: 42,
    center: { lat: 26.92, lon: 75.79 },
    tags: {
      shop: 'clothes',
      name: 'Rangoli Ethnic',
      'addr:street': 'MI Road',
      'addr:city': 'Jaipur',
      phone: '+91 141 222 3344; +91 98290 00000',
      website: 'rangoli.example.com',
      opening_hours: 'Mo-Sa 10:30-21:00',
      'contact:instagram': '@rangoli.jaipur',
      'payment:upi': 'yes',
    },
  });
  assert.equal(store.id, 'osm-way-42');
  assert.deepEqual(store.location, { lat: 26.92, lng: 75.79 });
  assert.equal(store.address, 'MI Road, Jaipur');
  assert.deepEqual(store.phone, { display: '+91 141 222 3344', tel: '+911412223344' });
  assert.equal(store.website, 'https://rangoli.example.com/');
  assert.equal(store.details.instagram, 'https://www.instagram.com/rangoli.jaipur');
  assert.deepEqual(store.details.payments, ['UPI']);
  assert.equal(store.rating, null);
  assert.equal(store.imageUrl, null);
});

test('normaliseElement drops unnamed shops and bad contact data', () => {
  assert.equal(normaliseElement({ type: 'node', id: 1, lat: 1, lon: 1, tags: { shop: 'clothes' } }), null);
  const store = normaliseElement({
    type: 'node', id: 2, lat: 1, lon: 1,
    tags: { shop: 'clothes', name: 'X', phone: '12', website: 'not a url', 'addr:postcode': '302001' },
  });
  assert.equal(store.phone, null);
  assert.equal(store.website, null);
  assert.equal(store.address, null, 'a lone postcode is not an address');
});

test('OSM provider sends an Overpass query around the point and maps errors', async () => {
  const requests = [];
  const provider = createOsmProvider({
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return { ok: true, status: 200, json: async () => ({ elements: [{ type: 'node', id: 7, lat: 26.91, lon: 75.78, tags: { shop: 'boutique', name: 'B' } }] }) };
    },
  });
  const stores = await provider.searchNearby({ lat: 26.912, lng: 75.787, radiusKm: 5.08 });
  assert.equal(stores.length, 1);
  const query = new URLSearchParams(requests[0].init.body).get('data');
  assert.match(query, /around:5080,26\.912,75\.787/);
  assert.match(query, /shop"~"\^\(clothes\|boutique/);
  assert.ok(requests[0].init.headers['User-Agent']);

  const busy = createOsmProvider({ fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }) });
  await assert.rejects(busy.searchNearby({ lat: 1, lng: 1, radiusKm: 5 }), { statusCode: 503 });
});

test('OSM provider fails over to the next Overpass instance only when busy', async () => {
  const urls = [];
  const provider = createOsmProvider({
    fetchImpl: async (url) => {
      urls.push(url);
      return url.includes('overpass-a')
        ? { ok: false, status: 502, json: async () => ({}) }
        : { ok: true, status: 200, json: async () => ({ elements: [] }) };
    },
  });
  assert.deepEqual(await provider.searchNearby({ lat: 1, lng: 1, radiusKm: 5 }), []);
  assert.equal(urls.length, 2);

  const rejected = [];
  const badRequest = createOsmProvider({
    fetchImpl: async (url) => { rejected.push(url); return { ok: false, status: 400, json: async () => ({}) }; },
  });
  await assert.rejects(badRequest.searchNearby({ lat: 1, lng: 1, radiusKm: 5 }));
  assert.equal(rejected.length, 1, 'a non-transient error is not retried elsewhere');
});

test('geocode prefers the Indian match', async () => {
  const provider = createOsmProvider({
    fetchImpl: async () => ({
      ok: true,
      json: async () => ([
        { lat: '40.1', lon: '-75.1', name: 'Jaipur', address: { country_code: 'us', state: 'PA' } },
        { lat: '26.91', lon: '75.78', name: 'Jaipur', address: { country_code: 'in', state: 'Rajasthan' } },
      ]),
    }),
  });
  assert.deepEqual(await provider.geocode('Jaipur'), { label: 'Jaipur, Rajasthan', lat: 26.91, lng: 75.78 });
});

// --- service -----------------------------------------------------------

function stubProvider(stores) {
  const provider = {
    calls: [],
    attribution: { label: 'test', url: 'https://example.com' },
    isValidStoreId: () => true,
    searchNearby: async (args) => { provider.calls.push(args); return stores; },
    getStore: async (id) => stores.find((s) => s.id === id) || null,
    geocode: async () => null,
  };
  return provider;
}

const rawStore = (id, point, extra = {}) => ({
  id, name: `Store ${id}`, location: point, clothes: [], placeTypes: [], ...extra,
});

test('service enforces the radius from the exact point and sorts nearest first', async () => {
  const provider = stubProvider([
    rawStore('far', north(JAIPUR, 5.3)),
    rawStore('mid', north(JAIPUR, 2), { name: 'Bridal House' }),
    rawStore('near', north(JAIPUR, 0.4)),
    rawStore('near', north(JAIPUR, 0.4)), // duplicate id
  ]);
  const service = createLocationFindsService({ provider });
  const result = await service.findNearby({ ...JAIPUR, radiusKm: 5 });

  assert.deepEqual(result.stores.map((s) => s.id), ['near', 'mid']);
  assert.ok(result.stores.every((s) => s.distanceKm <= 5));
  assert.deepEqual(result.stores[1].categories, ['bridal', 'festive']);
  assert.equal(result.hasRatings, false);

  // The provider only saw the rounded point, with a margin on the radius.
  assert.deepEqual(provider.calls[0], { lat: 26.912, lng: 75.787, radiusKm: 5.08 });
});

test('service caches by rounded point and refresh bypasses the cache', async () => {
  const provider = stubProvider([rawStore('a', JAIPUR)]);
  const service = createLocationFindsService({ provider });
  await service.findNearby({ ...JAIPUR, radiusKm: 5 });
  await service.findNearby({ lat: JAIPUR.lat - 0.0003, lng: JAIPUR.lng, radiusKm: 5 });
  assert.equal(provider.calls.length, 1);
  await service.findNearby({ ...JAIPUR, radiusKm: 5, refresh: true });
  assert.equal(provider.calls.length, 2);
});

test('service caps dense areas, keeping the most relevant stores', async () => {
  const plain = Array.from({ length: MAX_RESULTS + 10 }, (_, i) => rawStore(`p${i}`, north(JAIPUR, 0.1)));
  const specialised = rawStore('saree', north(JAIPUR, 4), { name: 'Saree Sadan', address: 'MI Road, Jaipur' });
  const service = createLocationFindsService({ provider: stubProvider([...plain, specialised]) });
  const result = await service.findNearby({ ...JAIPUR, radiusKm: 5 });
  assert.equal(result.count, MAX_RESULTS);
  assert.equal(result.totalFound, MAX_RESULTS + 11);
  assert.ok(result.stores.some((s) => s.id === 'saree'));
});
