import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATEGORY_BY_ID } from '../constants/locationFinds';
import { formatDistance } from '../utils/location';

// Any XYZ raster tile service; defaults to the standard OpenStreetMap tiles.
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION
  || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const iconCache = new Map();
function storeIcon(categoryId, selected) {
  const key = `${categoryId}:${selected}`;
  if (!iconCache.has(key)) {
    const color = CATEGORY_BY_ID[categoryId]?.color || CATEGORY_BY_ID['all-fashion'].color;
    iconCache.set(key, L.divIcon({
      className: `lf-marker${selected ? ' lf-marker--selected' : ''}`,
      html: `<span class="lf-marker__pin" style="--pin:${color}"></span>`,
      iconSize: selected ? [34, 34] : [26, 26],
      iconAnchor: selected ? [17, 34] : [13, 26],
      popupAnchor: [0, selected ? -30 : -22],
    }));
  }
  return iconCache.get(key);
}

const youIcon = L.divIcon({
  className: 'lf-you',
  html: '<span class="lf-you__dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Frames the whole search circle whenever the search point changes.
function FitRadius({ center, radiusKm }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radiusKm * 2000), { padding: [12, 12] });
  }, [map, center.lat, center.lng, radiusKm]);
  return null;
}

// Pans to the selected store and opens its popup.
function FocusSelected({ store, markerRefs }) {
  const map = useMap();
  const id = store?.id;
  const lat = store?.location.lat;
  const lng = store?.location.lng;
  useEffect(() => {
    if (!id) return;
    map.panTo([lat, lng], { animate: true });
    markerRefs.current.get(id)?.openPopup();
  }, [map, id, lat, lng, markerRefs]);
  return null;
}

export default function NearbyStoresMap({ center, radiusKm, stores, selectedId, onSelect, onOpenDetails, categoryLabels }) {
  const markerRefs = useRef(new Map());
  const selected = useMemo(() => stores.find((s) => s.id === selectedId) || null, [stores, selectedId]);

  return (
    <MapContainer
      className="lf-map"
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={false}
      aria-label="Map of nearby fashion stores"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
      <FitRadius center={center} radiusKm={radiusKm} />
      <FocusSelected store={selected} markerRefs={markerRefs} />

      <Circle
        center={[center.lat, center.lng]}
        radius={radiusKm * 1000}
        pathOptions={{ color: '#6D6855', weight: 1.5, dashArray: '6 6', fillColor: '#6D6855', fillOpacity: 0.05 }}
      />
      <Marker position={[center.lat, center.lng]} icon={youIcon} keyboard={false} zIndexOffset={-100}>
        <Popup>{center.label ? `Searching around ${center.label}` : 'You are here'}</Popup>
      </Marker>

      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.location.lat, store.location.lng]}
          icon={storeIcon(store.primaryCategory, store.id === selectedId)}
          zIndexOffset={store.id === selectedId ? 1000 : 0}
          title={store.name}
          ref={(marker) => {
            if (marker) markerRefs.current.set(store.id, marker);
            else markerRefs.current.delete(store.id);
          }}
          eventHandlers={{ click: () => onSelect(store.id) }}
        >
          <Popup>
            <div className="lf-popup">
              <span className="lf-popup__category">{categoryLabels[store.primaryCategory]}</span>
              <strong className="lf-popup__name">{store.name}</strong>
              <span className="lf-popup__distance">{formatDistance(store.distanceKm)} away</span>
              <button type="button" className="lf-popup__action" onClick={() => onOpenDetails(store)}>
                View details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
