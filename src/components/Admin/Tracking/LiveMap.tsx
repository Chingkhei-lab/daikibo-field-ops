import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Battery, Navigation, Phone, Search, MapPin, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// --- Types ---
interface Officer {
    id: string;
    name: string;
    avatar: string;
    status: 'active' | 'idle' | 'offline' | 'error';
    location: { lat: number; lng: number };
    lastUpdate: string;
    battery: number;
    currentTask?: string;
    routeProgress?: string;
    phone: string;
}

// --- Custom Icons ---
const createIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const icons = {
    active: createIcon('green'),
    idle: createIcon('yellow'),
    offline: createIcon('red'),
    error: createIcon('red')
};

// --- Subcomponents ---

function MapUpdater({ center, zoom, focusKey }: { center: [number, number], zoom: number, focusKey: number }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0) {
            map.flyTo(center, zoom, {
                animate: true,
                duration: 1.5
            });
        }
    }, [focusKey, map]); // Only trigger when focusKey changes
    return null;
}

const DEMO_OFFICERS: Officer[] = [
    {
        id: 'demo-1',
        name: 'Arjun Meena',
        avatar: '',
        status: 'active',
        location: { lat: 26.9230, lng: 75.8050 },
        lastUpdate: '2 mins ago',
        battery: 88,
        currentTask: 'Village Meeting - Bassi',
        routeProgress: '65%',
        phone: '+91 98765 00001'
    },
    {
        id: 'demo-2',
        name: 'Priya Sharma',
        avatar: '',
        status: 'active',
        location: { lat: 26.8950, lng: 75.7650 },
        lastUpdate: 'Just now',
        battery: 94,
        currentTask: 'Sample Distribution',
        routeProgress: '40%',
        phone: '+91 98765 00002'
    },
    {
        id: 'demo-3',
        name: 'Vikram Singh',
        avatar: '',
        status: 'offline',
        location: { lat: 26.9420, lng: 75.8250 },
        lastUpdate: '1 hour ago',
        battery: 12,
        currentTask: 'Battery Low - Disconnected',
        routeProgress: '90%',
        phone: '+91 98765 00003'
    },
    {
        id: 'demo-4',
        name: 'Suresh Kumar',
        avatar: '',
        status: 'offline',
        location: { lat: 26.9120, lng: 75.7450 },
        lastUpdate: '45 mins ago',
        battery: 0,
        currentTask: 'Offline',
        routeProgress: '20%',
        phone: '+91 98765 00004'
    }
];

export function LiveMap() {
    const [officers, setOfficers] = useState<Officer[]>(DEMO_OFFICERS);
    const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
    const [focusKey, setFocusKey] = useState(0);
    const [filter, setFilter] = useState<'all' | 'active' | 'offline'>('all');
    const { token } = useAuthStore();

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const res = await axios.get('/api/admin/tracking', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    const realOfficers = res.data.data || [];
                    // Merge real officers with demo data, avoiding duplicates
                    const merged = [...realOfficers];
                    DEMO_OFFICERS.forEach(demo => {
                        if (!merged.find(o => o.id === demo.id)) {
                            merged.push(demo);
                        }
                    });
                    setOfficers(merged);
                }
            } catch (error) {
                console.error('Failed to fetch tracking data', error);
                setOfficers(DEMO_OFFICERS); // Fallback to demo data on error
            }
        };

        fetchTracking();
        const interval = setInterval(fetchTracking, 10000); // Update every 10s
        return () => clearInterval(interval);
    }, [token]);

    const handleSelectOfficer = (officer: Officer) => {
        setSelectedOfficer(officer);
        setFocusKey(prev => prev + 1); // Trigger map flyTo
    };

    const filteredOfficers = officers.filter(o => {
        if (filter === 'all') return true;
        return o.status === filter;
    });

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
            {/* Sidebar List */}
            <div className="w-80 bg-white border-r flex flex-col z-10 shadow-xl overflow-hidden">
                <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-xl tracking-tight text-gray-900 font-outfit">Live Tracking</h2>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="flex gap-2 mb-4">
                        <Badge
                            variant={filter === 'all' ? 'default' : 'outline'}
                            className={`cursor-pointer px-3 py-1 rounded-full transition-all ${filter === 'all' ? 'bg-teal-600' : 'hover:bg-gray-100'}`}
                            onClick={() => setFilter('all')}
                        >
                            All {officers.length}
                        </Badge>
                        <Badge
                            variant={filter === 'active' ? 'default' : 'outline'}
                            className={`cursor-pointer px-3 py-1 rounded-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-all ${filter === 'active' ? 'bg-green-600 text-white' : ''}`}
                            onClick={() => setFilter('active')}
                        >
                            Active
                        </Badge>
                        <Badge
                            variant={filter === 'offline' ? 'default' : 'outline'}
                            className={`cursor-pointer px-3 py-1 rounded-full bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-all ${filter === 'offline' ? 'bg-red-600 text-white' : ''}`}
                            onClick={() => setFilter('offline')}
                        >
                            Offline
                        </Badge>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-teal-500 transition-all"
                            placeholder="Find an officer..."
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
                    {filteredOfficers.map(officer => (
                        <div
                            key={officer.id}
                            onClick={() => handleSelectOfficer(officer)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all hover:translate-x-1 ${selectedOfficer?.id === officer.id ? 'border-teal-500 bg-white shadow-lg ring-1 ring-teal-500/20' : 'border-transparent bg-white shadow-sm'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${officer.name}&background=random`} />
                                        <AvatarFallback>{officer.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${officer.status === 'active' ? 'bg-green-500' :
                                        officer.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-gray-900 truncate">{officer.name}</h3>
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                        <MapPin className="h-3 w-3" />
                                        {officer.status === 'offline' ? 'Offline' : officer.currentTask || 'On Route'}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-gray-400">
                                        <Battery className={`h-3 w-3 ${officer.battery < 20 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                                        <span>{officer.battery}%</span>
                                    </div>
                                    {selectedOfficer?.id === officer.id && (
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-teal-600 mt-1">
                                            <Navigation className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredOfficers.length === 0 && (
                        <div className="text-center py-10">
                            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-gray-500 font-medium">No officers found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Map View */}
            <div className="flex-1 relative bg-gray-200">
                <MapContainer
                    center={[26.9124, 75.7873]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {selectedOfficer && (
                        <MapUpdater
                            center={[selectedOfficer.location.lat, selectedOfficer.location.lng]}
                            zoom={16}
                            focusKey={focusKey}
                        />
                    )}

                    {filteredOfficers.map(officer => (
                        <Marker
                            key={officer.id}
                            position={[officer.location.lat, officer.location.lng]}
                            icon={icons[officer.status]}
                            eventHandlers={{
                                click: () => handleSelectOfficer(officer)
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="p-2 min-w-[220px]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar className="h-10 w-10 border shadow-sm">
                                            <AvatarImage src={`https://ui-avatars.com/api/?name=${officer.name}&background=random`} />
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 leading-tight">{officer.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`h-1.5 w-1.5 rounded-full ${officer.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{officer.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="bg-gray-50 p-2 rounded-xl flex items-center justify-between border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Last Sync</span>
                                            <span className="text-[10px] font-bold text-gray-700">{officer.lastUpdate}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Current Activity</span>
                                            <span className="text-xs font-bold text-teal-700">{officer.currentTask || 'Patrolling Territory'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1 h-9 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20">
                                            <Phone className="h-3 w-3 mr-2" /> CALL
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-1 h-9 border-gray-200 hover:bg-gray-50 font-bold rounded-xl">
                                            HISTORY
                                        </Button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
                    <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/20 text-xs">
                        <div className="flex items-center gap-3 mb-2 font-bold text-gray-400 uppercase tracking-widest text-[9px]">
                            Navigation Controls
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                <span className="font-bold text-gray-700">Active - {officers.filter(o => o.status === 'active').length}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                <span className="font-bold text-gray-700">Offline - {officers.filter(o => o.status === 'offline').length}</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 font-medium">
                            Auto-refreshing live feed...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
