import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { ArrowLeft, Navigation, MapPin, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Farm, Location } from '@/types';
import gpsService from '@/services/gpsService';
import { useAuthStore } from '@/stores/authStore';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const visitedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const activeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const pendingIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Blue icon for user location
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Demo officer location in Jaipur (fixed - no GPS needed for demo)
const DEMO_OFFICER_LOCATION: Location = {
    latitude: 26.9260,
    longitude: 75.7873,
    accuracy: 10,
    timestamp: Date.now()
};

function MapComponent({ center, zoom, isNavigating }: { center: [number, number], zoom: number, isNavigating?: boolean }) {
    const map = useMap();
    useEffect(() => {
        // Zoom in closer when navigation starts
        const navZoom = isNavigating ? 16 : zoom;
        map.flyTo(center, navZoom, { duration: 1.5 });
    }, [center, zoom, map, isNavigating]);
    return null;
}

export function NavigationView() {
    const navigate = useNavigate();
    const locationState = useLocation().state as {
        selectedFarmId?: string;
        mode?: 'viewAll' | 'singleFarm';
    };
    const user = useAuthStore(state => state.user);

    // Determine mode: viewAll (from View Map) or singleFarm (from Start Navigation)
    const viewMode = locationState?.mode || (locationState?.selectedFarmId ? 'singleFarm' : 'viewAll');

    const [farms, setFarms] = useState<Farm[]>([]);
    const [displayFarms, setDisplayFarms] = useState<Farm[]>([]);
    const [currentLocation, setCurrentLocation] = useState<Location>(DEMO_OFFICER_LOCATION);
    const [targetFarm, setTargetFarm] = useState<Farm | null>(null);
    const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const [routeSteps, setRouteSteps] = useState<{ instruction: string; distance: number; type: string; modifier: string; name: string }[]>([]);
    const [isNavigating, setIsNavigating] = useState(false);
    const [showGeofenceAlert, setShowGeofenceAlert] = useState(false);
    const [loading, setLoading] = useState(true);

    // Demo farms with real coordinates (Jaipur area, India)
    const demoFarms: Farm[] = [
        {
            id: 'demo-farm-1',
            name: 'Sharma Farm',
            village: 'Rajpur Village',
            contact_name: 'Ravi Sharma',
            contact_phone: '+91 9876543210',
            priority: 'High',
            status: 'pending',
            location: { type: 'Point', coordinates: [75.8273, 26.9524] }
        } as Farm,
        {
            id: 'demo-farm-2',
            name: 'Patel Agriculture',
            village: 'Kishangarh',
            contact_name: 'Anil Patel',
            contact_phone: '+91 9876543211',
            priority: 'Medium',
            status: 'pending',
            location: { type: 'Point', coordinates: [75.8573, 26.8824] }
        } as Farm
    ];

    // Fetch route from OSRM
    const fetchRoute = async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
                const coords: [number, number][] = route.geometry.coordinates.map(
                    (coord: [number, number]) => [coord[1], coord[0]]
                );
                setRouteCoordinates(coords);
                setRouteInfo({
                    distance: route.distance, // in meters
                    duration: route.duration  // in seconds
                });

                // Parse route steps for turn-by-turn navigation
                if (route.legs && route.legs[0] && route.legs[0].steps) {
                    const steps = route.legs[0].steps.map((step: any) => ({
                        instruction: step.maneuver?.instruction || step.name || 'Continue',
                        distance: step.distance,
                        type: step.maneuver?.type || 'straight', // turn, depart, arrive, etc.
                        modifier: step.maneuver?.modifier || '', // left, right, straight, etc.
                        name: step.name || ''
                    }));
                    setRouteSteps(steps);
                }
            }
        } catch (error) {
            console.error('Failed to fetch route:', error);
            // Fallback to straight line if routing fails
            setRouteCoordinates([
                [fromLat, fromLng],
                [toLat, toLng]
            ]);
        }
    };

    // Fetch Farms (with demo fallback)
    useEffect(() => {
        const loadFarms = async () => {
            try {
                if (user?.id) {
                    const res = await fetch(`${API_URL}/farms/today/${user.id}`);
                    const data = await res.json();
                    const farmsToUse = (Array.isArray(data) && data.length > 0) ? data : demoFarms;
                    setFarms(farmsToUse);
                } else {
                    setFarms(demoFarms);
                }
            } catch (err) {
                console.error(err);
                setFarms(demoFarms);
            } finally {
                setLoading(false);
            }
        };
        loadFarms();
    }, [user?.id]);

    // Set display farms and target based on mode
    useEffect(() => {
        if (farms.length === 0) return;

        if (viewMode === 'singleFarm' && locationState?.selectedFarmId) {
            const selectedFarm = farms.find(f => f.id === locationState.selectedFarmId);
            if (selectedFarm) {
                setDisplayFarms([selectedFarm]);
                setTargetFarm(selectedFarm);
            } else {
                // Fallback if not found
                setDisplayFarms(farms);
                setTargetFarm(farms.find(f => f.status === 'pending') || farms[0]);
            }
        } else {
            // View All mode
            setDisplayFarms(farms);
            setTargetFarm(farms.find(f => f.status === 'pending') || farms[0]);
        }
    }, [farms, viewMode, locationState?.selectedFarmId]);

    // Fetch route when target changes
    useEffect(() => {
        if (currentLocation && targetFarm) {
            const [targetLng, targetLat] = targetFarm.location.coordinates;

            // Calculate straight-line distance
            const dist = gpsService.calculateDistance(
                currentLocation.latitude, currentLocation.longitude,
                targetLat, targetLng
            );
            setDistanceToTarget(dist);

            // Fetch actual road route
            fetchRoute(
                currentLocation.latitude, currentLocation.longitude,
                targetLat, targetLng
            );

            setShowGeofenceAlert(dist < 100 && targetFarm.status !== 'visited');
        }
    }, [currentLocation, targetFarm]);

    const handleStartActivity = (farm: Farm) => {
        navigate('/activity', {
            state: {
                prefilled: {
                    village_name: farm.village,
                    person_name: farm.contact_name,
                    phone: farm.contact_phone
                }
            }
        });
    };

    if (loading) return <div className="flex items-center justify-center h-screen">Loading map...</div>;

    if (!displayFarms.length) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4 text-center">
            <div className="bg-gray-200 p-4 rounded-full mb-4">
                <MapPin className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">No Farms Assigned</h2>
            <p className="text-gray-500 mt-2">You don't have any farm visits scheduled for today.</p>
            <Button variant="outline" className="mt-6" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
            </Button>
        </div>
    );

    const center: [number, number] = [currentLocation.latitude, currentLocation.longitude];

    return (
        <div className="flex flex-col h-screen relative bg-gray-100">
            {/* Header */}
            <div className="bg-white p-4 shadow-md z-20 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h2 className="font-bold text-gray-900 leading-none">
                        {viewMode === 'viewAll' ? 'All Assigned Farms' : 'Navigation'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        {viewMode === 'viewAll'
                            ? `${displayFarms.length} farms to visit`
                            : (targetFarm ? `To: ${targetFarm.name}` : 'Route Completed')
                        }
                    </p>
                </div>
                <div className="ml-auto">
                    {targetFarm && routeInfo && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {(routeInfo.distance / 1000).toFixed(1)} km • {Math.ceil(routeInfo.duration / 60)} min
                        </Badge>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative z-0">
                <MapContainer
                    center={center}
                    zoom={viewMode === 'viewAll' ? 12 : 13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapComponent center={center} zoom={viewMode === 'viewAll' ? 12 : 14} isNavigating={isNavigating} />

                    {/* User Location (Demo Officer Location) */}
                    <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={userIcon}>
                        <Popup>
                            <div className="text-sm">
                                <span className="font-bold block">📍 Your Location</span>
                                <span className="text-gray-500">Jaipur, Rajasthan</span>
                            </div>
                        </Popup>
                    </Marker>
                    <Circle
                        center={[currentLocation.latitude, currentLocation.longitude]}
                        radius={50}
                        pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.2 }}
                    />

                    {/* Display Farms */}
                    {displayFarms.map(farm => {
                        const [lng, lat] = farm.location.coordinates;
                        const isTarget = targetFarm?.id === farm.id;
                        const isVisited = farm.status === 'visited';

                        return (
                            <Marker
                                key={farm.id}
                                position={[lat, lng]}
                                icon={isVisited ? visitedIcon : (isTarget ? activeIcon : pendingIcon)}
                                eventHandlers={{
                                    click: () => setTargetFarm(farm)
                                }}
                            >
                                <Popup>
                                    <div className="text-sm min-w-[150px]">
                                        <span className="font-bold block">{farm.name}</span>
                                        <span className="text-gray-500 block">{farm.village}</span>
                                        {!isTarget && (
                                            <Button
                                                size="sm"
                                                className="mt-2 w-full h-7 text-xs"
                                                onClick={() => setTargetFarm(farm)}
                                            >
                                                Navigate Here
                                            </Button>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Route Line (Actual Road Route from OSRM) */}
                    {routeCoordinates.length > 0 && (
                        <Polyline
                            positions={routeCoordinates}
                            pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }}
                        />
                    )}
                </MapContainer>

                {/* Google Maps Style Navigation UI */}
                {isNavigating && routeSteps.length > 0 && (
                    <>
                        {/* Main Direction Header - Green like Google Maps */}
                        <div className="absolute top-0 left-0 right-0 z-[1001]">
                            {/* Primary Direction */}
                            <div className="bg-[#1a7a4c] text-white px-4 py-3 flex items-center gap-4 shadow-lg">
                                {/* Direction Arrow */}
                                <div className="w-16 h-16 flex items-center justify-center">
                                    {routeSteps[0]?.modifier?.includes('left') ? (
                                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14 6v3l-4-4 4-4v3c4.42 0 8 3.58 8 8 0 1.57-.46 3.03-1.24 4.26l-1.46-1.46c.45-.83.7-1.79.7-2.8 0-3.31-2.69-6-6-6z" />
                                        </svg>
                                    ) : routeSteps[0]?.modifier?.includes('right') ? (
                                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M10 6V3L6 7l4 4V8c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C17.54 17.03 18 15.57 18 14c0-4.42-3.58-8-8-8z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                                        </svg>
                                    )}
                                </div>
                                {/* Direction Text */}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold leading-tight">
                                        {routeSteps[0]?.instruction || 'Head towards destination'}
                                    </h2>
                                </div>
                            </div>

                            {/* Then Indicator - Next Turn Preview */}
                            {routeSteps[1] && (
                                <div className="bg-[#145a3a] text-white/90 px-4 py-2 flex items-center gap-3">
                                    <span className="text-sm font-medium">Then</span>
                                    {routeSteps[1]?.modifier?.includes('left') ? (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14 6v3l-4-4 4-4v3c4.42 0 8 3.58 8 8 0 1.57-.46 3.03-1.24 4.26l-1.46-1.46c.45-.83.7-1.79.7-2.8 0-3.31-2.69-6-6-6z" />
                                        </svg>
                                    ) : routeSteps[1]?.modifier?.includes('right') ? (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M10 6V3L6 7l4 4V8c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C17.54 17.03 18 15.57 18 14c0-4.42-3.58-8-8-8z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Exit Button */}
                        <Button
                            variant="ghost"
                            className="absolute top-3 left-2 z-[1002] text-white hover:bg-white/20 p-2"
                            onClick={() => setIsNavigating(false)}
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </>
                )}

                {/* Re-centre Button */}
                {isNavigating && (
                    <Button
                        variant="outline"
                        className="absolute bottom-28 left-4 z-[1000] bg-white shadow-lg rounded-full h-12 px-4 border-0"
                        onClick={() => {
                            // Trigger map re-center
                            setIsNavigating(false);
                            setTimeout(() => setIsNavigating(true), 100);
                        }}
                    >
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                        </svg>
                        Re-centre
                    </Button>
                )}

                {/* Start Navigation Button (when not navigating) */}
                {!isNavigating && targetFarm && (
                    <Button
                        className="absolute top-4 right-4 z-[1000] bg-green-600 hover:bg-green-700 text-white shadow-lg h-12 px-6 rounded-full"
                        onClick={() => setIsNavigating(true)}
                    >
                        <Play className="h-5 w-5 mr-2" />
                        Start
                    </Button>
                )}

                {/* Bottom Panel - ETA and Distance */}
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.15)] z-[1000]">
                    {targetFarm ? (
                        <div className="p-4">
                            {/* Handle bar */}
                            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

                            {/* Main info row */}
                            <div className="flex items-center justify-between">
                                {/* Close button (when navigating) */}
                                {isNavigating && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full border border-gray-200"
                                        onClick={() => setIsNavigating(false)}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </Button>
                                )}

                                {/* Time and Distance */}
                                <div className={`flex-1 ${isNavigating ? 'text-center' : ''}`}>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-3xl font-bold text-green-600">
                                            {routeInfo ? Math.ceil(routeInfo.duration / 60) : Math.ceil(distanceToTarget / 500)}
                                        </span>
                                        <span className="text-xl text-green-600 font-medium">min</span>
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        {routeInfo
                                            ? `${(routeInfo.distance / 1000).toFixed(1)} km`
                                            : `${(distanceToTarget / 1000).toFixed(1)} km`
                                        }
                                        {routeInfo && ` • ETA ${new Date(Date.now() + routeInfo.duration * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                                    </p>
                                </div>

                                {/* Directions icon button */}
                                {isNavigating && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full border border-gray-200"
                                    >
                                        <Navigation className="w-5 h-5 text-gray-600" />
                                    </Button>
                                )}
                            </div>

                            {/* Destination name (when not navigating) */}
                            {!isNavigating && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">Destination</p>
                                    <h3 className="font-bold text-lg text-gray-900">{targetFarm.name}</h3>
                                    <p className="text-sm text-gray-500">{targetFarm.village}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-green-600 font-medium">
                            All farms visited! Good job.
                        </div>
                    )}
                </div>

                {/* Geofence Alert Modal */}
                {showGeofenceAlert && targetFarm && (
                    <div className="absolute bottom-32 left-4 right-4 bg-teal-900 text-white p-4 rounded-lg shadow-xl z-[1000] animate-in slide-in-from-bottom-5">
                        <div className="flex items-start gap-4">
                            <div className="bg-teal-700 p-2 rounded-lg">
                                <MapPin className="h-6 w-6 text-teal-200" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg">You've arrived!</h4>
                                <p className="text-teal-200 text-sm mb-3">
                                    You are within 100m of {targetFarm.name}.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        className="bg-white text-teal-900 hover:bg-gray-100 w-full"
                                        onClick={() => handleStartActivity(targetFarm)}
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Start Activity
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-teal-200 hover:text-white hover:bg-teal-800"
                                        onClick={() => setShowGeofenceAlert(false)}
                                    >
                                        Ignore
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
