export const lookTitle = (look) =>
  look.style?.name
  || [...(look.clothingItems || []), ...(look.garments || [])].map((item) => item.name).join(' + ')
  || 'My look';

// Saves an image to the user's device. Fetching it first makes the
// `download` attribute work for cross-origin URLs (e.g. Firebase Storage).
export async function downloadImage(url, filename) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Download failed.');
  const blob = await response.blob();
  const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1] || 'png';
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${filename}.${ext}`;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

// Product photos shown for Style Makeover suggestions. The AI tags each item
// with a type; older or hand-entered items fall back to keyword matching.
const ITEM_IMAGES = {
  watch: 'watch-hand', sunglasses: 'sunglasses', glasses: 'sunglasses', belt: 'flatlay-boots-belt',
  bag: 'acc-bag', necklace: 'acc-necklace', bracelet: 'acc-chains', ring: 'acc-ring', earrings: 'jewellery-flatlay',
  hat: 'acc-hat', cap: 'acc-cap', scarf: 'accessories-flatlay',
  sneakers: 'acc-sneakers', boots: 'ankle-boots', loafers: 'monk-shoes', 'formal-shoes': 'monk-shoes',
};
const ITEM_KEYWORDS = [
  [/watch/i, 'watch'], [/sunglass|shades/i, 'sunglasses'], [/glasses|spectacle|frames?\b/i, 'glasses'], [/belt/i, 'belt'],
  [/bag|tote|pouch|clutch|crossbody|satchel|backpack/i, 'bag'], [/necklace|chain|pendant/i, 'necklace'],
  [/bracelet|bangle|cuff/i, 'bracelet'], [/earring|hoop|stud/i, 'earrings'], [/\bring/i, 'ring'],
  [/\bcap\b|beanie/i, 'cap'], [/hat|fedora|beret/i, 'hat'], [/scarf/i, 'scarf'],
  [/sneaker|trainer/i, 'sneakers'], [/boot/i, 'boots'], [/loafer/i, 'loafers'], [/oxford|derby|brogue|monk|dress shoe/i, 'formal-shoes'],
];

export function itemImage(type, name = '', fallback = 'accessories-flatlay') {
  const resolved = ITEM_IMAGES[type] ? type : ITEM_KEYWORDS.find(([pattern]) => pattern.test(name))?.[1];
  return `/images/editorial/${ITEM_IMAGES[resolved] || fallback}.jpg`;
}
