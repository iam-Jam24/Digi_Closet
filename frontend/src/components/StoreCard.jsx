import { MapPin, Clock, Phone, Navigation, Star } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import { CATEGORY_BY_ID } from '../constants/locationFinds';
import { formatDistance, directionsUrl } from '../utils/location';

export default function StoreCard({ store, categoryLabels, selected, onSelect, onOpenDetails }) {
  const color = CATEGORY_BY_ID[store.primaryCategory]?.color;
  const otherCategories = store.categories.filter((id) => id !== store.primaryCategory);

  return (
    <article
      className={`card card--hover lf-store ${selected ? 'lf-store--selected' : ''}`}
      style={{ '--pin': color }}
      onClick={() => onSelect(store.id)}
    >
      <div className="lf-store__top">
        <span className="lf-store__category">
          <span className="lf-dot" aria-hidden="true" /> {categoryLabels[store.primaryCategory]}
        </span>
        <span className="lf-store__distance">{formatDistance(store.distanceKm)}</span>
      </div>

      <h3 className="lf-store__name">{store.name}</h3>

      {otherCategories.length > 0 && (
        <div className="lf-store__tags">
          {otherCategories.slice(0, 3).map((id) => (
            <Badge key={id} size="sm">{CATEGORY_BY_ID[id]?.short || categoryLabels[id]}</Badge>
          ))}
        </div>
      )}

      <ul className="lf-store__facts">
        <li className={store.address ? '' : 'lf-store__fact--muted'}>
          <MapPin size={13} aria-hidden="true" /> {store.address || 'Street address not listed'}
        </li>
        {store.rating != null && (
          <li>
            <Star size={13} aria-hidden="true" /> {store.rating.toFixed(1)}
            {store.ratingCount ? ` (${store.ratingCount} reviews)` : ''}
          </li>
        )}
        {store.openingHours && (
          <li><Clock size={13} aria-hidden="true" /> {store.openingHours}</li>
        )}
      </ul>

      <div className="lf-store__actions" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" onClick={() => onOpenDetails(store)}>View details</Button>
        <a className="btn btn--primary btn--sm" href={directionsUrl(store)} target="_blank" rel="noopener noreferrer">
          <Navigation size={13} /> Directions
        </a>
        {store.phone && (
          <a className="btn btn--ghost btn--sm" href={`tel:${store.phone.tel}`} aria-label={`Call ${store.name}`}>
            <Phone size={13} /> Call
          </a>
        )}
      </div>
    </article>
  );
}
