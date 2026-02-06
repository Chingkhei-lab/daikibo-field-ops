import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, CheckCircle2, Circle, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Farm } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Fixed demo officer location in Jaipur (same as NavigationView)
const DEMO_OFFICER_LOCATION = {
    lat: 26.7500, // Moved South to increase distance
    lng: 75.6500  // Moved West
};

export function TodaysFarms() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchTodaysFarms();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

    const fetchTodaysFarms = async () => {
        try {
            const token = useAuthStore.getState().token;
            const res = await fetch(`${API_URL}/farms/today/${user?.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setFarms(data);
            }
        } catch (err) {
            console.error('Failed to fetch farms', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate distance from fixed demo officer location
    const calculateDistance = (farm: any) => {
        const R = 6371e3; // metres (Earth's radius)
        const lat1 = DEMO_OFFICER_LOCATION.lat * Math.PI / 180;
        const lat2 = farm.location.coordinates[1] * Math.PI / 180;
        const dLat = (farm.location.coordinates[1] - DEMO_OFFICER_LOCATION.lat) * Math.PI / 180;
        const dLon = (farm.location.coordinates[0] - DEMO_OFFICER_LOCATION.lng) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // in meters
        return (d / 1000).toFixed(1); // km
    };

    if (loading) return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg border border-gray-200" />
            ))}
        </div>
    );

    // Demo farms for display when no real data (matching NavigationView)
    const displayFarms = farms.length > 0 ? farms : [
        {
            id: 'demo-farm-1',
            name: 'Sharma Farm',
            village: 'Rajpur Village',
            status: 'pending',
            location: { type: 'Point', coordinates: [75.8273, 26.9524] }
        },
        {
            id: 'demo-farm-2',
            name: 'Patel Agriculture',
            village: 'Kishangarh',
            status: 'pending',
            location: { type: 'Point', coordinates: [75.8573, 26.8824] }
        }
    ] as any[];

    const displayCompletedCount = displayFarms.filter((f: any) => f.status === 'visited').length;
    const displayProgress = displayFarms.length ? (displayCompletedCount / displayFarms.length) * 100 : 0;

    if (displayFarms.length === 0) return null;

    return (
        <Card className="p-5 mb-6 border-l-4 border-l-blue-600 shadow-md">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        {t('farms.todaysAssignedRoute')}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {t('farms.locationsVisited', { completed: displayCompletedCount, total: displayFarms.length })}
                    </p>
                </div>
            </div>

            <Progress value={displayProgress} className="h-2 mb-4" />

            <div className="space-y-3">
                {displayFarms.map((farm) => {
                    const isCompleted = farm.status === 'visited';
                    const distance = calculateDistance(farm);

                    return (
                        <div
                            key={farm.id}
                            className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors
                                ${isCompleted ? 'bg-gray-50 opacity-75' : 'bg-white border-gray-100'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                            {farm.name}
                                        </h4>
                                        <p className="text-xs text-gray-500">{farm.village}</p>
                                        {/* Distance always shown */}
                                        {!isCompleted && (
                                            <span className="text-xs text-blue-600 font-medium flex items-center mt-1 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {t('farms.kmAway', { distance })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!isCompleted && (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
                                    onClick={() => navigate('/navigation', { state: { selectedFarmId: farm.id, mode: 'singleFarm' } })}
                                >
                                    <Navigation className="h-4 w-4 mr-2" />
                                    {t('farms.startNavigation')}
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
