import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Location } from '@/types';
import gpsService from '@/services/gpsService';
import L from 'leaflet';
import axios from 'axios';

// Fix Leaflet default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationConfirmationProps {
  onConfirm: (location: Location) => void;
  onBack: () => void;
}

function DraggableMarker({ position, onDragEnd }: { position: [number, number], onDragEnd: (pos: L.LatLng) => void }) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          onDragEnd(marker.getLatLng());
        }
      },
    }),
    [onDragEnd],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

export function LocationConfirmation({ onConfirm, onBack }: LocationConfirmationProps) {
  const { t } = useTranslation();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');
  const [fetchingAddress, setFetchingAddress] = useState(false);

  useEffect(() => {
    const getLocation = async () => {
      try {
        setLoading(true);
        const position = await gpsService.getCurrentPosition();
        const initialLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setLocation(initialLocation);
        fetchAddress(initialLocation.latitude, initialLocation.longitude);
        setError(null);
      } catch (err) {
        setError('Could not get location. Please enable GPS.');
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      setFetchingAddress(true);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'OcammyFieldOps/1.0' } }
      );
      if (response.data && response.data.display_name) {
        setAddress(response.data.display_name);
      }
    } catch (error) {
      console.error('Failed to resolve address:', error);
      setAddress('Address could not be resolved');
    } finally {
      setFetchingAddress(false);
    }
  };

  const handleDragEnd = (newPos: L.LatLng) => {
    if (location) {
      const newLocation = {
        ...location,
        latitude: newPos.lat,
        longitude: newPos.lng,
        accuracy: 0, // Manual adjustment voids accuracy
      };
      setLocation(newLocation);
      fetchAddress(newPos.lat, newPos.lng);
    }
  };

  const handleConfirm = () => {
    if (location) {
      onConfirm(location);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-teal-600" />
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <MapPin className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-red-600">{error || 'Location not available'}</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="map-container relative h-[300px] sm:h-[400px] rounded-lg overflow-hidden border">
        <MapContainer
          center={[location.latitude, location.longitude]}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker
            position={[location.latitude, location.longitude]}
            onDragEnd={handleDragEnd}
          />
          {(location.accuracy || 0) > 0 && (
            <Circle
              center={[location.latitude, location.longitude]}
              radius={location.accuracy || 0}
              pathOptions={{ color: 'teal', fillColor: 'teal', fillOpacity: 0.1 }}
            />
          )}
        </MapContainer>

        {/* Instructions Overlay */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-md z-[400] text-xs font-medium text-gray-700 whitespace-nowrap">
          Drag pin to adjust location
        </div>

        {/* Accuracy Badge */}
        {(location.accuracy || 0) > 0 && (
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-md z-[400]">
            <div className="flex items-center gap-1 text-xs">
              <Navigation className="h-3 w-3 text-teal-600" />
              <span>±{Math.round(location.accuracy || 0)}m</span>
            </div>
          </div>
        )}
      </div>

      {/* Location Details */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Current Location</h4>
              {fetchingAddress ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Resolving address...
                </div>
              ) : (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {address || 'Address unknown'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
            <div>
              <span className="text-gray-500 block text-xs">LATITUDE</span>
              <span className="font-mono">{location.latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">LONGITUDE</span>
              <span className="font-mono">{location.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleConfirm} className="flex-1">
          <Check className="h-5 w-5 mr-2" />
          {t('activity.confirmLocation')}
        </Button>
      </div>
    </div>
  );
}
