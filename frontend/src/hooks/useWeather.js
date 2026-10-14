import { useState, useCallback } from 'react';
import api from '../services/api';

export default function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (city) => {
    if (!city) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/weather', { params: { city } });
      setWeather(data.data);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch weather.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { weather, loading, error, fetchWeather };
}
