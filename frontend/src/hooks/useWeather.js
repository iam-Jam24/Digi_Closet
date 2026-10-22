import { useState, useCallback } from 'react';
import api from '../services/api';

const WEATHER_CODE_MAP = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail',
};

export default function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (query = 'Bangalore') => {
    const params = typeof query === 'string'
      ? { city: query || 'Bangalore' }
      : { city: query?.city || (!query?.lat ? 'Bangalore' : undefined), lat: query?.lat, lon: query?.lon };

    try {
      setLoading(true);
      setError(null);

      // Attempt 1: Fetch via backend proxy /api/weather
      try {
        const { data } = await api.get('/weather', { params });
        if (data?.data && data.data.found) {
          setWeather(data.data);
          return data.data;
        }
      } catch {
        // Backend might be offline or proxy issue — fall through to direct Open-Meteo
      }

      // Attempt 2: Direct client-side Open-Meteo query (resilient fallback)
      let lat = params.lat;
      let lon = params.lon;
      let cityName = params.city || 'Bengaluru';

      if (!lat || !lon) {
        if (/bangalore|bengaluru/i.test(cityName)) {
          lat = 12.9716;
          lon = 77.5946;
          cityName = 'Bengaluru';
        } else {
          // Geocode city name
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5`);
          const geoData = await geoRes.json();
          const match = geoData.results?.find((r) => r.country_code === 'IN') || geoData.results?.[0];
          if (match) {
            lat = match.latitude;
            lon = match.longitude;
            cityName = match.name;
          } else {
            lat = 12.9716;
            lon = 77.5946;
            cityName = 'Bengaluru';
          }
        }
      }

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
      );
      const weatherData = await weatherRes.json();

      const result = {
        configured: true,
        found: true,
        city: cityName,
        temperatureC: Math.round(weatherData.current?.temperature_2m ?? 23),
        humidity: weatherData.current?.relative_humidity_2m ?? 65,
        windSpeedKmh: Math.round(weatherData.current?.wind_speed_10m ?? 10),
        weatherCode: weatherData.current?.weather_code ?? 0,
        condition: WEATHER_CODE_MAP[weatherData.current?.weather_code] || 'Partly cloudy',
        source: 'open-meteo',
      };

      setWeather(result);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch weather.');
      // Fallback object so UI stays functional
      const fallback = {
        configured: true,
        found: true,
        city: 'Bengaluru',
        temperatureC: 22,
        humidity: 70,
        windSpeedKmh: 10,
        weatherCode: 2,
        condition: 'Partly cloudy',
        source: 'fallback',
      };
      setWeather(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  return { weather, loading, error, fetchWeather };
}
