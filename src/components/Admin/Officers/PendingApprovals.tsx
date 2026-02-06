import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, MapPin, Languages, Phone } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface PendingOfficer {
    id: string;
    name: string;
    email: string;
    phone: string;
    territory: string;
    language: string;
    created_at: string;
}

interface PendingApprovalsProps {
    onActionComplete?: () => void;
}

export function PendingApprovals({ onActionComplete }: PendingApprovalsProps) {
    const [requests, setRequests] = useState<PendingOfficer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuthStore();

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/admin/pending-officers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data.data);
        } catch (error) {
            console.error('Failed to fetch pending officers', error);
            toast.error('Failed to load pending requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        try {
            await axios.post('/api/admin/handle-request',
                { userId, action },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Officer ${action}d successfully`);
            setRequests(prev => prev.filter(r => r.id !== userId));
            if (onActionComplete) onActionComplete();
        } catch (error) {
            toast.error(`Failed to ${action} officer`);
        }
    };

    if (isLoading) return <div className="p-4 text-center">Loading requests...</div>;

    if (requests.length === 0) {
        return (
            <Card className="p-8 text-center text-gray-500">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Check className="h-6 w-6 text-gray-400" />
                </div>
                <p>No pending approvals</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                Pending Approvals <Badge>{requests.length}</Badge>
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requests.map((req) => (
                    <Card key={req.id} className="p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 bg-yellow-50 rounded-bl-lg border-b border-l border-yellow-100">
                            <span className="text-xs font-medium text-yellow-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pending
                            </span>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold text-lg">{req.name}</h3>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {req.phone}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" /> {req.territory}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Languages className="w-3 h-3" /> {req.language === 'en' ? 'English' : 'Hindi'}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                size="sm"
                                onClick={() => handleAction(req.id, 'approve')}
                            >
                                <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                size="sm"
                                onClick={() => handleAction(req.id, 'reject')}
                            >
                                <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
