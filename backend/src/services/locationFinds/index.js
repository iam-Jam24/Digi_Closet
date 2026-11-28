/**
 * Location Finds: physical fashion stores near a point.
 *
 * The provider (OpenStreetMap today; see osmProvider.js) returns raw nearby
 * shops. This service measures each one's distance from the user's exact
 * point, enforces the radius strictly, classifies the fashion specialisation
 * and ranks the results.
 *
 * Privacy: coordinates are never stored or logged. The provider and the
 * short-lived in-memory cache only ever see the point rounded to ~110 m.
 */

const { haversineKm, coarsen, COARSEN_MARGIN_KM } = require('./geo');
const { classifyStore, CATEGORIES } = require('./storeClassifier');
const { createOsmProvider } = require('./osmProvider');

const DEFAULT_RADIUS_KM = 5;
const MIN_RADIUS_KM = 0.5;
const MAX_RADIUS_KM = 10;
const MAX_RESULTS = 60;

const NEARBY_TTL_MS = 10 * 60 * 1000;
const DETAILS_TTL_MS = 30 * 60 * 1000;
const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000;

class TtlCache {
  constructor(ttlMs, maxEntries) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.at > this.ttlMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    this.entries.delete(key);
    this.entries.set(key, { value, at: Date.now() });
    if (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value);
  }
}

/**
 * How useful a result is: a clear specialisation and complete details rank
 * higher. Used to choose which stores to keep in dense areas and for the
 * "Relevant first" sort.
 */
function relevanceScore(store, classification) {
  const specialised = classification.categories.filter((id) => id !== 'all-fashion').length;
  return Math.min(specialised, 3) * 2
    + (classification.categoryBasis === 'listing' ? 2 : classification.categoryBasis === 'name' ? 1 : 0)
    + [store.address, store.phone, store.openingHours, store.website, store.rating].filter(Boolean).length;
}

// Card-level fields; the details endpoint adds the rest.
function toListItem(store, classification, distanceKm) {
  return {
    id: store.id,
    name: store.name,
    brand: store.brand,
    ...classification,
    distanceKm: Math.round(distanceKm * 100) / 100,
    location: store.location,
    address: store.address,
    phone: store.phone,
    website: store.website,
    openingHours: store.openingHours,
    rating: store.rating,
    ratingCount: store.ratingCount,
    openNow: store.openNow,
    imageUrl: store.imageUrl,
    relevance: relevanceScore(store, classification),
  };
}

function createLocationFindsService({ provider = createOsmProvider() } = {}) {
  const nearbyCache = new TtlCache(NEARBY_TTL_MS, 200);
  const detailsCache = new TtlCache(DETAILS_TTL_MS, 500);
  const geocodeCache = new TtlCache(GEOCODE_TTL_MS, 500);

  return {
    categories: CATEGORIES,
    isValidStoreId: (id) => provider.isValidStoreId(id),

    async findNearby({ lat, lng, radiusKm = DEFAULT_RADIUS_KM, refresh = false }) {
      const coarse = coarsen({ lat, lng });
      const key = `${coarse.lat},${coarse.lng},${radiusKm}`;
      let raw = refresh ? undefined : nearbyCache.get(key);
      if (!raw) {
        // Search slightly wider around the rounded point so no store within
        // radiusKm of the exact point is missed; the filter below trims it.
        raw = await provider.searchNearby({ ...coarse, radiusKm: radiusKm + COARSEN_MARGIN_KM });
        nearbyCache.set(key, raw);
      }

      const seen = new Set();
      const inRadius = [];
      for (const store of raw) {
        if (seen.has(store.id)) continue;
        seen.add(store.id);
        const distanceKm = haversineKm({ lat, lng }, store.location);
        if (distanceKm > radiusKm) continue;
        inRadius.push(toListItem(store, classifyStore(store), distanceKm));
      }

      // Dense markets can have hundreds of shops: keep the most useful ones.
      const stores = inRadius
        .sort((a, b) => b.relevance - a.relevance || a.distanceKm - b.distanceKm)
        .slice(0, MAX_RESULTS)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return {
        radiusKm,
        stores,
        count: stores.length,
        totalFound: inRadius.length,
        hasRatings: stores.some((s) => s.rating != null),
        source: provider.attribution,
      };
    },

    async getStoreDetails(id) {
      let store = detailsCache.get(id);
      if (store === undefined) {
        store = await provider.getStore(id);
        detailsCache.set(id, store);
      }
      if (!store) return null;
      return {
        ...store,
        ...classifyStore(store),
        shop: undefined,
        clothes: undefined,
        placeTypes: undefined,
        source: provider.attribution,
      };
    },

    async geocode(query) {
      const key = query.trim().toLowerCase();
      let place = geocodeCache.get(key);
      if (place === undefined) {
        place = await provider.geocode(query.trim());
        geocodeCache.set(key, place);
      }
      return place;
    },
  };
}

module.exports = {
  createLocationFindsService,
  locationFinds: createLocationFindsService(),
  DEFAULT_RADIUS_KM,
  MIN_RADIUS_KM,
  MAX_RADIUS_KM,
  MAX_RESULTS,
};
