/**
 * Fashion category classification for Location Finds.
 *
 * Map providers only say "clothing store" (at best "women's clothing"), so the
 * specialisation is worked out here, deterministically and without AI calls:
 *
 *   1. Provider listing data: OSM shop / clothes tags, provider place types.
 *   2. Words in the store's name, brand and description.
 *   3. Well-known Indian fashion chains.
 *
 * Each signal maps to one or more categories; a store keeps every category it
 * earns. A store with no specialisation signal falls back to All-Fashion,
 * never to a guessed niche: a plain "clothing store" is not called bridal.
 */

const CATEGORIES = [
  { id: 'bridal', label: 'Bridal & Wedding Wear' },
  { id: 'ethnic', label: 'Ethnic & Traditional Wear' },
  { id: 'festive', label: 'Festive & Occasion Wear' },
  { id: 'formal', label: 'Formal Wear' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'casual', label: 'Casual Wear' },
  { id: 'womens', label: "Women's Fashion" },
  { id: 'mens', label: "Men's Fashion" },
  { id: 'all-fashion', label: 'All-Fashion Store' },
];
// Array order doubles as priority when choosing the headline category.
const PRIORITY = CATEGORIES.map((c) => c.id);
const LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

// --- 1. Provider listing data -------------------------------------------

// OSM `shop=*` values (see services/locationFinds/overpassProvider.js).
const SHOP_TAGS = {
  bridal: ['bridal', 'festive'],
  wedding: ['bridal', 'festive'],
  sari: ['ethnic', 'womens'],
  saree: ['ethnic', 'womens'],
  department_store: ['all-fashion'],
};

// OSM `clothes=*` values (semicolon-separated on the element).
const CLOTHES_TAGS = {
  women: ['womens'],
  men: ['mens'],
  wedding: ['bridal', 'festive'],
  bridal: ['bridal', 'festive'],
  traditional: ['ethnic'],
  ethnic: ['ethnic'],
  sari: ['ethnic', 'womens'],
  saree: ['ethnic', 'womens'],
  suits: ['formal'],
  formal: ['formal'],
  business: ['formal'],
  casual: ['casual'],
  denim: ['casual'],
  streetwear: ['streetwear'],
  party: ['festive'],
  evening: ['festive'],
};

// Place types other providers use (e.g. Google Places), for when one is added.
const PLACE_TYPES = {
  womens_clothing_store: ['womens'],
  mens_clothing_store: ['mens'],
  department_store: ['all-fashion'],
};

// --- 2 & 3. Name, brand and description ---------------------------------

// Phrases are matched as whole words against normalised text (lowercase,
// apostrophes dropped, "&" spelled "and", other punctuation as spaces).
const TEXT_RULES = [
  { categories: ['bridal', 'festive'], phrases: ['bridal', 'bride', 'brides', 'wedding', 'weddings', 'shaadi', 'dulhan', 'dulha', 'trousseau', 'groom', 'grooms', 'sabyasachi'] },
  { categories: ['ethnic', 'womens'], phrases: ['saree', 'sarees', 'sari', 'saris', 'lehenga', 'lehengas', 'lehnga', 'ghagra', 'chaniya', 'choli', 'salwar', 'shalwar', 'kurti', 'kurtis', 'anarkali', 'dupatta', 'dupattas', 'biba', 'soch', 'aurelia', 'global desi', 'libas', 'nalli', 'rangriti'] },
  { categories: ['ethnic', 'mens', 'festive'], phrases: ['sherwani', 'sherwanis', 'manyavar', 'tasva'] },
  { categories: ['ethnic', 'womens', 'festive', 'bridal'], phrases: ['mohey'] },
  { categories: ['ethnic', 'womens', 'festive'], phrases: ['meena bazaar', 'anita dongre', 'kalki'] },
  { categories: ['ethnic'], phrases: ['ethnic', 'ethnics', 'traditional', 'kurta', 'kurtas', 'handloom', 'handlooms', 'khadi', 'chikan', 'chikankari', 'bandhani', 'bandhej', 'banarasi', 'kanjeevaram', 'kanchipuram', 'patola', 'paithani', 'phulkari', 'indo western', 'indowestern', 'silk', 'silks', 'fabindia', 'jaypore', 'pothys'] },
  { categories: ['festive'], phrases: ['festive', 'party wear', 'partywear', 'occasion', 'occasions', 'occasion wear', 'celebration', 'celebrations', 'reception', 'engagement', 'couture', 'gown', 'gowns'] },
  { categories: ['formal', 'mens'], phrases: ['raymond', 'louis philippe', 'peter england', 'park avenue', 'blackberrys', 'siyaram', 'siyarams', 'zodiac', 'arrow'] },
  { categories: ['formal'], phrases: ['formal', 'formals', 'formal wear', 'suit', 'suits', 'suiting', 'suitings', 'shirting', 'shirtings', 'tailored', 'bespoke', 'blazer', 'blazers', 'tuxedo', 'tuxedos', 'office wear', 'workwear', 'van heusen'] },
  { categories: ['formal', 'casual'], phrases: ['allen solly'] },
  { categories: ['streetwear'], phrases: ['streetwear', 'street wear', 'street style', 'urban', 'hype', 'hypebeast', 'sneaker', 'sneakers', 'oversized', 'skate', 'skatewear', 'bewakoof', 'souled store', 'snitch'] },
  { categories: ['streetwear', 'casual'], phrases: ['superdry'] },
  { categories: ['casual', 'mens'], phrases: ['jack and jones', 'flying machine', 'mufti', 'celio', 'spykar'] },
  { categories: ['casual'], phrases: ['casual', 'casuals', 'casual wear', 'denim', 'denims', 'jeans', 'tees', 'tshirt', 'tshirts', 't shirt', 't shirts', 'basics', 'levis', 'wrangler', 'pepe jeans', 'being human', 'uniqlo', 'zara', 'h and m'] },
  { categories: ['womens'], phrases: ['women', 'womens', 'womenswear', 'woman', 'ladies', 'lady', 'girls', 'mahila', 'vero moda', 'faballey'] },
  { categories: ['mens'], phrases: ['men', 'mens', 'menswear', 'gents', 'gentlemen', 'gentleman'] },
  // Multi-brand and department-store chains.
  { categories: ['all-fashion'], phrases: ['westside', 'pantaloons', 'lifestyle', 'shoppers stop', 'reliance trends', 'zudio', 'max fashion', 'central', 'v mart', 'vishal mega mart', 'style union', 'brand factory', 'citykart', 'city kart', 'department store'] },
];

function normalise(text) {
  return ` ${String(text || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

const containsPhrase = (haystack, phrase) => haystack.includes(` ${phrase} `);

/**
 * @param {object} store
 * @param {string} store.name
 * @param {string} [store.brand]
 * @param {string} [store.description]
 * @param {string} [store.shop]          OSM shop=* value
 * @param {string[]} [store.clothes]     OSM clothes=* values
 * @param {string[]} [store.placeTypes]  provider place types
 * @returns {{ categories: string[], primaryCategory: string, categoryBasis: 'listing'|'name'|'general' }}
 */
function classifyStore(store) {
  const fromListing = new Set();
  const fromText = new Set();

  const addAll = (set, ids) => ids?.forEach((id) => set.add(id));
  addAll(fromListing, SHOP_TAGS[store.shop]);
  (store.clothes || []).forEach((value) => addAll(fromListing, CLOTHES_TAGS[value.trim().toLowerCase()]));
  (store.placeTypes || []).forEach((type) => addAll(fromListing, PLACE_TYPES[type]));

  const text = normalise([store.name, store.brand, store.description].filter(Boolean).join(' '));
  for (const rule of TEXT_RULES) {
    if (rule.phrases.some((phrase) => containsPhrase(text, phrase))) addAll(fromText, rule.categories);
  }

  const found = new Set([...fromListing, ...fromText]);
  const specialised = [...found].filter((id) => id !== 'all-fashion');
  // A department store keeps All-Fashion even when its name hints at more.
  if (!specialised.length || found.has('all-fashion')) found.add('all-fashion');

  const categories = PRIORITY.filter((id) => found.has(id));
  const primaryCategory = categories.find((id) => id !== 'all-fashion' && id !== 'womens' && id !== 'mens')
    || categories[0];

  let categoryBasis = 'general';
  if (fromListing.size) categoryBasis = 'listing';
  else if (fromText.size) categoryBasis = 'name';

  return { categories, primaryCategory, categoryBasis };
}

module.exports = { classifyStore, CATEGORIES, LABELS, normalise };
