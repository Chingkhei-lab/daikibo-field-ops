import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, Phone, Leaf, ArrowLeft, ExternalLink, Calendar, Ruler, User, Info, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface Farm {
    id: string;
    name: string; // Changed from farmer_name based on schema
    farmer_name?: string;
    contact_name: string;
    phone_number: string;
    village_name: string;
    village?: string;
    type?: string;
    cattle_count: number;
    land_size?: number;
    status?: string;
    notes?: string;
    longitude?: number;
    latitude?: number;
    activity_count: number;
    created_at: string;
}

export function FarmList() {
    const navigate = useNavigate();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch farms
    useEffect(() => {
        fetchFarms();
    }, [debouncedSearch]);

    const fetchFarms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/farms/my-farms', {
                headers: { Authorization: `Bearer ${token}` },
                params: { search: debouncedSearch || undefined, limit: 100 }
            });

            if (response.data.success) {
                setFarms(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch farms:', error);
            toast.error('Failed to load farms');
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone: string) => {
        window.location.href = `tel:${phone}`;
    };

    const handleNavigate = (farm: Farm) => {
        navigate('/navigation', {
            state: {
                selectedFarmId: farm.id,
                mode: 'singleFarm',
                destination: {
                    lat: farm.latitude,
                    lng: farm.longitude
                }
            }
        });
    };

    const openDetails = (farm: Farm) => {
        setSelectedFarm(farm);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/dashboard')}
                            className="rounded-full"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Farm Database</h1>
                            <p className="text-sm text-gray-600">
                                {farms.length} farm{farms.length !== 1 ? 's' : ''} registered
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by farmer, village, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-12 rounded-xl border-gray-200"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-4 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </Card>
                        ))}
                    </div>
                ) : farms.length === 0 ? (
                    <div className="text-center py-12">
                        <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {search ? 'No farms found' : 'No farms registered yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {search ? 'Try a different search term' : 'Start by adding your first farm'}
                        </p>
                        {!search && (
                            <Button
                                onClick={() => navigate('/farm/new')}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Leaf className="h-4 w-4 mr-2" />
                                Add Farm
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {farms.map((farm) => (
                            <Card
                                key={farm.id}
                                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => openDetails(farm)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {farm.name || farm.farmer_name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                            <MapPin className="h-4 w-4" />
                                            {farm.village_name || farm.village}
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {farm.type || `${farm.cattle_count} cattle`}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                    <span>{farm.activity_count} activities logged</span>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCall(farm.phone_number);
                                        }}
                                        className="flex-1"
                                    >
                                        <Phone className="h-4 w-4 mr-1" />
                                        Call
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNavigate(farm);
                                        }}
                                        className="flex-1"
                                    >
                                        <Navigation className="h-4 w-4 mr-1" />
                                        Navigate
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Farm Details Sheet */}
            <Sheet open={!!selectedFarm} onOpenChange={(open) => !open && setSelectedFarm(null)}>
                <SheetContent className="overflow-y-auto">
                    {selectedFarm && (
                        <div className="space-y-6">
                            <SheetHeader>
                                <SheetTitle>{selectedFarm.name || selectedFarm.farmer_name}</SheetTitle>
                                <SheetDescription>
                                    Farm Details
                                </SheetDescription>
                            </SheetHeader>

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-100 p-2 rounded-full">
                                        <User className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Contact Person</p>
                                        <p className="font-medium">{selectedFarm.contact_name || selectedFarm.farmer_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <MapPin className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Village</p>
                                        <p className="font-medium">{selectedFarm.village_name || selectedFarm.village}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-100 p-2 rounded-full">
                                        <Leaf className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Farm Type</p>
                                        <p className="font-medium">{selectedFarm.type || 'Unknown'}</p>
                                    </div>
                                </div>

                                {(selectedFarm.cattle_count || 0) > 0 && (
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-100 p-2 rounded-full">
                                            <Info className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Cattle Count</p>
                                            <p className="font-medium">{selectedFarm.cattle_count} Heads</p>
                                        </div>
                                    </div>
                                )}

                                {selectedFarm.land_size && (
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-full">
                                            <Ruler className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Land Size</p>
                                            <p className="font-medium">{selectedFarm.land_size} Acres</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <Calendar className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Registered On</p>
                                        <p className="font-medium">
                                            {new Date(selectedFarm.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {selectedFarm.status && (
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <Info className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <Badge variant={selectedFarm.status === 'active' ? 'default' : 'secondary'}>
                                                {selectedFarm.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 pt-4 border-t">
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleCall(selectedFarm.phone_number)}
                                >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call Farmer
                                </Button>

                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => handleNavigate(selectedFarm)}
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Navigate to Farm
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
