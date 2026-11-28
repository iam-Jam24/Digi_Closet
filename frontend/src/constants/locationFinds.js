// Fashion categories for Location Finds. Ids match the backend classifier
// (backend/src/services/locationFinds/storeClassifier.js); the API also sends
// the full labels. `short` is the filter-chip label, `color` the map marker.
export const STORE_CATEGORIES = [
  { id: 'ethnic', short: 'Ethnic Wear', color: '#8C7340' },
  { id: 'festive', short: 'Festive Wear', color: '#8A5A6E' },
  { id: 'formal', short: 'Formal Wear', color: '#1C1B18' },
  { id: 'casual', short: 'Casual Wear', color: '#5E6B4E' },
  { id: 'streetwear', short: 'Streetwear', color: '#55606B' },
  { id: 'womens', short: "Women's Fashion", color: '#A0705E' },
  { id: 'mens', short: "Men's Fashion", color: '#4A5868' },
  { id: 'bridal', short: 'Bridal Wear', color: '#8E4A3D' },
  { id: 'all-fashion', short: 'All-Fashion', color: '#6D6855' },
];

export const CATEGORY_BY_ID = Object.fromEntries(STORE_CATEGORIES.map((c) => [c.id, c]));

export const SEARCH_RADIUS_KM = 5;

export const CATEGORY_BASIS_NOTE = {
  listing: "Category from the store's map listing.",
  name: "Category inferred from the store's name.",
  general: "This store's speciality isn't listed, so it's shown as an all-fashion store.",
};
