/**
 * Product search across real shopping sources.
 *
 * Providers are plain objects with a `search()` that returns normalised
 * products. Only SerpApi's Google Shopping engine is implemented; add another
 * provider to PROVIDERS and point PRODUCT_SEARCH_PROVIDER at it.
 *
 * With no provider configured, search() returns no products, only genuine
 * marketplace search links, and says so. It never invents listings.
 */

const env = require('../config/env');

// Listings are limited to these stores. `match` recognises Google Shopping's
// source names ("Amazon.in", "AJIO.com", "Nykaa Fashion", ...).
const STORES = [
  { name: 'Myntra', match: /myntra/i },
  { name: 'AJIO', match: /ajio/i },
  { name: 'Amazon', match: /amazon/i },
  { name: 'Flipkart', match: /flipkart/i },
  { name: 'Nykaa Fashion', match: /nykaa/i },
];
const storeOf = (source = '') => STORES.find((store) => store.match.test(source));

// SerpApi reports an empty result set as an error.
const NO_RESULTS = /hasn.t returned any results/i;

const serpApiProvider = {
  name: 'Google Shopping (SerpApi)',

  // Price bounds are applied by the caller: Google Shopping India returns
  // nothing at all when min_price / max_price are sent.
  async fetchResults(query) {
    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: query,
      gl: 'in',
      hl: 'en',
      location: 'India',
      api_key: env.PRODUCT_SEARCH_API_KEY,
    });
    // A search Google hasn't seen recently can take a while; retry once.
    let res;
    for (let attempt = 1; ; attempt += 1) {
      try {
        res = await fetch(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(30000) });
        break;
      } catch (err) {
        if (attempt < 2 && err.name === 'TimeoutError') continue;
        const error = new Error('The store search is taking too long right now. Please try again.');
        error.statusCode = 504;
        throw error;
      }
    }
    const data = await res.json().catch(() => ({}));
    if (data.error && NO_RESULTS.test(data.error)) return [];
    if (!res.ok || data.error) {
      const err = new Error(`Product search failed: ${data.error || res.statusText}`);
      err.statusCode = res.status === 401 ? 502 : 503;
      throw err;
    }
    return data.shopping_results || [];
  },

  async search({ query, limit }) {
    // Naming the stores steers Google Shopping to them (about 39 of 40
    // results, against a handful without).
    let results = await this.fetchResults(`${query} ${STORES.map((s) => s.name.split(' ')[0].toLowerCase()).join(' ')}`);
    if (!results.some((p) => storeOf(p.source))) results = await this.fetchResults(query);

    return results
      .filter((p) => p.title && p.product_link && typeof p.extracted_price === 'number' && storeOf(p.source))
      .slice(0, limit)
      .map((p) => ({
        id: p.product_id || p.product_link,
        title: p.title,
        price: Math.round(p.extracted_price),
        priceText: p.price,
        merchant: storeOf(p.source).name,
        imageUrl: p.thumbnail || null,
        link: p.product_link,
        rating: p.rating ?? null,
        reviews: p.reviews ?? null,
        description: p.snippet || (p.extensions || []).join(' · '),
      }));
  },
};

const PROVIDERS = { serpapi: serpApiProvider };

function marketplaceLinks(query) {
  const q = encodeURIComponent(query.trim());
  return [
    { platform: 'Myntra', url: `https://www.myntra.com/${encodeURIComponent(query.trim().toLowerCase().replace(/\s+/g, '-'))}` },
    { platform: 'Amazon', url: `https://www.amazon.in/s?k=${q}` },
    { platform: 'Flipkart', url: `https://www.flipkart.com/search?q=${q}` },
    { platform: 'AJIO', url: `https://www.ajio.com/search/?text=${q}` },
    { platform: 'Nykaa Fashion', url: `https://www.nykaafashion.com/catalogsearch/result/?q=${q}` },
  ];
}

class ProductSearchService {
  constructor() {
    this.provider = env.PRODUCT_SEARCH_CONFIGURED ? PROVIDERS[env.PRODUCT_SEARCH_PROVIDER] : null;
    if (env.PRODUCT_SEARCH_CONFIGURED && !this.provider) {
      console.warn(`⚠️  Unknown PRODUCT_SEARCH_PROVIDER "${env.PRODUCT_SEARCH_PROVIDER}". Product search is disabled.`);
    }
  }

  get isConfigured() {
    return Boolean(this.provider);
  }

  async search({ query, minPrice, maxPrice, limit = 12 }) {
    const base = {
      configured: this.isConfigured,
      provider: this.provider?.name || null,
      marketplaceLinks: marketplaceLinks(query),
    };
    if (!this.provider) {
      return { ...base, products: [] };
    }

    // Fetch extra so enough remain after the price filter.
    const products = await this.provider.search({ query, limit: limit * 4 });
    // Providers treat price bounds as hints, so enforce them here.
    const inRange = products
      .filter((p) => (!maxPrice || p.price <= maxPrice) && (!minPrice || p.price >= minPrice))
      .slice(0, limit);
    return { ...base, products: inRange };
  }
}

module.exports = new ProductSearchService();
