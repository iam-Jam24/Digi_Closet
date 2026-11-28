import { useEffect, useState } from 'react';
import {
  MapPin, Clock, Phone, Globe, Mail, Navigation, Star, Info, CreditCard, Accessibility, AtSign, ExternalLink,
} from 'lucide-react';
import api from '../services/api';
import Modal from './Modal';
import Badge from './Badge';
import LoadingSpinner from './LoadingSpinner';
import { CATEGORY_BY_ID, CATEGORY_BASIS_NOTE } from '../constants/locationFinds';
import { formatDistance, directionsUrl } from '../utils/location';

const WHEELCHAIR = { yes: 'Wheelchair accessible', limited: 'Partly wheelchair accessible', no: 'Not wheelchair accessible' };

function Row({ icon: Icon, label, children }) {
  return (
    <div className="lf-details__row">
      <Icon size={15} aria-hidden="true" />
      <div>
        <span className="lf-details__label">{label}</span>
        <div className="lf-details__value">{children}</div>
      </div>
    </div>
  );
}

/**
 * Full store view. The list entry is shown straight away; the details
 * request then adds what only the store page needs (description, socials,
 * payments, accessibility, source link). Render with key={store.id} so each
 * store starts fresh.
 */
export default function StoreDetails({ store, categoryLabels, source, onClose }) {
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(Boolean(store));

  useEffect(() => {
    if (!store) return undefined;
    let cancelled = false;
    api.get(`/location-finds/stores/${encodeURIComponent(store.id)}`)
      .then(({ data }) => { if (!cancelled) setDetails(data.data.store); })
      // The list data is still shown; extras are simply left out.
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingDetails(false); });
    return () => { cancelled = true; };
  }, [store]);

  if (!store) return null;

  const info = { ...store, ...(details || {}), distanceKm: store.distanceKm };
  const extra = details?.details || {};

  return (
    <Modal isOpen onClose={onClose} title={info.name} size="md">
      <div className="lf-details">
        <div className="lf-details__categories">
          {info.categories.map((id) => (
            <Badge key={id} variant={id === info.primaryCategory ? 'dark' : 'default'}>
              <span className="lf-dot" style={{ '--pin': CATEGORY_BY_ID[id]?.color }} aria-hidden="true" />
              {categoryLabels[id]}
            </Badge>
          ))}
        </div>
        <p className="lf-details__basis">{CATEGORY_BASIS_NOTE[info.categoryBasis]}</p>

        {info.description && <p className="lf-details__description">{info.description}</p>}

        <div className="lf-details__actions">
          <a className="btn btn--primary btn--md" href={directionsUrl(info)} target="_blank" rel="noopener noreferrer">
            <Navigation size={15} /> Get directions
          </a>
          {info.phone && (
            <a className="btn btn--outline btn--md" href={`tel:${info.phone.tel}`}>
              <Phone size={15} /> Call store
            </a>
          )}
        </div>

        <div className="lf-details__rows">
          <Row icon={MapPin} label={`${formatDistance(info.distanceKm)} away`}>
            {info.address || 'The street address isn’t listed. Directions use the store’s map position.'}
          </Row>
          {info.rating != null && (
            <Row icon={Star} label="Rating">
              {info.rating.toFixed(1)}{info.ratingCount ? ` from ${info.ratingCount} reviews` : ''}
            </Row>
          )}
          {info.openingHours && (
            <Row icon={Clock} label="Opening hours, as listed">
              <code className="lf-details__hours">{info.openingHours}</code>
              {typeof info.openNow === 'boolean' && (
                <Badge size="sm" variant={info.openNow ? 'success' : 'default'}>{info.openNow ? 'Open now' : 'Closed now'}</Badge>
              )}
            </Row>
          )}
          {info.phone && (
            <Row icon={Phone} label="Phone">
              <a href={`tel:${info.phone.tel}`}>{info.phone.display}</a>
            </Row>
          )}
          {info.website && (
            <Row icon={Globe} label="Website">
              <a href={info.website} target="_blank" rel="noopener noreferrer">{new URL(info.website).hostname.replace(/^www\./, '')}</a>
            </Row>
          )}
          {extra.instagram && (
            <Row icon={AtSign} label="Instagram">
              <a href={extra.instagram} target="_blank" rel="noopener noreferrer">{extra.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</a>
            </Row>
          )}
          {extra.email && (
            <Row icon={Mail} label="Email"><a href={`mailto:${extra.email}`}>{extra.email}</a></Row>
          )}
          {extra.payments?.length > 0 && (
            <Row icon={CreditCard} label="Payment">{extra.payments.join(' · ')}</Row>
          )}
          {extra.wheelchair && (
            <Row icon={Accessibility} label="Access">{WHEELCHAIR[extra.wheelchair]}</Row>
          )}
          {loadingDetails && (
            <div className="lf-details__loading"><LoadingSpinner size="sm" /> Loading more details…</div>
          )}
        </div>

        <div className="lf-details__notice">
          <Info size={15} aria-hidden="true" />
          <p>
            Stock, sizes and prices aren’t listed here. Call the store before you go to check they have what you need
            {info.openingHours ? ', and to confirm today’s hours' : ''}.
          </p>
        </div>

        <p className="lf-details__source">
          Store data{' '}
          {source ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a> : 'from the map provider'}
          {extra.sourceUrl && (
            <> · <a href={extra.sourceUrl} target="_blank" rel="noopener noreferrer">View or correct this listing <ExternalLink size={11} /></a></>
          )}
        </p>
      </div>
    </Modal>
  );
}
