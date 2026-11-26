/**
 * Fashion features built on top of geminiService: prompts, response schemas,
 * and the validation that keeps model output tied to real wardrobe data.
 */

const gemini = require('./geminiService');
const { AIError, GeminiService } = gemini;
const { CATEGORIES, SEASONS, SLOT_BY_CATEGORY } = require('../models/ClothingItem');
const { SKIN_TONES, UNDERTONES, VEIN_COLORS, COLOR_GUIDE_CATEGORIES } = require('../models/User');

const HEX = /^#[0-9A-Fa-f]{6}$/;

const STYLIST_RULES = `You are DigiCloset's personal stylist.
Talk only about clothing, colour, fabric, fit and styling.
Never comment on or guess a person's body shape, weight, attractiveness, age, ethnicity, gender or identity.
Be specific, practical and kind.`;

const stringArray = (description) => ({ type: 'array', items: { type: 'string' }, description });

function describeItem(item) {
  return {
    id: String(item._id),
    name: item.name,
    category: item.category,
    type: item.type || undefined,
    colors: item.colors,
    pattern: item.pattern || undefined,
    style: item.style || undefined,
    season: item.season?.length ? item.season : undefined,
    occasions: item.occasions?.length ? item.occasions : undefined,
  };
}

// Respects the "AI Style Personalization" privacy toggle in Settings.
// includePalette: false when re-analysing colours, so the old palette
// doesn't anchor the new one.
function describePreferences(user, { includePalette = true } = {}) {
  if (user?.privacySettings?.allowAIPersonalization === false) return '';
  const prefs = user?.stylePreferences || {};
  const lines = [];
  if (prefs.preferredStyles?.length) lines.push(`Preferred styles: ${prefs.preferredStyles.join(', ')}`);
  if (prefs.favoriteColors?.length) lines.push(`Favourite colours: ${prefs.favoriteColors.join(', ')}`);
  if (prefs.dislikedColors?.length) lines.push(`Avoid colours: ${prefs.dislikedColors.join(', ')}`);
  if (prefs.aesthetics?.length) lines.push(`Aesthetics: ${prefs.aesthetics.join(', ')}`);
  const palette = user?.colorPalette;
  if (includePalette && palette?.recommendedColors?.length) {
    lines.push(`Personal colour palette: ${palette.recommendedColors.map((c) => c.name).join(', ')}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Outfit validation
// ---------------------------------------------------------------------------

/**
 * Checks that a list of item ids forms a wearable outfit: all owned, one top
 * and one bottom or a dress, at most one of each footwear/layer.
 */
function buildOutfit(itemIds, itemsById) {
  const items = [...new Set(itemIds.map(String))].map((id) => itemsById.get(id)).filter(Boolean);
  const bySlot = { top: [], bottom: [], dress: [], layer: [], footwear: [], accessory: [] };
  items.forEach((item) => bySlot[SLOT_BY_CATEGORY[item.category]].push(item));

  const hasBase = bySlot.dress.length === 1
    ? bySlot.top.length === 0 && bySlot.bottom.length === 0
    : bySlot.top.length === 1 && bySlot.bottom.length === 1;
  if (!hasBase || bySlot.footwear.length > 1 || bySlot.layer.length > 1) return null;

  return {
    itemIds: items.map((i) => String(i._id)),
    topwearId: String((bySlot.dress[0] || bySlot.top[0])._id),
    bottomwearId: bySlot.bottom[0] ? String(bySlot.bottom[0]._id) : null,
    layerId: bySlot.layer[0] ? String(bySlot.layer[0]._id) : null,
    footwearId: bySlot.footwear[0] ? String(bySlot.footwear[0]._id) : null,
    accessoryIds: bySlot.accessory.map((i) => String(i._id)),
    missingItems: bySlot.footwear.length ? [] : ['Footwear'],
  };
}

function assertCanBuildOutfit(wardrobeItems) {
  const slots = new Set(wardrobeItems.map((i) => SLOT_BY_CATEGORY[i.category]));
  if (slots.has('dress') || (slots.has('top') && slots.has('bottom'))) return;
  const missing = [];
  if (!slots.has('top')) missing.push('a top');
  if (!slots.has('bottom')) missing.push('a bottom');
  throw new AIError(`Add ${missing.join(' and ')} (or a dress) to your wardrobe so a complete outfit can be built.`, 400);
}

const comboKey = (ids) => [...ids].map(String).sort().join('|');

// ---------------------------------------------------------------------------
// 1. Clothing image analysis
// ---------------------------------------------------------------------------

async function analyzeClothingImage({ buffer, mimeType }) {
  const result = await gemini.generateJSON({
    systemInstruction: STYLIST_RULES,
    temperature: 0.2,
    images: [GeminiService.imagePart(buffer, mimeType)],
    prompt: `Identify the single main clothing item or accessory in this photo so it can be catalogued in a digital wardrobe.
If the photo does not clearly show a garment, shoe or fashion accessory, set isClothing to false and explain why in reason.
Category rules: any denim trousers are "Jeans"; other full-length trousers, chinos, cargos and joggers are "Trousers"; t-shirts and polos are "T-Shirts"; button-up shirts are "Shirts"; jackets, blazers, hoodies and coats are "Outerwear"; bags, belts, watches, jewellery, caps and scarves are "Accessories".
Use plain everyday colour names (e.g. "Navy", "Off-white", "Olive"). Leave secondaryColor empty for single-colour items.`,
    schema: {
      type: 'object',
      properties: {
        isClothing: { type: 'boolean' },
        reason: { type: 'string' },
        name: { type: 'string', description: 'Short catalogue name, e.g. "Navy Oxford Shirt"' },
        category: { type: 'string', enum: CATEGORIES },
        type: { type: 'string', description: 'Specific garment type, e.g. "Oxford shirt", "Chelsea boots"' },
        primaryColor: { type: 'string' },
        secondaryColor: { type: 'string' },
        pattern: { type: 'string', description: 'e.g. Solid, Striped, Checked, Floral, Graphic' },
        style: { type: 'string', description: 'e.g. Casual, Smart Casual, Formal, Streetwear, Sporty, Ethnic' },
        occasions: stringArray('2-4 suitable occasions, e.g. College, Office, Party, Travel'),
        seasons: { type: 'array', items: { type: 'string', enum: SEASONS } },
        confidence: { type: 'number', description: '0 to 1' },
      },
      required: ['isClothing', 'reason'],
    },
  });

  if (!result.isClothing) {
    throw new AIError(result.reason || 'No clothing item was detected in this image.', 422);
  }

  return {
    name: result.name || '',
    category: CATEGORIES.includes(result.category) ? result.category : '',
    type: result.type || '',
    colors: [result.primaryColor, result.secondaryColor].filter((c) => c && c.trim()),
    pattern: result.pattern || '',
    style: result.style || '',
    occasions: result.occasions || [],
    season: (result.seasons || []).filter((s) => SEASONS.includes(s)),
    confidence: typeof result.confidence === 'number' ? Math.max(0, Math.min(1, result.confidence)) : null,
  };
}

// ---------------------------------------------------------------------------
// 2 & 4. Outfit generation (generator and smart recommendations share this)
// ---------------------------------------------------------------------------

async function generateOutfits({
  wardrobeItems, user, occasion, style, season, colors, weather, surprise = false,
  recentOutfits = [], excludeCombos = [], count = 3,
}) {
  assertCanBuildOutfit(wardrobeItems);

  const itemsById = new Map(wardrobeItems.map((i) => [String(i._id), i]));
  const ids = [...itemsById.keys()];
  const excluded = new Set(excludeCombos.map(comboKey));

  const brief = surprise
    ? '- Surprise the user: pick an interesting, wearable combination they might not have thought of.'
    : [
      occasion && `- Occasion: ${occasion}`,
      style && `- Preferred style: ${style}`,
      season && `- Season: ${season}`,
      colors?.length && `- Colours the user wants to wear: ${colors.join(', ')}`,
    ].filter(Boolean).join('\n');

  const history = recentOutfits.length
    ? `Outfits the user saved or favourited before (signals taste, avoid repeating exactly):\n${recentOutfits
      .map((o) => `- ${o.title}: ${o.itemNames.join(' + ')}${o.favorite ? ' (favourite)' : ''}`).join('\n')}`
    : '';

  const result = await gemini.generateJSON({
    systemInstruction: STYLIST_RULES,
    temperature: surprise ? 1.1 : 0.8,
    prompt: `Create ${count} distinct outfits using ONLY items from the wardrobe below (refer to them by id).
Each outfit needs either one top + one bottom, or one dress. Add footwear whenever the wardrobe has any.
Optionally add one outerwear layer and accessories. Do not reuse the exact same combination twice.

${brief || '- Everyday wear'}
${weather ? `- Current weather: ${weather}. Dress for it (layers when cold, breathable fabrics when hot, avoid suede in rain).` : ''}
${describePreferences(user)}
${history}
${excluded.size ? `The user has already seen these combinations, so suggest different ones:\n${excludeCombos.map((c) => `- ${c.join(', ')}`).join('\n')}` : ''}

Wardrobe:
${JSON.stringify(wardrobeItems.map(describeItem))}`,
    schema: {
      type: 'object',
      properties: {
        outfits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Short evocative outfit name' },
              styleCategory: { type: 'string', description: 'e.g. Smart Casual, Streetwear, Minimal' },
              occasion: { type: 'string' },
              itemIds: { type: 'array', items: { type: 'string', enum: ids } },
              explanation: { type: 'string', description: '1-2 sentences on why the pieces work together' },
              styleTips: stringArray('1-3 practical styling tips'),
            },
            required: ['title', 'styleCategory', 'occasion', 'itemIds', 'explanation', 'styleTips'],
          },
        },
      },
      required: ['outfits'],
    },
  });

  const seen = new Set(excluded);
  const outfits = [];
  for (const raw of result.outfits || []) {
    const outfit = buildOutfit(raw.itemIds || [], itemsById);
    if (!outfit) continue;
    const key = comboKey(outfit.itemIds);
    if (seen.has(key)) continue;
    seen.add(key);
    outfits.push({
      ...outfit,
      title: raw.title,
      styleCategory: raw.styleCategory,
      occasion: raw.occasion || occasion || null,
      explanation: raw.explanation,
      styleTips: (raw.styleTips || []).slice(0, 3),
    });
  }

  if (!outfits.length) {
    throw new AIError('The AI stylist could not build a valid, new outfit from your wardrobe. Try again or add more items.', 502);
  }
  return outfits;
}

// ---------------------------------------------------------------------------
// 3. Fashion critic
// ---------------------------------------------------------------------------

const CRITIC_ASPECTS = ['fit', 'colour', 'coordination', 'accessories', 'footwear', 'skin-tone', 'grooming', 'pose', 'setting'];
// The head-to-toe checklist, in display order.
const CRITIC_CHECKS = ['skin-tone', 'colour', 'fit', 'footwear', 'accessories', 'grooming', 'pose', 'setting'];
const CHECK_VERDICTS = ['great', 'good', 'fix'];
const MIN_REGION = 0.03;

/**
 * Gemini's box_2d, [ymin, xmin, ymax, xmax] on a 0-1000 grid, to a region
 * normalised to the image: { x, y, width, height } in 0-1. Anything malformed
 * or too small to crop meaningfully becomes null rather than a guess.
 */
function toRegion(box) {
  if (!Array.isArray(box) || box.length !== 4 || !box.every(Number.isFinite)) return null;
  const [ymin, xmin, ymax, xmax] = box.map((v) => Math.max(0, Math.min(1000, v)) / 1000);
  if (xmax - xmin < MIN_REGION || ymax - ymin < MIN_REGION) return null;
  const round = (v) => Math.round(v * 1000) / 1000;
  return { x: round(xmin), y: round(ymin), width: round(xmax - xmin), height: round(ymax - ymin) };
}

const rating = (value) => (Number.isFinite(value) ? Math.round(Math.max(1, Math.min(10, value)) * 10) / 10 : null);

/**
 * A visual critique: an overall score, three sub-ratings and a few short
 * observations, each tied to the garment area it is about. With a photo,
 * observations carry the box of that area so the client can crop it.
 */
async function critiqueOutfit({ image, selectedItems = [], wardrobeItems = [], occasion }) {
  const itemsById = new Map(wardrobeItems.map((i) => [String(i._id), i]));
  const canSuggest = wardrobeItems.length > 0;

  const subject = image
    ? 'the outfit in the attached photo'
    : `this outfit made of the user's wardrobe pieces: ${JSON.stringify(selectedItems.map(describeItem))}`;

  const result = await gemini.generateJSON({
    systemInstruction: `${STYLIST_RULES}
You may comment on visible skin undertone only to say which clothing colours suit it, on hairstyle and grooming as part of the look, and on pose and presence only as how the photo carries the outfit.
Write like a fashion magazine caption: very short and specific. Never write paragraphs.`,
    temperature: 0.4,
    images: image ? [GeminiService.imagePart(image.buffer, image.mimeType)] : [],
    prompt: `Critique ${subject}${occasion ? ` for this occasion: ${occasion}` : ''}.
${image ? 'If the photo does not show a wearable outfit, set isOutfit to false and explain in reason.' : 'Set isOutfit to true.'}
Score honestly on a 1-10 scale (one decimal); reserve 9+ for genuinely excellent styling. Also rate fit, colour and coordination 1-10.
Give 3-5 observations with status "good" and 2-4 with status "improve". Cover the whole look, not just fit: garment areas (shoulders, sleeves, waist, trouser length), footwear, colour combination, how the colours suit the visible skin tone, accessories, hairstyle and grooming, pose and presence, and the setting or lighting of the photo.
Only describe what is actually visible${image ? ' in the photo' : ''}; never invent details.
Each title is 2-4 words, each detail one short sentence (max 12 words). For "improve", fix is the concrete change in max 10 words (e.g. "Hem trousers to a slight break"), and options are 2-3 specific alternatives to try instead (e.g. "White leather sneakers", "Tan suede loafers"), each 2-4 words.
Also fill checks: one entry for each of ${CRITIC_CHECKS.join(', ')} with verdict great, good or fix and a note of max 10 words. Skip an entry only when it cannot be judged${image ? ' from the photo' : ' without a photo (skin-tone, grooming, pose and setting need one)'}.
${image ? 'For every observation, box is the bounding box of that area in the photo as [ymin, xmin, ymax, xmax] on a 0-1000 scale. For an observation about the whole outfit (colour, pose, setting), box the whole person.' : ''}
finalTip is one sentence, max 14 words.
${canSuggest ? `Then suggest up to 2 alternative combinations from the user's wardrobe (by id) that would improve on or offer a different take on this look.\nWardrobe: ${JSON.stringify(wardrobeItems.map(describeItem))}` : ''}`,
    schema: {
      type: 'object',
      properties: {
        isOutfit: { type: 'boolean' },
        reason: { type: 'string' },
        score: { type: 'number' },
        category: { type: 'string', enum: STYLE_CATEGORIES },
        summary: { type: 'string', description: 'One line, max 12 words' },
        ratings: {
          type: 'object',
          properties: { fit: { type: 'number' }, colour: { type: 'number' }, coordination: { type: 'number' } },
          required: ['fit', 'colour', 'coordination'],
        },
        observations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string', description: 'Garment area, 1-3 words' },
              aspect: { type: 'string', enum: CRITIC_ASPECTS },
              status: { type: 'string', enum: ['good', 'improve'] },
              title: { type: 'string' },
              detail: { type: 'string' },
              fix: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              ...(image && { box: { type: 'array', items: { type: 'integer' } } }),
            },
            required: ['area', 'aspect', 'status', 'title', 'detail', ...(image ? ['box'] : [])],
          },
        },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string', enum: CRITIC_CHECKS },
              verdict: { type: 'string', enum: CHECK_VERDICTS },
              note: { type: 'string' },
            },
            required: ['aspect', 'verdict', 'note'],
          },
        },
        finalTip: { type: 'string' },
        ...(canSuggest && {
          alternatives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                itemIds: { type: 'array', items: { type: 'string', enum: [...itemsById.keys()] } },
                reason: { type: 'string' },
              },
              required: ['title', 'itemIds', 'reason'],
            },
          },
        }),
      },
      required: ['isOutfit', 'score', 'category', 'summary', 'ratings', 'observations', 'checks', 'finalTip'],
    },
  });

  if (result.isOutfit === false) {
    throw new AIError(result.reason || 'No outfit was detected in this photo. Try a clear, full-length photo.', 422);
  }

  const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const observations = (Array.isArray(result.observations) ? result.observations : [])
    .filter((o) => o && ['good', 'improve'].includes(o.status) && text(o.title, 60))
    .slice(0, 9)
    .map((o, index) => ({
      id: index + 1,
      area: text(o.area, 40),
      aspect: CRITIC_ASPECTS.includes(o.aspect) ? o.aspect : 'coordination',
      status: o.status,
      title: text(o.title, 60),
      detail: text(o.detail, 140),
      fix: o.status === 'improve' ? text(o.fix, 100) || null : null,
      options: o.status === 'improve'
        ? (Array.isArray(o.options) ? o.options : []).map((opt) => text(opt, 40)).filter(Boolean).slice(0, 3)
        : [],
      // Regions only come from a photo; wardrobe combinations have none.
      region: image ? toRegion(o.box) : null,
    }));

  if (!observations.length) {
    throw new AIError('The AI stylist returned an incomplete review. Please try again.', 502);
  }

  const alternatives = (result.alternatives || [])
    .map((alt) => {
      const outfit = buildOutfit(alt.itemIds || [], itemsById);
      return outfit && { ...outfit, title: alt.title, explanation: alt.reason };
    })
    .filter(Boolean);

  return {
    score: rating(Number(result.score)) || 1,
    category: STYLE_CATEGORIES.includes(result.category) ? result.category : null,
    summary: text(result.summary, 140),
    ratings: {
      fit: rating(Number(result.ratings?.fit)),
      colour: rating(Number(result.ratings?.colour)),
      coordination: rating(Number(result.ratings?.coordination)),
    },
    observations,
    // One per aspect, in checklist order; unknown or duplicate entries dropped.
    checks: CRITIC_CHECKS.map((aspect) => {
      const check = (Array.isArray(result.checks) ? result.checks : []).find((c) => c?.aspect === aspect);
      return check && CHECK_VERDICTS.includes(check.verdict) && text(check.note, 90)
        ? { aspect, verdict: check.verdict, note: text(check.note, 90) }
        : null;
    }).filter(Boolean),
    finalTip: text(result.finalTip, 160),
    alternatives,
  };
}

/** Image-edit prompt showing one critic fix on the user's own photo. */
function critiqueFixPrompt({ area, fix }) {
  return `This is a photo of a person. Make one styling change to their outfit: ${fix}${area ? ` (the ${area})` : ''}.
Keep every other garment, accessory and colour exactly as it is.
${PRESERVE_PERSON}`;
}

// ---------------------------------------------------------------------------
// 7. Personal colour palette
// ---------------------------------------------------------------------------

const swatchList = (description, noteDescription = 'Short tip on how to wear it') => ({
  type: 'array',
  description,
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      hex: { type: 'string', description: '#RRGGBB' },
      note: { type: 'string', description: noteDescription },
    },
    required: ['name', 'hex', 'note'],
  },
});

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const list = (value) => (Array.isArray(value) ? value : []);

const cleanSwatches = (value, max = 12) => list(value)
  .filter((s) => s && typeof s.name === 'string' && s.name.trim() && HEX.test(s.hex))
  .slice(0, max)
  .map((s) => ({ name: text(s.name, 40), hex: s.hex.toUpperCase(), note: text(s.note, 200) }));

const PIECES = ['tops', 'trousers', 'jackets', 'dresses', 'shoes', 'accessories'];

/**
 * Validates a palette from Gemini or from the client (a saved or edited one):
 * unknown enum values fall back to "not known", bad colours are dropped and
 * text is length-capped. Never invents values that weren't supplied.
 */
function normalizePalette(raw = {}) {
  return {
    season: pick(raw.season, ['Spring', 'Summer', 'Autumn', 'Winter'], 'Unknown'),
    skinTone: pick(raw.skinTone, SKIN_TONES, null),
    undertone: pick(raw.undertone, UNDERTONES, 'uncertain'),
    undertoneNote: text(raw.undertoneNote, 300),
    veinColor: pick(raw.veinColor, VEIN_COLORS, 'not-provided'),
    veinNote: text(raw.veinNote, 300),
    confidence: pick(raw.confidence, ['low', 'medium', 'high'], null),
    contrast: pick(raw.contrast, ['low', 'medium', 'high'], null),
    summary: text(raw.summary, 600),
    lightingNote: text(raw.lightingNote, 300),
    recommendedColors: cleanSwatches(raw.recommendedColors),
    neutralColors: cleanSwatches(raw.neutralColors),
    experimentColors: cleanSwatches(raw.experimentColors),
    avoidColors: cleanSwatches(raw.avoidColors),
    recommendedMetals: cleanSwatches(raw.recommendedMetals, 4),
    lessFlatteringMetals: cleanSwatches(raw.lessFlatteringMetals, 4),
    combinations: list(raw.combinations).slice(0, 6).map((c) => ({
      name: text(c?.name, 60),
      usage: text(c?.usage, 200),
      hexes: list(c?.hexes).filter((h) => HEX.test(h)).slice(0, 4).map((h) => h.toUpperCase()),
      pieces: Object.fromEntries(PIECES.map((piece) => [piece, text(c?.pieces?.[piece], 160)])),
    })).filter((c) => c.name && c.hexes.length >= 2),
    // One entry per category, in the guide's fixed order.
    guide: COLOR_GUIDE_CATEGORIES.map((category) => {
      const entry = list(raw.guide).find((g) => g?.category === category);
      return entry && { category, colors: cleanSwatches(entry.colors, 5), tip: text(entry.tip, 240) };
    }).filter((entry) => entry && entry.colors.length > 0),
  };
}

const VEIN_RESULTS = VEIN_COLORS.filter((v) => v !== 'not-provided');

async function analyzeColorPalette({ face, wrist, user }) {
  const preferences = describePreferences(user, { includePalette: false });
  const images = [GeminiService.imagePart(face.buffer, face.mimeType)];
  if (wrist) images.push(GeminiService.imagePart(wrist.buffer, wrist.mimeType));

  const result = await gemini.generateJSON({
    systemInstruction: `${STYLIST_RULES}
You are acting as a personal colour consultant. You may describe visible colouring (skin tone and undertone, hair and eye colour) only as needed for clothing colour advice.
Skin tone and undertone are styling estimates from a photo, never medical or definitive classifications.`,
    temperature: 0.4,
    images,
    prompt: `Image 1 is the person's face.${wrist ? ' Image 2 is the inside of their wrist, for vein colour.' : ' No wrist photo was provided.'}

1. Check the photos. If no face is clearly visible in image 1 (too dark, blurry, covered, or not a person), set isSuitable to false and explain in unsuitableReason.
   Rate photoQuality: "poor" for coloured or artificial light, heavy filters, strong shadows or blur; "fair" for some colour cast; "good" for clear natural daylight.
   Say any lighting caveat in lightingNote. With "poor" quality, confidence must be "low".
2. From the face, estimate skinTone (the visible depth of skin colour) and undertone, with a one-sentence undertoneNote on what you saw (e.g. how gold or silver tones read against the skin).
   Use "uncertain" if lighting makes the undertone impossible to judge.
3. ${wrist
    ? 'First decide veinsClearlyVisible: true only if image 2 shows the inner (palm-side) wrist with distinct veins in focus. The back of a hand, fingers, a watch, blurry or shadowed skin all mean false. Only when true, classify the vein colour as blue-purple, green or blue-green; otherwise use "inconclusive". Explain briefly in veinNote (if false, say what would make the photo usable).'
    : 'Set veinColor to "inconclusive" and veinNote to an empty string: there is no wrist photo, and vein colour must never be inferred from a face.'}
4. Build a personalised palette from the combined analysis (do not use a stock list for the undertone):
   - recommended: 8-10 clothing colours; each note says why it works for this person.
   - neutrals: 4-5 base neutrals; experiment: 3-4 accents to try.
   - avoid: 3-4 colours to use less, each note explaining the effect, kindly (they are not forbidden; preference and pairing matter).
   - metals: recommend 1-3 metal finishes (e.g. gold, silver, rose gold, champagne gold, bronze, gunmetal) with a realistic metal hex and a why-note, and 1-2 to use less. Allow mixed metals where they suit; do not assume warm means only gold or cool means only silver.
   - combinations: 4 outfit colour combinations, each with 2-3 hexes, a one-line usage, and how to wear them as tops, trousers, jackets, dresses, shoes and accessories (one short phrase each).
   - guide: for each category (everyday, formal, casual, festive, accessories, neutrals, contrast) give 2-4 colours and a short tip.${preferences ? `\n\nTailor the palette and guide to this style profile:\n${preferences}` : ''}`,
    schema: {
      type: 'object',
      properties: {
        isSuitable: { type: 'boolean' },
        unsuitableReason: { type: 'string' },
        photoQuality: { type: 'string', enum: ['good', 'fair', 'poor'] },
        lightingNote: { type: 'string' },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        skinTone: { type: 'string', enum: SKIN_TONES },
        undertone: { type: 'string', enum: UNDERTONES },
        undertoneNote: { type: 'string' },
        veinsClearlyVisible: { type: 'boolean' },
        veinColor: { type: 'string', enum: VEIN_RESULTS },
        veinNote: { type: 'string' },
        season: { type: 'string', enum: ['Spring', 'Summer', 'Autumn', 'Winter'] },
        contrast: { type: 'string', enum: ['low', 'medium', 'high'] },
        summary: { type: 'string', description: '2-3 friendly sentences' },
        recommended: swatchList('8-10 core clothing colours', 'Why this colour works for this person, one sentence'),
        neutrals: swatchList('4-5 base neutrals'),
        experiment: swatchList('3-4 accent colours to try'),
        avoid: swatchList('3-4 colours to use less', 'Why to use it less, and how to wear it if loved'),
        recommendedMetals: swatchList('1-3 metal finishes that suit', 'Why it suits'),
        lessFlatteringMetals: swatchList('1-2 metal finishes to use less', 'Why, kindly'),
        combinations: {
          type: 'array',
          description: '4 outfit colour combinations',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'e.g. "Olive green + cream"' },
              hexes: { type: 'array', items: { type: 'string' }, description: '2-3 #RRGGBB values' },
              usage: { type: 'string', description: 'e.g. "Olive chinos, cream tee, tan loafers"' },
              pieces: {
                type: 'object',
                properties: Object.fromEntries(PIECES.map((piece) => [piece, { type: 'string' }])),
                required: PIECES,
              },
            },
            required: ['name', 'hexes', 'usage', 'pieces'],
          },
        },
        guide: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: COLOR_GUIDE_CATEGORIES },
              colors: swatchList('2-4 colours', 'Optional short note'),
              tip: { type: 'string' },
            },
            required: ['category', 'colors', 'tip'],
          },
        },
      },
      required: ['isSuitable'],
    },
  });

  if (!result.isSuitable) {
    throw new AIError(text(result.unsuitableReason, 300) || 'A clear, front-facing photo in natural light is needed.', 422);
  }

  const palette = normalizePalette({
    ...result,
    recommendedColors: result.recommended,
    neutralColors: result.neutrals,
    experimentColors: result.experiment,
    avoidColors: result.avoid,
    // Vein colour comes only from a wrist photo with veins the model confirms
    // it can see, whatever colour it reports otherwise.
    veinColor: !wrist ? 'not-provided'
      : (result.veinsClearlyVisible === true && VEIN_RESULTS.includes(result.veinColor) ? result.veinColor : 'inconclusive'),
    veinNote: wrist ? result.veinNote : '',
    // A poor photo can't support a confident reading.
    confidence: result.photoQuality === 'poor' ? 'low' : result.confidence,
  });

  if (!palette.skinTone || palette.recommendedColors.length < 3) {
    throw new AIError('The AI stylist returned an incomplete analysis. Please try again.', 502);
  }
  return palette;
}

// ---------------------------------------------------------------------------
// 5. Shopping query understanding
// ---------------------------------------------------------------------------

async function parseShoppingQuery(query) {
  const result = await gemini.generateJSON({
    temperature: 0.1,
    prompt: `Extract structured shopping filters from this request made by a shopper in India. Prices are in INR.
"under 1k" means maxPrice 1000. Leave fields empty when not mentioned.
searchQuery must be a concise product search string for a shopping engine (no price words), e.g. "black oversized t-shirt men".

Request: ${JSON.stringify(query)}`,
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        color: { type: 'string' },
        style: { type: 'string' },
        size: { type: 'string' },
        gender: { type: 'string', enum: ['men', 'women', 'unisex', 'unspecified'] },
        occasion: { type: 'string' },
        brand: { type: 'string' },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
        otherRequirements: stringArray('Fabric, fit or other details'),
        searchQuery: { type: 'string' },
      },
      required: ['searchQuery'],
    },
  });

  const price = (v) => (typeof v === 'number' && v > 0 ? Math.round(v) : null);
  return {
    category: result.category || null,
    color: result.color || null,
    style: result.style || null,
    size: result.size || null,
    gender: result.gender && result.gender !== 'unspecified' ? result.gender : null,
    occasion: result.occasion || null,
    brand: result.brand || null,
    minPrice: price(result.minPrice),
    maxPrice: price(result.maxPrice),
    otherRequirements: result.otherRequirements || [],
    searchQuery: result.searchQuery.trim() || query,
  };
}

// ---------------------------------------------------------------------------
// 6. Budget shopping plan
// ---------------------------------------------------------------------------

/**
 * Asks Gemini for a prioritised list, then enforces the budget in code:
 * lowest-priority items are dropped until the total fits.
 */
async function planBudget({ budget, goal, categories = [], style, priorities, wardrobeItems, user }) {
  const result = await gemini.generateJSON({
    systemInstruction: STYLIST_RULES,
    temperature: 0.4,
    prompt: `The user has a total budget of ₹${budget} (INR) and wants: ${goal || 'to improve their wardrobe'}.
${categories.length ? `Categories they want to shop for: ${categories.join(', ')}.` : ''}
${style ? `Preferred style: ${style}.` : ''}
${priorities ? `Their priorities: ${priorities}.` : ''}
${describePreferences(user)}

Look at what they already own and recommend the most useful missing pieces, essentials first.
Give realistic Indian high-street price allocations. The sum of quantity × unitBudget MUST NOT exceed ₹${budget}.
Do not recommend things they already have plenty of.

Current wardrobe (${wardrobeItems.length} items):
${JSON.stringify(wardrobeItems.map((i) => ({ name: i.name, category: i.category, colors: i.colors, style: i.style })))}`,
    schema: {
      type: 'object',
      properties: {
        strategy: { type: 'string', description: '1-2 sentences on how the budget is split' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'e.g. "Casual cotton T-shirt"' },
              category: { type: 'string' },
              quantity: { type: 'integer' },
              unitBudget: { type: 'number', description: 'INR per piece' },
              priority: { type: 'integer', description: '1 = essential, 3 = nice to have' },
              reason: { type: 'string', description: 'Why it fills a gap in their wardrobe' },
              searchQuery: { type: 'string', description: 'Product search string' },
            },
            required: ['name', 'category', 'quantity', 'unitBudget', 'priority', 'reason', 'searchQuery'],
          },
        },
      },
      required: ['strategy', 'items'],
    },
  });

  let items = (result.items || [])
    .map((i) => ({
      ...i,
      quantity: Math.max(1, Math.round(i.quantity) || 1),
      unitBudget: Math.max(1, Math.round(i.unitBudget) || 0),
      priority: Math.min(3, Math.max(1, Math.round(i.priority) || 2)),
    }))
    .filter((i) => i.unitBudget > 0)
    .sort((a, b) => a.priority - b.priority);

  const totalOf = (list) => list.reduce((sum, i) => sum + i.quantity * i.unitBudget, 0);
  while (items.length && totalOf(items) > budget) {
    items = items.slice(0, -1);
  }

  if (!items.length) {
    throw new AIError('Could not build a shopping list that fits this budget. Try a higher budget or fewer categories.', 422);
  }

  return { strategy: result.strategy, items, total: totalOf(items) };
}

// ---------------------------------------------------------------------------
// Virtual try-on & Style Makeover
// ---------------------------------------------------------------------------

// Item types let the app show a matching product photo for each suggestion.
const ACCESSORY_TYPES = ['watch', 'sunglasses', 'glasses', 'belt', 'bag', 'necklace', 'bracelet', 'ring', 'earrings', 'hat', 'cap', 'scarf', 'other'];
const FOOTWEAR_TYPES = ['sneakers', 'boots', 'loafers', 'formal-shoes', 'sandals', 'heels', 'other'];
const STYLE_CATEGORIES = ['Casual', 'Smart Casual', 'Formal', 'Streetwear', 'Minimal', 'Classic', 'Sporty', 'Ethnic', 'Bohemian'];

// Shared by both image prompts: what must not change about the person.
const PRESERVE_PERSON = `Keep the same person: identical face and facial features, identity, hairstyle, skin tone, body shape and proportions, pose and expression.
Keep the original background, camera angle, framing and lighting.
The result must be a photorealistic photograph, not an illustration, render or collage.`;

function tryOnPrompt(items) {
  const garments = items
    .map((item, index) => `Image ${index + 2}: ${item.name} (${[item.category, item.type, item.colors?.join('/'), item.pattern].filter(Boolean).join(', ')})`)
    .join('\n');
  return `Image 1 is a photo of a person. The other images are clothing items from their wardrobe:
${garments}

Edit image 1 so the person is wearing all of these items, each replacing whatever they currently wear in the same place on the body. Keep any clothing that is not being replaced.
Reproduce every item faithfully: exact colours, pattern, print, texture, logos and cut.
Make the fit realistic for this body: natural drape, folds and creases, with shadows and highlights that match the photo's lighting.
${PRESERVE_PERSON}
Do not add clothing or accessories that were not provided.`;
}

// Plain-text description of a wardrobe item, for image models that take the
// garment as words (or as a caption next to its photo).
function garmentDescription(item) {
  return [item.colors?.join('/'), item.pattern, item.name, item.type && item.type !== item.name ? `(${item.type})` : '']
    .filter(Boolean).join(' ').slice(0, 200);
}

// Variant of tryOnPrompt for editors that only accept the person photo: the
// garments are described in words instead of shown, so the result matches
// them less exactly than a model that sees the garment photos.
function tryOnTextPrompt(items) {
  return `Edit this photo of a person so they are wearing:
${items.map((item) => `- ${garmentDescription(item)} (${item.category})`).join('\n')}

Each item replaces whatever they currently wear in the same place on the body. Keep any clothing that is not being replaced.
Make the fit realistic for this body: natural drape, folds and creases, with shadows and highlights that match the photo's lighting.
${PRESERVE_PERSON}
Do not add clothing or accessories that were not listed.`;
}

function makeoverPrompt(style) {
  const list = (label, values) => (values.length ? `${label}:\n${values.map((v) => `- ${v}`).join('\n')}\n` : '');
  return `This is a photo of a person. Restyle their outfit into the "${style.name}" look${style.styleCategory ? ` (${style.styleCategory})` : ''}.
${style.summary}

${list('Clothing changes', style.clothingChanges)}${list('Accessories to add', style.accessories)}${list('Footwear', style.footwear)}
Accessories must look naturally worn and correctly sized, sitting on the body with proper perspective, contact shadows and reflections, never pasted on.
${PRESERVE_PERSON}
Change only the clothing, accessories and footwear described above.`;
}

async function analyzeMakeover({ photo, user, wardrobeItems = [] }) {
  const wardrobe = wardrobeItems.length
    ? wardrobeItems.slice(0, 60).map((i) => `- ${i.name} (${[i.category, i.colors?.join('/')].filter(Boolean).join(', ')})`).join('\n')
    : '';
  const item = (types, description) => ({
    type: 'array',
    description,
    items: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short item name, 2-4 words, e.g. "Silver link necklace"' },
        type: { type: 'string', enum: types },
      },
      required: ['name', 'type'],
    },
  });
  const option = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Short, evocative name for the look, max 5 words' },
      styleCategory: { type: 'string', enum: STYLE_CATEGORIES },
      summary: { type: 'string', description: 'One sentence, max 18 words, on the idea behind the look' },
      clothingChanges: stringArray('2-3 concrete clothing changes, max 8 words each, e.g. "Olive utility jacket over the white tee"'),
      accessories: item(ACCESSORY_TYPES, '2-3 specific accessories'),
      footwear: item(FOOTWEAR_TYPES, '1 specific footwear choice'),
      pros: stringArray('2 short reasons this direction suits this person and outfit, max 7 words each'),
      cons: stringArray('1-2 short trade-offs or watch-outs, max 7 words each'),
    },
    required: ['name', 'styleCategory', 'summary', 'clothingChanges', 'accessories', 'footwear', 'pros', 'cons'],
  };

  const result = await gemini.generateJSON({
    systemInstruction: STYLIST_RULES,
    temperature: 0.8,
    images: [GeminiService.imagePart(photo.buffer, photo.mimeType)],
    prompt: `The photo shows the user in their current outfit. Act as their personal stylist.
First, assess the outfit: what works and what would elevate it (colour coordination, balance, fit, accessories, footwear).
Then propose exactly 3 distinct makeover options that build on what they are wearing, each in a different style direction (for example casual, smart casual, formal or streetwear).
Each option must be specific enough for a photo editor to apply: name exact garments, colours and accessories.
${describePreferences(user)}
${wardrobe ? `Pieces they already own (mention one by name when it fits an option):\n${wardrobe}` : ''}`,
    schema: {
      type: 'object',
      properties: {
        assessment: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: '1-2 sentences describing the current outfit' },
            strengths: stringArray('2-3 things that already work'),
            improvements: stringArray('2-4 specific improvements'),
          },
          required: ['summary', 'strengths', 'improvements'],
        },
        options: { type: 'array', items: option, minItems: 3, maxItems: 3 },
      },
      required: ['assessment', 'options'],
    },
  });

  if (!Array.isArray(result.options) || result.options.length < 3) {
    throw new AIError('The AI stylist did not return three style options. Please try again.', 502);
  }
  return { assessment: result.assessment, options: result.options.slice(0, 3).map(sanitizeStyleOption) };
}

/**
 * Normalises a makeover option. Options round-trip through the client before
 * a look is generated, so this also bounds whatever it sends back.
 * Returns null if the option is unusable.
 */
function sanitizeStyleOption(option) {
  if (!option || typeof option !== 'object') return null;
  const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const list = (value, limit = 6) => (Array.isArray(value) ? value.map((v) => text(v, 200)).filter(Boolean).slice(0, limit) : []);
  // Accessories/footwear arrive as { name, type } from analysis, or as plain
  // names when an option comes back from the client or a saved look.
  const items = (value, types) => (Array.isArray(value) ? value : [])
    .map((v) => (typeof v === 'string' ? { name: v } : v))
    .map((v) => ({ name: text(v?.name, 80), type: types.includes(v?.type) ? v.type : 'other' }))
    .filter((v) => v.name)
    .slice(0, 4);
  const name = text(option.name, 80);
  if (!name) return null;
  const accessories = items(option.accessories, ACCESSORY_TYPES);
  const footwear = items(option.footwear, FOOTWEAR_TYPES);
  return {
    name,
    styleCategory: STYLE_CATEGORIES.includes(option.styleCategory) ? option.styleCategory : null,
    summary: text(option.summary, 500),
    clothingChanges: list(option.clothingChanges),
    accessories: accessories.map((a) => a.name),
    accessoryTypes: accessories.map((a) => a.type),
    footwear: footwear.map((f) => f.name),
    footwearTypes: footwear.map((f) => f.type),
    pros: list(option.pros, 3),
    cons: list(option.cons, 3),
  };
}

// ---------------------------------------------------------------------------
// 8. Chat
// ---------------------------------------------------------------------------

function chatSystemPrompt({ user, wardrobeItems, weather, savedOutfits }) {
  const wardrobe = wardrobeItems.length
    ? wardrobeItems.map((i) => `- ${i.name} (${[i.category, i.colors?.join('/'), i.style].filter(Boolean).join(', ')})`).join('\n')
    : 'The wardrobe is empty.';
  const outfits = savedOutfits.length
    ? savedOutfits.map((o) => `- ${o.title}: ${o.itemNames.join(' + ')}${o.favorite ? ' (favourite)' : ''}`).join('\n')
    : 'None yet.';

  return `${STYLIST_RULES}
You are chatting with ${user.name} inside the DigiCloset app. Prices are in INR (₹).

When recommending what to wear, use pieces from their wardrobe below and write item names in **bold** exactly as listed.
If something they need is missing, say so plainly and suggest what to buy instead of inventing items they own.
Keep answers short and scannable: a sentence or two, then bullets when listing an outfit.

${describePreferences(user)}
${weather ? `Current weather in ${weather.city}: ${weather.condition}, ${weather.temperatureC}°C, humidity ${weather.humidity}%.` : ''}

Their wardrobe:
${wardrobe}

Saved outfits:
${outfits}`;
}

async function chat({ message, history, user, wardrobeItems, weather, savedOutfits = [] }) {
  return gemini.chat({
    history: history.slice(-20),
    message,
    systemInstruction: chatSystemPrompt({ user, wardrobeItems, weather, savedOutfits }),
  });
}

module.exports = {
  analyzeClothingImage,
  generateOutfits,
  critiqueOutfit,
  critiqueFixPrompt,
  toRegion,
  analyzeColorPalette,
  normalizePalette,
  parseShoppingQuery,
  planBudget,
  analyzeMakeover,
  sanitizeStyleOption,
  tryOnPrompt,
  tryOnTextPrompt,
  garmentDescription,
  makeoverPrompt,
  chat,
  buildOutfit,
};
