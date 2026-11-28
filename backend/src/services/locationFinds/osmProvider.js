/**
 * OpenStreetMap places provider for Location Finds.
 *
 *   Stores:     Overpass API (OSM shop=clothes / boutique / bridal / ...)
 *   Geocoding:  Nominatim (city, locality or PIN code typed by the user)
 *
 * Both are free and need no API key. Their usage policies ask for an
 * identifying User-Agent (OSM_USER_AGENT) and modest request rates, which the
 * service's caching and the route's rate limit keep to.
 *
 * Everything returned comes from OSM tags as mapped. Missing fields stay null;
 * nothing is filled in or guessed.
 */

const env = require('../../config/env');

// OSM shop values that sell clothing. Tailors, fabric and shoe shops are left
// out: they don't help someone who needs an outfit today.
const FASHION_SHOPS = ['clothes', 'boutique', 'fashion', 'department_store', 'bridal', 'wedding', 'sari', 'saree'];

const ID_PATTERN = /^osm-(node|way|relation)-(\d{1,15})$/;
const TIMEOUT_MS = 25000;

function providerError(message, statusCode = 503) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const firstValue = (value) => (value ? String(value).split(';')[0].trim() : '');

function parsePhone(tags) {
  const raw = firstValue(tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile);
  if (!raw) return null;
  const tel = raw.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  const digits = tel.replace(/\D/g, '').length;
  return digits >= 6 && digits <= 15 ? { display: raw.slice(0, 40), tel } : null;
}

function parseUrl(raw) {
  const value = firstValue(raw);
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

function parseInstagram(raw) {
  const value = firstValue(raw);
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      return /(^|\.)instagram\.com$/i.test(new URL(value).hostname) ? value : null;
    } catch {
      return null;
    }
  }
  const handle = value.replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://www.instagram.com/${handle}` : null;
}

function parseEmail(raw) {
  const value = firstValue(raw);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

function parseAddress(tags) {
  if (tags['addr:full']) return tags['addr:full'].slice(0, 200);
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const parts = [
    tags['addr:unit'], street, tags['addr:place'],
    tags['addr:neighbourhood'] || tags['addr:suburb'] || tags['addr:quarter'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    tags['addr:postcode'],
  ].filter(Boolean);
  // A lone postcode or city isn't an address worth showing.
  return parts.length >= 2 ? [...new Set(parts)].join(', ').slice(0, 200) : null;
}

const PAYMENT_LABELS = {
  cash: 'Cash', upi: 'UPI', cards: 'Cards', credit_cards: 'Credit cards', debit_cards: 'Debit cards',
  contactless: 'Contactless', visa: 'Visa', mastercard: 'Mastercard', rupay: 'RuPay',
};

function parsePayments(tags) {
  return Object.entries(PAYMENT_LABELS)
    .filter(([key]) => tags[`payment:${key}`] === 'yes')
    .map(([, label]) => label);
}

/** OSM element -> provider-neutral store (no distance or categories yet). */
function normaliseElement(el) {
  const tags = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const name = (tags.name || tags['name:en'] || tags.brand || '').trim();
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: `osm-${el.type}-${el.id}`,
    name: name.slice(0, 120),
    location: { lat, lng },
    shop: tags.shop,
    clothes: tags.clothes ? tags.clothes.split(';') : [],
    placeTypes: [],
    brand: tags.brand || null,
    description: tags.description ? tags.description.slice(0, 500) : null,
    address: parseAddress(tags),
    phone: parsePhone(tags),
    website: parseUrl(tags.website || tags['contact:website'] || tags.url),
    // OSM opening_hours is a machine-readable rule ("Mo-Sa 10:00-21:00"),
    // shown as mapped. It isn't turned into an "open now" claim.
    openingHours: tags.opening_hours ? tags.opening_hours.slice(0, 200) : null,
    rating: null,
    ratingCount: null,
    openNow: null,
    imageUrl: null,
    details: {
      email: parseEmail(tags.email || tags['contact:email']),
      instagram: parseInstagram(tags['contact:instagram'] || tags.instagram),
      payments: parsePayments(tags),
      wheelchair: ['yes', 'limited', 'no'].includes(tags.wheelchair) ? tags.wheelchair : null,
      secondHand: ['yes', 'only'].includes(tags.second_hand) ? tags.second_hand : null,
      sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    },
  };
}

function createOsmProvider({ fetchImpl = (...args) => globalThis.fetch(...args) } = {}) {
  const headers = { 'User-Agent': env.OSM_USER_AGENT, Accept: 'application/json' };

  async function overpassOnce(endpoint, query) {
    let res;
    try {
      res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }).toString(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw Object.assign(providerError('The store directory took too long to respond. Please try again.', 504), { transient: true });
    }
    // Public Overpass servers answer 429/502/503/504 when their queue is full.
    if ([429, 502, 503, 504].includes(res.status)) {
      throw Object.assign(providerError('The store directory is busy right now. Please try again in a minute.'), { transient: true });
    }
    if (!res.ok) throw providerError('Nearby stores are unavailable right now. Please try again later.');
    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.elements)) {
      throw providerError('Nearby stores are unavailable right now. Please try again later.');
    }
    return data.elements;
  }

  // Try each configured Overpass instance in turn while they report being busy.
  async function overpass(query) {
    let lastError;
    for (const endpoint of env.OVERPASS_API_URLS) {
      try {
        return await overpassOnce(endpoint, query);
      } catch (err) {
        lastError = err;
        if (!err.transient) break;
      }
    }
    delete lastError.transient;
    throw lastError;
  }

  return {
    name: 'openstreetmap',
    attribution: {
      label: '© OpenStreetMap contributors',
      url: 'https://www.openstreetmap.org/copyright',
    },
    supportsRatings: false,

    async searchNearby({ lat, lng, radiusKm }) {
      const radiusM = Math.round(radiusKm * 1000);
      const shops = FASHION_SHOPS.join('|');
      const query = `[out:json][timeout:25];nwr["shop"~"^(${shops})$"](around:${radiusM},${lat},${lng});out center tags;`;
      const elements = await overpass(query);
      return elements.map(normaliseElement).filter(Boolean);
    },

    async getStore(id) {
      const match = ID_PATTERN.exec(id);
      if (!match) return null;
      const elements = await overpass(`[out:json][timeout:25];${match[1]}(${match[2]});out center tags;`);
      const store = elements.map(normaliseElement).find(Boolean);
      return store && FASHION_SHOPS.includes(elements[0].tags?.shop) ? store : null;
    },

    isValidStoreId: (id) => ID_PATTERN.test(id),

    /** City, locality, landmark or PIN code -> { label, lat, lng }, or null. */
    async geocode(query) {
      const params = new URLSearchParams({
        q: query, format: 'jsonv2', limit: '5', addressdetails: '1', 'accept-language': 'en',
      });
      let res;
      try {
        res = await fetchImpl(`${env.NOMINATIM_API_URL}/search?${params}`, { headers, signal: AbortSignal.timeout(15000) });
      } catch {
        throw providerError('Location search took too long. Please try again.', 504);
      }
      if (!res.ok) throw providerError('Location search is unavailable right now. Please try again later.');
      const results = await res.json().catch(() => []);
      if (!Array.isArray(results) || !results.length) return null;

      // DigiCloset is India-first: a bare PIN code or city name prefers the Indian match.
      const chosen = results.find((r) => r.address?.country_code === 'in') || results[0];
      const lat = Number(chosen.lat);
      const lng = Number(chosen.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const a = chosen.address || {};
      const label = [
        chosen.name || a.suburb || a.neighbourhood,
        a.city || a.town || a.village || a.state_district,
        a.state,
      ].filter(Boolean).filter((v, i, all) => all.indexOf(v) === i).join(', ');
      return { label: label || chosen.display_name?.split(',').slice(0, 3).join(',') || query, lat, lng };
    },
  };
}

module.exports = { createOsmProvider, normaliseElement, FASHION_SHOPS };
