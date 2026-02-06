import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Filter, Calendar, MapPin, Users, Package, DollarSign, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface Activity {
    id: string;
    type: string;
    village_name: string;
    person_name?: string;
    farmer_name?: string;
    attendee_count?: number;
    created_at: string;
    notes?: string;
    photos: any[];
}

const ACTIVITY_TYPES = [
    { value: 'all', label: 'All Types' },
    { value: 'one-on-one', label: 'One-on-One' },
    { value: 'group-meeting', label: 'Group Meeting' },
    { value: 'sample-distribution', label: 'Sample Distribution' },
    { value: 'sale', label: 'Sale' },
];

const ACTIVITY_ICONS: Record<string, any> = {
    'one-on-one': Users,
    'group-meeting': Users,
    'sample-distribution': Package,
    'sale': DollarSign,
};

const ACTIVITY_COLORS: Record<string, string> = {
    'one-on-one': 'bg-blue-100 text-blue-800',
    'group-meeting': 'bg-purple-100 text-purple-800',
    'sample-distribution': 'bg-green-100 text-green-800',
    'sale': 'bg-orange-100 text-orange-800',
};

export function ActivityHistory() {
    const navigate = useNavigate();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchActivities();
    }, [typeFilter]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params: any = { limit: 100 };

            if (typeFilter !== 'all') {
                params.type = typeFilter;
            }

            const response = await axios.get('/api/activities/history/all', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            if (response.data.success) {
                setActivities(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch activities:', error);
            toast.error('Failed to load activity history');
        } finally {
            setLoading(false);
        }
    };

    const filteredActivities = activities.filter(activity => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            activity.village_name?.toLowerCase().includes(search) ||
            activity.person_name?.toLowerCase().includes(search) ||
            activity.farmer_name?.toLowerCase().includes(search) ||
            activity.notes?.toLowerCase().includes(search)
        );
    });

    const getActivityIcon = (type: string) => {
        const Icon = ACTIVITY_ICONS[type] || Users;
        return Icon;
    };

    const getActivityLabel = (activity: Activity) => {
        if (activity.type === 'group-meeting') {
            return `Group Meeting (${activity.attendee_count || 0} attendees)`;
        }
        return activity.person_name || activity.farmer_name || 'Activity';
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
                            <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
                            <p className="text-sm text-gray-600">
                                {filteredActivities.length} activit{filteredActivities.length !== 1 ? 'ies' : 'y'}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search activities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 rounded-lg"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px] h-10 rounded-lg">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ACTIVITY_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="p-4 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </Card>
                        ))}
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchTerm || typeFilter !== 'all' ? 'No activities found' : 'No activities yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm || typeFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Start logging your field activities'}
                        </p>
                        {!searchTerm && typeFilter === 'all' && (
                            <Button
                                onClick={() => navigate('/activity/new')}
                                className="bg-teal-600 hover:bg-teal-700"
                            >
                                Log Activity
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredActivities.map((activity) => {
                            const Icon = getActivityIcon(activity.type);
                            return (
                                <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${ACTIVITY_COLORS[activity.type] || 'bg-gray-100'}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {getActivityLabel(activity)}
                                                </h3>
                                                <Badge variant="outline" className="text-xs shrink-0">
                                                    {activity.type.replace('-', ' ')}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <MapPin className="h-4 w-4" />
                                                {activity.village_name}
                                            </div>

                                            {activity.notes && (
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                    {activity.notes}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>{formatDateTime(new Date(activity.created_at).getTime())}</span>
                                                {activity.photos && activity.photos.length > 0 && (
                                                    <span>{activity.photos.length} photo{activity.photos.length !== 1 ? 's' : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
