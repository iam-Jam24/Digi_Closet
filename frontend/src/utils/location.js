export function formatDistance(km) {
  if (km == null) return '';
  return km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m` : `${km.toFixed(1)} km`;
}

// Opens turn-by-turn navigation from wherever the user is (Google Maps picks
// up the device's location itself, so ours isn't put in the URL).
export function directionsUrl(store) {
  const { lat, lng } = store.location;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
