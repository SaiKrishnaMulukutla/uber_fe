import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack/vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapProps {
  center: LatLng;
  zoom?: number;
  pickup?: LatLng | null;
  drop?: LatLng | null;
  driverLocation?: LatLng | null;
  onPickClick?: (latlng: LatLng) => void;
  className?: string;
}

function ClickHandler({ onClick }: { onClick?: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/743/743007.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export function Map({
  center,
  zoom = 13,
  pickup,
  drop,
  driverLocation,
  onPickClick,
  className = '',
}: MapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={`h-full w-full rounded-xl ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onClick={onPickClick} />
      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]}>
          <Popup>Pickup</Popup>
        </Marker>
      )}
      {drop && (
        <Marker position={[drop.lat, drop.lng]}>
          <Popup>Drop</Popup>
        </Marker>
      )}
      {driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
          <Popup>Driver</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
