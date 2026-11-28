import { useCallback, useRef, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { SEARCH_RADIUS_KM } from '../constants/locationFinds';

/**
 * Nearby fashion stores from /api/location-finds/nearby, either around exact
 * coordinates ({ lat, lng }) or a typed place ({ q }). The search point lives
 * only in memory for refreshes; it is never written to storage.
 */
export default function useNearbyStores() {
  const [result, setResult] = useState(null);
  const [center, setCenter] = useState(null); // { lat, lng, label }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastQuery = useRef(null);
  const requestId = useRef(0);

  const run = useCallback(async (query, { refresh = false } = {}) => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const params = query.q
        ? { q: query.q, radius: SEARCH_RADIUS_KM }
        : { lat: query.lat, lng: query.lng, radius: SEARCH_RADIUS_KM };
      if (refresh) params.refresh = 1;
      const { data } = await api.get('/location-finds/nearby', { params });
      if (id !== requestId.current) return;

      const origin = data.data.origin;
      lastQuery.current = query;
      setCenter(origin
        ? { lat: origin.lat, lng: origin.lng, label: origin.label }
        : { lat: query.lat, lng: query.lng, label: null });
      setResult(data.data);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(getErrorMessage(err, 'Could not load nearby stores. Please try again.'));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const search = useCallback((query) => run(query), [run]);
  const refresh = useCallback(() => lastQuery.current && run(lastQuery.current, { refresh: true }), [run]);

  return { result, center, loading, error, search, refresh };
}
