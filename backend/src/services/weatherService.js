/**
 * Weather Service
 *
 * Uses Open-Meteo (https://open-meteo.com) — a free, no-API-key-required
 * weather API — to provide real current conditions for weather-aware
 * styling. This is genuinely live data, not a mock.
 */

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

class WeatherService {
  async getCurrentWeather({ city, lat, lon }) {
    try {
      let latitude = lat;
      let longitude = lon;
      let resolvedCity = city;

      if (!latitude || !longitude) {
        if (!city) {
          throw new Error('Either city or lat/lon coordinates are required.');
        }
        const geoRes = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          return { configured: true, found: false, message: `Could not find weather data for "${city}".` };
        }
        latitude = geoData.results[0].latitude;
        longitude = geoData.results[0].longitude;
        resolvedCity = geoData.results[0].name;
      }

      const forecastRes = await fetch(
        `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
      );
      const data = await forecastRes.json();

      return {
        configured: true,
        found: true,
        city: resolvedCity,
        temperatureC: data.current?.temperature_2m,
        humidity: data.current?.relative_humidity_2m,
        windSpeedKmh: data.current?.wind_speed_10m,
        weatherCode: data.current?.weather_code,
        condition: this._describeWeatherCode(data.current?.weather_code),
        source: 'open-meteo',
      };
    } catch (error) {
      console.error('Weather lookup failed:', error.message);
      return { configured: true, found: false, message: 'Weather lookup failed. Please try again.' };
    }
  }

  _describeWeatherCode(code) {
    const map = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
      80: 'Rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail',
    };
    return map[code] || 'Unknown';
  }
}

module.exports = new WeatherService();
