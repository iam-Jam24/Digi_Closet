import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Heart, Check, RefreshCw, Shirt, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useWardrobe from '../hooks/useWardrobe';
import useOutfits from '../hooks/useOutfits';
import useWeather from '../hooks/useWeather';
import usePlanner from '../hooks/usePlanner';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';
import { SLOT_BY_CATEGORY, SLOT_LABELS, sortBySlot } from '../constants/wardrobe';
import { todayISO } from '../utils/dates';
import '../styles/dashboard.css';

const img = (name) => `/images/editorial/${name}.jpg`;
const outfitsFor = (params) => `/outfits?${new URLSearchParams(params)}`;

// Each tile opens the Outfit Generator with the style and/or occasion preset.
const TODAY = [
  { label: 'Casual wear', to: outfitsFor({ style: 'Casual' }), image: img('studio-grey-blazer-woman') },
  { label: 'Smart casual', to: outfitsFor({ style: 'Smart Casual' }), image: img('studio-blazers-duo') },
  { label: 'Streetwear', to: outfitsFor({ style: 'Streetwear' }), image: img('studio-street-black') },
  { label: 'Formal wear', to: outfitsFor({ style: 'Formal' }), image: img('studio-suit-mono') },
  { label: 'Minimal style', to: outfitsFor({ style: 'Minimal' }), image: img('studio-camel-coat') },
  { label: 'Weekend looks', to: outfitsFor({ occasion: 'Casual' }), image: img('studio-oversized-tee') },
];

const EXPLORE = [
  { label: 'Minimalist', note: 'Fewer pieces, better lines.', to: outfitsFor({ style: 'Minimal' }), image: img('studio-beige-suit') },
  { label: 'Old Money', note: 'Quiet tailoring, warm neutrals.', to: outfitsFor({ style: 'Classic' }), image: img('studio-cream-suit-seated') },
  { label: 'Streetwear', note: 'Relaxed shapes with an edge.', to: outfitsFor({ style: 'Streetwear' }), image: img('studio-cream-puffer') },
  { label: 'Casual', note: 'Denim, cotton, ease.', to: outfitsFor({ style: 'Casual' }), image: img('studio-cable-knit') },
  { label: 'Business Casual', note: 'Sharp, without the tie.', to: outfitsFor({ style: 'Smart Casual', occasion: 'Office' }), image: img('studio-knit-trousers-chair') },
  { label: 'Contemporary', note: 'Clean shapes for the evening.', to: outfitsFor({ style: 'Minimal', occasion: 'Party' }), image: img('studio-cream-set-coral') },
];

// Editorial inspiration: each story opens the generator in its direction.
const STYLE_EDIT = [
  { kicker: 'Evening', title: 'One dark, dramatic piece is enough.', text: 'Let a single silhouette lead and keep everything around it quiet.', to: outfitsFor({ occasion: 'Party' }), image: img('black-gown'), feature: true },
  { kicker: 'Layering', title: 'Knit on knit, in three tones.', text: 'Cream, camel and chocolate stack without ever clashing.', to: outfitsFor({ style: 'Minimal' }), image: img('flatlay-knitwear') },
  { kicker: 'Accessories', title: 'Finish with metal, not more clothes.', text: 'A ring and a watch do more than another layer.', to: '/makeover', image: img('jewellery-flatlay') },
  { kicker: 'Season', title: 'The ankle boot carries autumn.', text: 'Brown leather works with denim, tailoring and knit dresses alike.', to: outfitsFor({ style: 'Smart Casual' }), image: img('ankle-boots') },
  { kicker: 'Tailoring', title: 'Soft shoulders, sharp intent.', text: 'Unstructured jackets make tailoring feel like your own.', to: outfitsFor({ style: 'Formal' }), image: img('suits-rail') },
];

const QUICK = [
  { label: 'Create your next look', to: '/outfits', image: img('flatlay-blazer') },
  { label: 'Try a new look', to: '/try-on', image: img('black-blazer-hanger') },
  { label: 'Elevate my style', to: '/makeover', image: img('watch-hand') },
  { label: 'Find something new', to: '/shopping/finder', image: img('colour-rail') },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Detected location if allowed, otherwise Bengaluru (the app's default city).
function useLocalWeather() {
  const { weather, fetchWeather } = useWeather();
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      fetchWeather('Bengaluru');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => fetchWeather('Bengaluru'),
      { timeout: 5000 }
    );
  }, [fetchWeather]);
  return weather;
}

function FeaturedOutfit({ outfit, source, onFavorite, onWear, worn, busy }) {
  const pieces = sortBySlot(outfit.clothingItems || []);
  return (
    <div className="featured">
      <figure className="featured__image img-zoom">
        <img src={img('camel-coat-studio')} alt="" />
        <figcaption>Editorial mood. Your pieces are listed alongside.</figcaption>
      </figure>
      <div className="featured__panel">
        <span className="eyebrow">{source}</span>
        <h3 className="featured__title">{outfit.title}</h3>
        {(outfit.styleCategory || outfit.occasion) && (
          <p className="featured__meta">{[outfit.styleCategory, outfit.occasion].filter(Boolean).join(' · ')}</p>
        )}
        {outfit.explanation && <p className="featured__text">{outfit.explanation}</p>}
        <ul className="featured__pieces">
          {pieces.map((item) => (
            <li key={item._id}>
              <span className="featured__thumb">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Shirt size={18} strokeWidth={1.25} />}</span>
              <span className="featured__piece">
                <small>{SLOT_LABELS[SLOT_BY_CATEGORY[item.category]] || item.category}</small>
                {item.name}
              </span>
            </li>
          ))}
        </ul>
        <div className="featured__actions">
          <button type="button" className="btn btn--dark btn--md" onClick={onWear} disabled={busy || worn}>
            <Check size={14} /> {worn ? 'Worn today' : 'Wear this look'}
          </button>
          <button type="button" className={`btn btn--outline btn--md ${outfit.favorite ? 'is-on' : ''}`} onClick={onFavorite} disabled={busy} aria-pressed={!!outfit.favorite}>
            <Heart size={14} fill={outfit.favorite ? 'currentColor' : 'none'} /> {outfit.favorite ? 'Saved' : 'Save look'}
          </button>
          <Link to="/recommendations" className="link-arrow"><RefreshCw size={13} /> Generate again</Link>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, firebaseUser } = useAuth();
  const { showToast } = useToast();
  const { items, loading: wardrobeLoading } = useWardrobe();
  const { saved: savedOutfits, loading: outfitsLoading, toggleFavorite } = useOutfits();
  const weather = useLocalWeather();
  const today = todayISO();
  const { plans, loading: planLoading, assign, setWorn } = usePlanner(today, today);
  const [savedLookCount, setSavedLookCount] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/looks').then(({ data }) => setSavedLookCount(data.data.looks.length)).catch(() => setSavedLookCount(null));
  }, []);

  // Names derived from an email address arrive in lower case; capitalise for display.
  const rawFirst = (user?.name || firebaseUser?.displayName || '').split(' ')[0] || 'there';
  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
  const todaysPlan = plans[today];

  // Today's plan first, then a favourite, then the most recently saved outfit.
  // Favourite state always comes from the saved list so the toggle stays current.
  const featured = useMemo(() => {
    const fromList = (id) => savedOutfits.find((o) => o._id === id);
    if (todaysPlan?.outfit) return { outfit: fromList(todaysPlan.outfit._id) || todaysPlan.outfit, source: 'Planned for today' };
    const favorite = savedOutfits.find((o) => o.favorite);
    if (favorite) return { outfit: favorite, source: 'From your favourites' };
    if (savedOutfits[0]) return { outfit: savedOutfits[0], source: 'Recently saved' };
    return null;
  }, [todaysPlan, savedOutfits]);

  const addedThisWeek = useMemo(() => {
    const since = new Date().getTime() - WEEK_MS;
    return items.filter((item) => new Date(item.createdAt).getTime() > since).length;
  }, [items]);

  const run = async (action, success, failure) => {
    setBusy(true);
    try {
      await action();
      showToast(success, 'success');
    } catch (err) {
      showToast(getErrorMessage(err, failure), 'error');
    } finally {
      setBusy(false);
    }
  };

  const wearToday = () => run(async () => {
    if (todaysPlan?.outfit?._id !== featured.outfit._id) await assign(today, featured.outfit._id, featured.outfit.occasion || null);
    await setWorn(today, true);
  }, 'Enjoy it. Logged as worn today.', 'Could not log this look.');

  const show = (value, loading) => (loading || value === null ? '—' : value);
  const snapshot = [
    { value: show(items.length, wardrobeLoading), label: 'Pieces', to: '/wardrobe' },
    { value: show(savedLookCount, false), label: 'Saved looks', to: '/saved' },
    { value: show(savedOutfits.filter((o) => o.favorite).length, outfitsLoading), label: 'Favourite outfits', to: '/saved' },
    { value: show(addedThisWeek, wardrobeLoading), label: 'Added this week', to: '/wardrobe' },
  ];

  return (
    <div className="studio animate-fade-in">
      {/* Greeting */}
      <header className="studio-greeting">
        <div>
          <span className="eyebrow">Your personal style studio</span>
          <h1 className="studio-greeting__title">
            <span className="studio-greeting__lead-in">{greeting()},</span>
            <span className="studio-greeting__name">{firstName}.</span>
          </h1>
          <p className="studio-greeting__lead">Something great is waiting in your wardrobe.</p>
        </div>
        <dl className="studio-greeting__meta">
          <div><dt>Today</dt><dd>{dateLabel.format(new Date())}</dd></div>
          {weather?.found && (
            <div><dt>{weather.city}</dt><dd>{Math.round(weather.temperatureC)}°C · {weather.condition}</dd></div>
          )}
        </dl>
      </header>

      {/* Editorial hero */}
      <section className="studio-hero">
        <div className="studio-hero__image img-zoom"><img src={img('black-white-tees-duo')} alt="Two people in black and white oversized T-shirts against a white wall" /></div>
        <div className="studio-hero__text">
          <span className="eyebrow">Made for your everyday</span>
          <h2 className="studio-hero__title">Your wardrobe.<br /><em>Your expression.</em></h2>
          <p>Discover new ways to wear what you already own.</p>
          <Link to="/outfits" className="btn btn--outline btn--md">Create an outfit</Link>
        </div>
      </section>

      {/* Snapshot */}
      <section className="snapshot" aria-label="Wardrobe snapshot">
        <p className="snapshot__line">
          {wardrobeLoading ? '' : items.length ? <>{items.length} pieces. <em>Endless possibilities.</em></> : <>An empty wardrobe. <em>A fresh start.</em></>}
        </p>
        <dl className="snapshot__stats">
          {snapshot.map(({ value, label, to }) => (
            <Link key={label} to={to} className="snapshot__stat"><dd>{value}</dd><dt>{label}</dt></Link>
          ))}
        </dl>
      </section>

      {/* Today's style inspiration */}
      <section className="studio-section">
        <header className="studio-section__head">
          <h2>Curated for your style</h2>
          <p>Choose a direction. The generator builds it from your own pieces.</p>
        </header>
        <div className="mosaic">
          {TODAY.map(({ label, to, image }) => (
            <Link key={label} to={to} className="mosaic__tile img-zoom">
              <img src={image} alt="" loading="lazy" />
              <span>{label}<ArrowUpRight size={16} strokeWidth={1.5} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended outfit */}
      <section className="studio-section">
        <header className="studio-section__head"><h2>Your look for today</h2></header>
        {outfitsLoading || planLoading ? (
          <div className="featured featured--loading" />
        ) : featured ? (
          <FeaturedOutfit
            outfit={featured.outfit}
            source={featured.source}
            busy={busy}
            worn={todaysPlan?.worn && todaysPlan.outfit?._id === featured.outfit._id}
            onFavorite={() => run(() => toggleFavorite(featured.outfit._id), featured.outfit.favorite ? 'Removed from saved looks.' : 'Look saved.', 'Could not save this look.')}
            onWear={wearToday}
          />
        ) : (
          <div className="featured-empty">
            <img src={img('camel-coat-studio')} alt="" />
            <div>
              <h3>Create your first look.</h3>
              <p>Generate an outfit from your wardrobe and save it. It will appear here each morning.</p>
              <Link to="/outfits" className="btn btn--dark btn--md">Create an outfit</Link>
            </div>
          </div>
        )}
      </section>

      {/* Explore your style */}
      <section className="studio-section">
        <header className="studio-section__head">
          <h2>Explore your style</h2>
          <p>Six directions, from quiet tailoring to street.</p>
        </header>
        <div className="explore-row">
          {EXPLORE.map(({ label, note, to, image }, index) => (
            <Link key={label} to={to} className="explore-card">
              <div className="explore-card__image img-zoom"><img src={image} alt="" loading="lazy" /></div>
              <span className="explore-card__number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{label}</h3>
              <p>{note}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently added */}
      <section className="studio-section">
        <header className="studio-section__head">
          <h2>New to your collection</h2>
          <div className="studio-section__links">
            <Link to="/wardrobe?add=1" className="link-arrow"><Plus size={13} /> Add a piece</Link>
            {items.length > 0 && <Link to="/wardrobe" className="link-arrow">Explore collection <ArrowRight size={13} /></Link>}
          </div>
        </header>
        {!wardrobeLoading && items.length === 0 ? (
          <Link to="/wardrobe?add=1" className="recent-empty">
            <Plus size={22} strokeWidth={1.25} />
            Add your first piece
          </Link>
        ) : (
          <ul className="recent">
            {items.slice(0, 5).map((item) => (
              <li key={item._id}>
                <Link to={`/wardrobe?search=${encodeURIComponent(item.name)}`} className="recent__item">
                  <div className="recent__image img-zoom">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <Shirt size={28} strokeWidth={1} />}</div>
                  <span className="recent__category">{item.category}</span>
                  <span className="recent__name">{item.name}</span>
                  {item.colors?.length > 0 && <span className="recent__colour">{item.colors.join(' / ')}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* The style edit */}
      <section className="style-edit">
        <header className="style-edit__head">
          <span className="eyebrow">Issue {new Date().toLocaleString('en-IN', { month: 'long' })}</span>
          <h2>The <em>style</em> edit</h2>
        </header>
        <div className="style-edit__grid">
          {STYLE_EDIT.map(({ kicker, title, text, to, image, feature }) => (
            <Link key={title} to={to} className={`edit-story ${feature ? 'edit-story--feature' : ''}`}>
              <div className="edit-story__image img-zoom"><img src={image} alt="" loading="lazy" /></div>
              <span className="edit-story__kicker">{kicker}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="studio-section">
        <div className="quick">
          {QUICK.map(({ label, to, image }) => (
            <Link key={label} to={to} className="quick__item">
              <div className="quick__image img-zoom"><img src={image} alt="" loading="lazy" /></div>
              <span>{label} <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
