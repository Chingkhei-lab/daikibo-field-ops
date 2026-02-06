import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';
import { Languages, LogOut, Target, Signal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ProfileDrawerProps {
    user: { id: string; name: string; email?: string } | null;
    onLogout: () => void;
    children: React.ReactNode; // The trigger button
}

export function ProfileDrawer({ user, onLogout, children }: ProfileDrawerProps) {
    const { i18n } = useTranslation();
    const [gpsMode, setGpsMode] = useState('medium');
    const [lang, setLang] = useState(i18n.language || 'en');

    const toggleLanguage = (checked: boolean) => {
        const newLang = checked ? 'hi' : 'en';
        setLang(newLang);
        i18n.changeLanguage(newLang);
        toast.success(newLang === 'hi' ? 'भाषा बदलकर हिंदी कर दी गई' : 'Language changed to English');
    };

    // Cast user to any to access the new optional fields without updating the prop type everywhere yet
    // In a real app, I'd update the ProfileDrawerProps interface.
    const fullUser = user as any;
    const [verificationStatus, setVerificationStatus] = useState<'approved' | 'pending' | 'rejected' | 'unverified'>(fullUser.status || 'unverified');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Refresh status on mount
        const fetchStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data.success && response.data.user.status) {
                    setVerificationStatus(response.data.user.status);

                    // Update user in local storage to keep it fresh
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    localStorage.setItem('user', JSON.stringify({ ...currentUser, status: response.data.user.status }));
                }
            } catch (error) {
                console.error('Failed to fetch user status', error);
            }
        };

        fetchStatus();
    }, []);

    const handleRequestApproval = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/auth/request-verification`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setVerificationStatus('pending');
            toast.success('Approval requested successfully');

            // Update local storage
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...currentUser, status: 'pending' }));
        } catch (error) {
            console.error('Request failed', error);
            toast.error('Failed to request approval');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusConfig = () => {
        switch (verificationStatus) {
            case 'approved': return { color: 'bg-green-100 text-green-700 border-green-200', text: 'Verified Officer', dot: 'bg-green-500' };
            case 'pending': return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: 'Approval Pending', dot: 'bg-yellow-500' };
            case 'rejected': return { color: 'bg-red-100 text-red-700 border-red-200', text: 'Action Required', dot: 'bg-red-500' };
            default: return { color: 'bg-gray-100 text-gray-700 border-gray-200', text: 'Unverified', dot: 'bg-gray-400' };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>My Profile</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col items-center mt-6 mb-6">
                    <Avatar className="h-20 w-20 mb-3 border-4 border-teal-100">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
                        <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                    <p className="text-sm text-gray-500">{user?.email || 'Field Officer'}</p>

                    <div className={`flex items-center gap-2 mt-3 text-xs px-3 py-1.5 rounded-full border ${statusConfig.color} font-medium`}>
                        <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                        {statusConfig.text}
                    </div>

                    {/* Hardcoded Manager for Demo */}
                    <div className="mt-4 w-full bg-teal-50 px-4 py-3 rounded-lg border border-teal-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Reporting Manager</p>
                                <p className="text-sm font-bold text-teal-700 mt-1">Anny</p>
                                <p className="text-xs text-gray-500">anny1@ocammy.com</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs bg-white text-teal-600 border-teal-200 hover:bg-teal-50"
                                disabled={verificationStatus === 'approved' || verificationStatus === 'pending' || isLoading}
                                onClick={handleRequestApproval}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        Wait...
                                    </>
                                ) : verificationStatus === 'pending' ? 'Pending...' : verificationStatus === 'approved' ? 'Approved' : 'Request Approval'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Targets */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-900">
                            <Target className="h-4 w-4 text-teal-600" />
                            Today's Targets
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 font-medium">Farms Visited</span>
                                <span className="font-bold text-gray-900">2 / 5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-teal-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 font-medium">Sales Target</span>
                                <span className="font-bold text-gray-900">₹12k / ₹20k</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <Languages className="h-4 w-4 text-gray-500" />
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">App Language</span>
                                    <span className="text-xs text-gray-500">{lang === 'en' ? 'English' : 'Hindi (हिंदी)'}</span>
                                </div>
                            </div>
                            <Switch
                                checked={lang === 'hi' || i18n.language === 'hi'}
                                onCheckedChange={toggleLanguage}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <Signal className="h-4 w-4 text-gray-500" />
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">GPS Accuracy</span>
                                    <span className="text-xs text-gray-500">{gpsMode === 'high' ? 'High Power' : 'Battery Saver'}</span>
                                </div>
                            </div>
                            <Switch
                                checked={gpsMode === 'high'}
                                onCheckedChange={(c) => setGpsMode(c ? 'high' : 'medium')}
                            />
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t">
                        <Button
                            variant="destructive"
                            className="w-full gap-2"
                            onClick={onLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Log Out
                        </Button>
                        <p className="text-center text-xs text-gray-400 mt-4">
                            App Version 1.2.0 (Build 45)
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
