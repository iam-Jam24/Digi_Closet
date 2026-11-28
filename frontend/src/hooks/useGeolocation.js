import { useCallback, useState } from 'react';

const MESSAGES = {
  unsupported: "This browser can't share its location. Search for a place instead.",
  insecure: 'Location sharing needs a secure (HTTPS) connection. Search for a place instead.',
  1: "Location access was blocked. Allow it in your browser's site settings, or search for a place instead.",
  2: "Your device couldn't work out where you are. Check that location services are on, or search for a place instead.",
  3: 'Finding your location took too long. Try again, or search for a place instead.',
};

/**
 * One-shot browser geolocation, only ever started by a user action. There is
 * no watchPosition (no tracking), and the position is handed to the caller
 * rather than kept or persisted here.
 */
export default function useGeolocation() {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const locate = useCallback(() => new Promise((resolve) => {
    setError('');
    if (!window.isSecureContext) {
      setError(MESSAGES.insecure);
      resolve(null);
      return;
    }
    if (!('geolocation' in navigator)) {
      setError(MESSAGES.unsupported);
      resolve(null);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => {
        setLocating(false);
        setError(MESSAGES[err.code] || MESSAGES[2]);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2 * 60 * 1000 },
    );
  }), []);

  return { locate, locating, error, clearError: () => setError('') };
}
