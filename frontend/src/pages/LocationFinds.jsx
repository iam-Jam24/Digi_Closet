import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { LocateFixed, MapPin, MapPinned, RefreshCw, Search, Store, ShieldCheck } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';
import useNearbyStores from '../hooks/useNearbyStores';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import StoreCard from '../components/StoreCard';
import StoreDetails from '../components/StoreDetails';
import { STORE_CATEGORIES, SEARCH_RADIUS_KM } from '../constants/locationFinds';
import '../styles/location-finds.css';

// Leaflet is only downloaded once there are results to show.
const NearbyStoresMap = lazy(() => import('../components/NearbyStoresMap'));

const SORTS = [
  { id: 'nearest', label: 'Nearest first' },
  { id: 'relevant', label: 'Most relevant' },
  { id: 'rating', label: 'Highest rated', needsRatings: true },
];

const SORTERS = {
  nearest: (a, b) => a.distanceKm - b.distanceKm,
  relevant: (a, b) => b.relevance - a.relevance || a.distanceKm - b.distanceKm,
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.distanceKm - b.distanceKm,
};

function PlaceSearch({ value, onChange, onSubmit, disabled, inputRef, compact = false }) {
  return (
    <form className={`lf-place ${compact ? 'lf-place--compact' : ''}`} onSubmit={onSubmit}>
      <Input
        ref={inputRef}
        icon={MapPin}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="City, area, landmark or PIN code"
        aria-label="City, area, landmark or PIN code"
        maxLength={120}
      />
      <Button type="submit" variant="outline" disabled={disabled || value.trim().length < 2}>
        <Search size={15} /> Search
      </Button>
    </form>
  );
}

export default function LocationFinds() {
  const { locate, locating, error: locationError, clearError } = useGeolocation();
  const { result, center, loading, error, search, refresh } = useNearbyStores();

  const [place, setPlace] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('nearest');
  const [selectedId, setSelectedId] = useState(null);
  const [detailsStore, setDetailsStore] = useState(null);
  const placeInputRef = useRef(null);

  const busy = locating || loading;

  const resetView = () => {
    setFilter('all');
    setSelectedId(null);
    setDetailsStore(null);
  };

  const handleUseLocation = async () => {
    const point = await locate();
    if (point) {
      resetView();
      search(point);
    } else {
      placeInputRef.current?.focus();
    }
  };

  const handlePlaceSubmit = (e) => {
    e.preventDefault();
    const q = place.trim();
    if (q.length < 2) return;
    clearError();
    resetView();
    search({ q });
  };

  const categoryLabels = useMemo(
    () => Object.fromEntries((result?.categories || []).map((c) => [c.id, c.label])),
    [result],
  );

  const counts = useMemo(() => {
    const tally = {};
    (result?.stores || []).forEach((s) => s.categories.forEach((id) => { tally[id] = (tally[id] || 0) + 1; }));
    return tally;
  }, [result]);

  const sorts = SORTS.filter((s) => !s.needsRatings || result?.hasRatings);
  const activeSort = sorts.some((s) => s.id === sort) ? sort : 'nearest';

  const visibleStores = useMemo(() => {
    const stores = (result?.stores || []).filter((s) => filter === 'all' || s.categories.includes(filter));
    return stores.sort(SORTERS[activeSort]);
  }, [result, filter, activeSort]);

  const chooseFilter = (id) => {
    setFilter(id);
    setSelectedId(null);
  };

  const locationLabel = center?.label ? `Near ${center.label}` : 'Near your current location';
  const radiusKm = result?.radiusKm ?? SEARCH_RADIUS_KM;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Discover"
        title="The outfit you need, around the corner."
        subtitle="Clothing stores, boutiques and ethnic-wear shops within 5 km, for when it can’t wait for delivery."
        image="/images/editorial/neutral-rail.jpg"
        variant="reverse"
      />

      {!result && !loading && (
        <Card className="lf-intro section">
          <div className="lf-intro__icon"><MapPinned size={26} strokeWidth={1.4} /></div>
          <h2 className="lf-intro__title">Find fashion stores around you.</h2>
          <p className="lf-intro__text">
            Discover clothing stores, boutiques and fashion outlets within {SEARCH_RADIUS_KM} km of your location.
          </p>
          <Button size="lg" onClick={handleUseLocation} loading={locating} disabled={busy}>
            {!locating && <LocateFixed size={16} />} {locating ? 'Finding your location…' : 'Use my current location'}
          </Button>

          {locationError && <div className="alert alert--error lf-intro__alert" role="alert">{locationError}</div>}

          <div className="lf-intro__divider"><span>or search a place</span></div>
          <PlaceSearch value={place} onChange={setPlace} onSubmit={handlePlaceSubmit} disabled={busy} inputRef={placeInputRef} />

          <p className="lf-intro__privacy">
            <ShieldCheck size={13} aria-hidden="true" />
            Your location is only used for this search and is never saved. Store lookups go to OpenStreetMap with your position rounded to about 100 m.
          </p>
        </Card>
      )}

      {error && (
        <div className="alert alert--error section" role="alert">
          {error}
          {result && <button className="link-button" onClick={refresh}>Try again</button>}
        </div>
      )}

      {loading && !result && (
        <div className="lf-loading section" role="status">
          <LoadingSpinner />
          Looking for fashion stores within {SEARCH_RADIUS_KM} km…
        </div>
      )}

      {result && (
        <>
          <section className="lf-toolbar section">
            <div className="lf-toolbar__where">
              <span className="eyebrow">{locationLabel}</span>
              <p className="lf-toolbar__radius">
                Showing fashion stores within {radiusKm} km
                {result.count > 0 && <> · {result.count} {result.count === 1 ? 'store' : 'stores'}</>}
              </p>
              {result.totalFound > result.count && (
                <p className="lf-toolbar__note">
                  {result.totalFound} stores are listed in this area. These are the {result.count} with the clearest details.
                </p>
              )}
            </div>
            <div className="lf-toolbar__actions">
              <PlaceSearch value={place} onChange={setPlace} onSubmit={handlePlaceSubmit} disabled={busy} inputRef={placeInputRef} compact />
              <Button variant="outline" onClick={handleUseLocation} loading={locating} disabled={busy} aria-label="Use my current location">
                {!locating && <LocateFixed size={15} />} My location
              </Button>
              <Button variant="ghost" onClick={refresh} loading={loading} disabled={busy} aria-label="Refresh results">
                {!loading && <RefreshCw size={15} />} Refresh
              </Button>
            </div>
            {locationError && <div className="alert alert--error lf-toolbar__alert" role="alert">{locationError}</div>}
          </section>

          {result.count === 0 ? (
            <EmptyState
              icon={Store}
              title={`No fashion stores found within ${radiusKm} km`}
              description={`OpenStreetMap doesn’t list any clothing stores within ${radiusKm} km of ${center?.label || 'this location'}. Try a nearby market, area or PIN code.`}
              actionLabel="Try another location"
              onAction={() => placeInputRef.current?.focus()}
            />
          ) : (
            <>
              <div className="filter-bar lf-filters" role="toolbar" aria-label="Filter by category">
                <button
                  className={`filter-chip ${filter === 'all' ? 'filter-chip--active' : ''}`}
                  aria-pressed={filter === 'all'}
                  onClick={() => chooseFilter('all')}
                >
                  All <span className="lf-chip__count">{result.count}</span>
                </button>
                {STORE_CATEGORIES.filter((c) => counts[c.id]).map((c) => (
                  <button
                    key={c.id}
                    className={`filter-chip ${filter === c.id ? 'filter-chip--active' : ''}`}
                    aria-pressed={filter === c.id}
                    onClick={() => chooseFilter(c.id)}
                    style={{ '--pin': c.color }}
                  >
                    <span className="lf-dot" aria-hidden="true" /> {c.short} <span className="lf-chip__count">{counts[c.id]}</span>
                  </button>
                ))}
              </div>

              <div className={`lf-results ${loading ? 'lf-results--loading' : ''}`}>
                <div className="lf-map-wrap">
                  <Suspense fallback={<div className="lf-map lf-map--loading"><LoadingSpinner size="sm" /></div>}>
                    <NearbyStoresMap
                      center={center}
                      radiusKm={radiusKm}
                      stores={visibleStores}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onOpenDetails={setDetailsStore}
                      categoryLabels={categoryLabels}
                    />
                  </Suspense>
                </div>

                <div className="lf-list">
                  <div className="lf-list__header">
                    <p className="lf-list__count">
                      {visibleStores.length} {visibleStores.length === 1 ? 'store' : 'stores'}
                      {filter !== 'all' && <> · {STORE_CATEGORIES.find((c) => c.id === filter)?.short}</>}
                    </p>
                    {sorts.length > 1 && (
                      <div className="filter-bar filter-bar--compact" role="radiogroup" aria-label="Sort stores">
                        {sorts.map((s) => (
                          <button
                            key={s.id}
                            role="radio"
                            aria-checked={activeSort === s.id}
                            className={`filter-chip ${activeSort === s.id ? 'filter-chip--active' : ''}`}
                            onClick={() => setSort(s.id)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lf-list__items">
                    {visibleStores.map((store) => (
                      <StoreCard
                        key={store.id}
                        store={store}
                        categoryLabels={categoryLabels}
                        selected={store.id === selectedId}
                        onSelect={setSelectedId}
                        onOpenDetails={setDetailsStore}
                      />
                    ))}
                  </div>

                  {result.source && (
                    <p className="lf-list__source">
                      Store data <a href={result.source.url} target="_blank" rel="noopener noreferrer">{result.source.label}</a>.
                      Categories are worked out from each store’s listing and name.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <StoreDetails
        key={detailsStore?.id || 'none'}
        store={detailsStore}
        categoryLabels={categoryLabels}
        source={result?.source}
        onClose={() => setDetailsStore(null)}
      />
    </div>
  );
}
