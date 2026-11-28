/**
 * Geographic helpers for Location Finds.
 */

const EARTH_RADIUS_KM = 6371.0088;

const toRadians = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance between two { lat, lng } points, in kilometres (Haversine). */
function haversineKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const isLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;
const isLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;

/**
 * Rounds coordinates to ~110 m (3 decimal places). Used for cache keys and
 * for the point sent to the places provider, so neither the cache nor the
 * provider holds the user's exact position. Distances shown to the user are
 * still measured from the exact point.
 */
function coarsen({ lat, lng }) {
  return { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
}

// Half the diagonal of a 0.001° cell: the most a coarsened point can be off by.
const COARSEN_MARGIN_KM = 0.08;

module.exports = { haversineKm, isLatitude, isLongitude, coarsen, COARSEN_MARGIN_KM };
