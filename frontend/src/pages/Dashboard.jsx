import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Shirt, Camera, UserCircle, Plus, ArrowRight, Wand2,
  MessageSquare, Palette, CalendarHeart, Wallet, Bot, ShoppingBag,
  Cloud, Sun, CloudRain, Snowflake, CloudLightning, CloudDrizzle, Wind,
  Thermometer, MapPin, BarChart3, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useWardrobe from '../hooks/useWardrobe';
import useOutfits from '../hooks/useOutfits';
import useWeather from '../hooks/useWeather';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

const quickLinks = [
  { to: '/outfits', label: 'Outfit Recommendations', icon: Wand2 },
  { to: '/wardrobe', label: 'Digital Wardrobe', icon: Shirt },
  { to: '/fashion-critic', label: 'Fashion Critic', icon: MessageSquare },
  { to: '/products', label: 'Smart Clothes Finder', icon: ShoppingBag },
  { to: '/shopping', label: 'Budget Assistant', icon: Wallet },
  { to: '/try-on', label: 'Virtual Try-On', icon: Camera },
  { to: '/styling/occasion', label: 'Occasion Styling', icon: CalendarHeart },
  { to: '/colors', label: 'Color Analyzer', icon: Palette },
  { to: '/chat', label: 'Fashion Chatbot', icon: Bot },
];

const WEATHER_ICONS = {
  'Clear sky': Sun, 'Mainly clear': Sun, 'Partly cloudy': Cloud, 'Overcast': Cloud,
  'Fog': Cloud, 'Depositing rime fog': Cloud,
  'Light drizzle': CloudDrizzle, 'Moderate drizzle': CloudDrizzle, 'Dense drizzle': CloudDrizzle,
  'Slight rain': CloudRain, 'Moderate rain': CloudRain, 'Heavy rain': CloudRain,
  'Rain showers': CloudRain, 'Moderate rain showers': CloudRain, 'Violent rain showers': CloudRain,
  'Slight snow': Snowflake, 'Moderate snow': Snowflake, 'Heavy snow': Snowflake,
  'Thunderstorm': CloudLightning, 'Thunderstorm with hail': CloudLightning,
};

function getWeatherTip(condition, temp) {
  if (temp >= 35) return 'Scorching! Go for breathable cotton, linen, and light colors.';
  if (temp >= 28) return 'It\'s warm — opt for light fabrics and shorter sleeves.';
  if (temp >= 18) return 'Pleasant weather! Great for layering with a light jacket.';
  if (temp >= 10) return 'Getting chilly — pair with a sweater or a jacket.';
  if (temp < 10) return 'Cold out there — go for warm layers, thermals, and coats.';
  if (condition?.includes('rain') || condition?.includes('drizzle')) return 'Carry an umbrella and avoid suede/delicate fabrics.';
  return 'Dress comfortably for the weather!';
}

function WeatherWidget({ weather, loading, onRefresh, city }) {
  if (loading) {
    return (
      <Card className="weather-widget weather-widget--loading">
        <div className="weather-widget__shimmer" />
        <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Fetching weather…</p>
      </Card>
    );
  }

  if (!weather || !weather.found) {
    return (
      <Card className="weather-widget weather-widget--empty">
        <Cloud size={28} color="var(--text-muted)" />
        <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
          {city ? `Couldn't find weather for "${city}"` : 'Enable location to see weather-based outfit tips'}
        </p>
        <Button size="sm" variant="ghost" onClick={onRefresh}>Retry</Button>
      </Card>
    );
  }

  const WeatherIcon = WEATHER_ICONS[weather.condition] || Cloud;
  const tip = getWeatherTip(weather.condition, weather.temperatureC);

  return (
    <Card className="weather-widget">
      <div className="weather-widget__header">
        <div className="weather-widget__icon-wrap">
          <WeatherIcon size={28} />
        </div>
        <div>
          <div className="weather-widget__temp">{Math.round(weather.temperatureC)}°C</div>
          <div className="weather-widget__condition">{weather.condition}</div>
        </div>
      </div>
      <div className="weather-widget__details">
        <span className="weather-widget__detail"><MapPin size={12} /> {weather.city}</span>
        <span className="weather-widget__detail"><Wind size={12} /> {weather.windSpeedKmh} km/h</span>
        <span className="weather-widget__detail"><Thermometer size={12} /> Humidity {weather.humidity}%</span>
      </div>
      <p className="weather-widget__tip">💡 {tip}</p>
    </Card>
  );
}

function WardrobeAnalytics({ items }) {
  if (items.length === 0) return null;

  const catCounts = {};
  const colorCounts = {};
  items.forEach((item) => {
    catCounts[item.category] = (catCounts[item.category] || 0) + 1;
    (item.colors || []).forEach((c) => { colorCounts[c] = (colorCounts[c] || 0) + 1; });
  });

  const sortedCategories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const maxCatCount = sortedCategories[0]?.[1] || 1;
  const topColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const gapCategories = ['Tops', 'Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Footwear', 'Outerwear'].filter(
    (cat) => !catCounts[cat]
  );

  return (
    <Card className="section">
      <h2 className="section__title"><BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />Wardrobe Analytics</h2>
      <div className="analytics-grid">
        <div>
          <h3 className="analytics-subtitle">Category Distribution</h3>
          <div className="analytics-bars">
            {sortedCategories.map(([cat, count]) => (
              <div key={cat} className="analytics-bar-row">
                <span className="analytics-bar-label">{cat}</span>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill" style={{ width: `${(count / maxCatCount) * 100}%` }} />
                </div>
                <span className="analytics-bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="analytics-subtitle">Top Colors</h3>
          <div className="analytics-color-chips">
            {topColors.map(([color, count]) => (
              <span key={color} className="analytics-color-chip">
                <span className="analytics-color-dot" style={{ background: color.toLowerCase() }} />
                {color} <span className="text-muted">({count})</span>
              </span>
            ))}
          </div>
          {gapCategories.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <h3 className="analytics-subtitle"><TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 'var(--space-1)' }} />Wardrobe Gaps</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                You're missing: {gapCategories.join(', ')}. Adding these will help AI build better outfits.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const { items, loading: wardrobeLoading } = useWardrobe();
  const { saved, loading: outfitsLoading } = useOutfits();
  const { weather, loading: weatherLoading, fetchWeather } = useWeather();
  const [weatherCity, setWeatherCity] = useState('Bangalore');

  // Auto-detect location on mount for weather, defaulting to Bangalore
  useEffect(() => {
    const defaultCity = 'Bangalore';
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const data = await fetchWeather({ lat: latitude, lon: longitude });
            if (data?.city) {
              setWeatherCity(data.city);
            }
          } catch {
            fetchWeather(defaultCity);
          }
        },
        () => {
          // Geolocation denied or unavailable — default to Bangalore
          fetchWeather(defaultCity);
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(defaultCity);
    }
  }, [fetchWeather]);

  const firstName = (user?.name || firebaseUser?.displayName || '').split(' ')[0] || 'there';
  const recentItems = items.slice(0, 4);

  const totalColors = new Set(items.flatMap((i) => i.colors || [])).size;
  const statCards = [
    { icon: Shirt, label: 'Wardrobe Items', value: wardrobeLoading ? '—' : String(items.length), color: 'var(--color-info)' },
    { icon: Heart, label: 'Saved Outfits', value: outfitsLoading ? '—' : String(saved.length), color: 'var(--accent-violet)' },
    { icon: Palette, label: 'Unique Colors', value: wardrobeLoading ? '—' : String(totalColors), color: 'var(--color-success)' },
    { icon: UserCircle, label: 'Style Profile', value: user?.onboardingCompleted ? 'Complete' : 'Not set up', color: 'var(--color-warning)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="section">
        <h1 className="page-header__title">Welcome back, {firstName}</h1>
        <p className="page-header__subtitle">Let&apos;s make your next outfit your best one.</p>
      </div>

      {/* Weather + Stats Row */}
      <div className="dashboard-top-grid section">
        <WeatherWidget
          weather={weather}
          loading={weatherLoading}
          city={weatherCity}
          onRefresh={() => fetchWeather(weatherCity || 'Bangalore')}
        />
        <div className="grid grid--stats">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="stat-card">
              <div className="stat-card__icon" style={{ background: `${color}22`, color }}>
                <Icon size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="stat-card__label">{label}</p>
                <p className="stat-card__value">{value}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section__title">Quick Actions</h2>
        <div className="quick-actions">
          <Button variant="outline" onClick={() => navigate('/wardrobe')}>
            <Plus size={16} /> Add Wardrobe Item
          </Button>
          <Button variant="outline" onClick={() => navigate('/outfits')}>
            <Wand2 size={16} /> Get Outfit Ideas
          </Button>
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <UserCircle size={16} /> Update Profile
          </Button>
          {weather?.found && (
            <Button variant="outline" onClick={() => navigate('/outfits')}>
              <Sun size={16} /> Weather-Based Outfit
            </Button>
          )}
        </div>
      </div>

      {/* Wardrobe Analytics */}
      {!wardrobeLoading && <WardrobeAnalytics items={items} />}

      {/* Recently Added */}
      <div className="section">
        <h2 className="section__title">Recently Added</h2>
        {recentItems.length === 0 ? (
          <EmptyState
            icon={Shirt}
            title="Your wardrobe is empty"
            description="Add your first clothing item to start getting personalized outfit recommendations."
            actionLabel="Add Item"
            onAction={() => navigate('/wardrobe')}
          />
        ) : (
          <div className="grid grid--cards">
            {recentItems.map((item) => (
              <Card key={item._id} padding={false} hover style={{ overflow: 'hidden' }}>
                <div className="clothing-card__image-wrap">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="clothing-card__image" />
                  ) : (
                    <Shirt size={28} color="var(--text-muted)" />
                  )}
                </div>
                <div className="clothing-card__body">
                  <p className="clothing-card__name">{item.name}</p>
                  <p className="clothing-card__category">{item.category}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Explore All Features */}
      <div className="section">
        <h2 className="section__title">Explore All Features</h2>
        <div className="feature-grid">
          {quickLinks.map(({ to, label, icon: Icon }) => (
            <Card key={to} hover className="feature-tile" onClick={() => navigate(to)} style={{ cursor: 'pointer' }}>
              <div className="feature-tile__icon"><Icon size={20} /></div>
              <h3 className="feature-tile__title">{label}</h3>
              <ArrowRight size={14} color="var(--text-muted)" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
