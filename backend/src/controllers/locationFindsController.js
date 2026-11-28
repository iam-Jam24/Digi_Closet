const {
  locationFinds, DEFAULT_RADIUS_KM, MIN_RADIUS_KM, MAX_RADIUS_KM,
} = require('../services/locationFinds');
const { isLatitude, isLongitude } = require('../services/locationFinds/geo');

const badRequest = (res, message) => res.status(400).json({ success: false, message });

// Responses describe where the user is, so keep them out of shared caches.
const noStore = (res) => res.set('Cache-Control', 'private, no-store');

/**
 * GET /api/location-finds/nearby?lat=..&lng=..[&radius=5][&refresh=1]
 * GET /api/location-finds/nearby?q=Jaipur[&radius=5]
 *
 * Either exact coordinates from the browser, or a typed place (city, area,
 * landmark or PIN code) that is geocoded first. Coordinates are only used for
 * this request; they are not stored.
 */
const getNearbyStores = async (req, res, next) => {
  try {
    const { lat, lng, q, radius, refresh } = req.query;

    const radiusKm = radius === undefined || radius === '' ? DEFAULT_RADIUS_KM : Number(radius);
    if (!Number.isFinite(radiusKm) || radiusKm < MIN_RADIUS_KM || radiusKm > MAX_RADIUS_KM) {
      return badRequest(res, `Radius must be between ${MIN_RADIUS_KM} and ${MAX_RADIUS_KM} km.`);
    }

    let point;
    let origin = null;
    if (typeof q === 'string' && q.trim()) {
      const query = q.trim();
      if (query.length < 2 || query.length > 120) {
        return badRequest(res, 'Enter a city, area or PIN code between 2 and 120 characters.');
      }
      const place = await locationFinds.geocode(query);
      if (!place) {
        return res.status(404).json({
          success: false,
          message: `We couldn't find "${query}". Try a city, area, landmark or PIN code.`,
        });
      }
      point = { lat: place.lat, lng: place.lng };
      origin = place;
    } else {
      point = { lat: Number(lat), lng: Number(lng) };
      if (lat === undefined || lng === undefined || !isLatitude(point.lat) || !isLongitude(point.lng)) {
        return badRequest(res, 'A valid location is required: share your location or enter a place.');
      }
    }

    const result = await locationFinds.findNearby({
      ...point,
      radiusKm,
      refresh: refresh === '1' || refresh === 'true',
    });

    noStore(res);
    res.json({ success: true, data: { ...result, origin, categories: locationFinds.categories } });
  } catch (error) {
    next(error);
  }
};

// GET /api/location-finds/stores/:id
const getStoreDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!locationFinds.isValidStoreId(id)) return badRequest(res, 'Invalid store id.');

    const store = await locationFinds.getStoreDetails(id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    noStore(res);
    res.json({ success: true, data: { store } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNearbyStores, getStoreDetails };
