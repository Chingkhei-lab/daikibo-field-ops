import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Phone,
    Mail,
    MapPin,
    Award,
    TrendingUp,
    Map as MapIcon,
    Clock,
    Activity,
    CreditCard,
    Users,
    User
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OfficerDetailSheetProps {
    officer: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OfficerDetailSheet({ officer, open, onOpenChange }: OfficerDetailSheetProps) {
    const [showHistory, setShowHistory] = useState(false);

    if (!officer) return null;

    const performance = officer.performance_score || 85;
    const sales = officer.total_sales || "₹4.2L";
    const joinedDate = officer.joined_date || "Oct 2023";

    // Generate 10 historical records
    const historicalRecords = Array.from({ length: 10 }).map((_, i) => {
        const villages = ["Bassi", "Amer", "Chomu", "Sanganer", "Phagi", "Dudu"];
        const village = villages[i % villages.length];
        const daysAgo = i + 1;
        const activities = [
            { title: `Farm Visit - ${village}`, icon: <MapPin className="h-5 w-5" />, desc: 'Regular check-up and crop health monitoring.' },
            { title: `Village Meeting`, icon: <Users className="h-5 w-5" />, desc: 'Conducted awareness session for 12 farmers.' },
            { title: 'Product Sale', icon: <TrendingUp className="h-5 w-5" />, desc: 'Closed sale of bio-organic fertilizers (50kg).' },
            { title: 'New Farmer Onboarding', icon: <User className="h-5 w-5" />, desc: 'Registered 2 new farms in the database.' }
        ];
        const act = activities[i % activities.length];
        const dateStr = new Date(Date.now() - (daysAgo * 86400000)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        return { ...act, date: dateStr };
    });

    return (
        <Sheet open={open} onOpenChange={(val) => {
            if (!val) setShowHistory(false);
            onOpenChange(val);
        }}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-gray-50 border-l border-gray-200 p-0">
                {/* Profile Header */}
                <div className="bg-teal-700 p-8 text-white relative">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-4 border-white/20 shadow-2xl">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${officer.name}`} />
                                <AvatarFallback>{officer.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 h-6 w-6 rounded-full border-4 border-teal-700 shadow-sm" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold font-outfit">{officer.name}</h2>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-white/20 text-white border-none hover:bg-white/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                                    {officer.status}
                                </Badge>
                                <span className="text-teal-100 text-xs font-medium">Joined {joinedDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 transition-colors group-hover:bg-yellow-200">
                                        <Award className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Perf Score</span>
                                </div>
                                <div className="text-2xl font-black text-gray-900 leading-none">{performance}%</div>
                                <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-yellow-400 h-full rounded-full transition-all duration-1000" style={{ width: `${performance}%` }} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600 transition-colors group-hover:bg-green-200">
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Sales</span>
                                </div>
                                <div className="text-2xl font-black text-gray-900 leading-none">{sales}</div>
                                <p className="text-[10px] text-green-600 font-bold mt-2 uppercase tracking-tight">↑ 12% vs last month</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact & Territory Info */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 border-b pb-2 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-teal-600" />
                                Detail Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Mobile</p>
                                            <p className="text-sm font-semibold text-gray-700">{officer.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Email</p>
                                            <p className="text-sm font-semibold text-gray-700 truncate">{officer.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                            <MapIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Territory</p>
                                            <p className="text-sm font-semibold text-gray-700">{officer.territory}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Last Online</p>
                                            <p className="text-sm font-semibold text-gray-700 uppercase tracking-tighter">Just Now</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today's Activity Timeline */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="h-4 w-4 text-orange-500" />
                                {showHistory ? "Full Activity History" : `Today's Activity (${officer.farms_visited}/5)`}
                            </h3>
                            <Badge className={cn(
                                "border-none text-[10px] font-bold uppercase",
                                showHistory ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                            )}>
                                {showHistory ? "Archive" : "Live Feed"}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {showHistory ? (
                                historicalRecords.map((act, i) => (
                                    <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-transparent shadow-sm group hover:border-purple-500/20 transition-all animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                                {act.icon}
                                            </div>
                                            {i < historicalRecords.length - 1 && <div className="absolute top-10 left-5 bottom-[-1.5rem] w-px bg-gray-100" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-bold text-gray-900 truncate">{act.title}</p>
                                                <span className="text-[10px] font-bold text-gray-400 tracking-tighter bg-gray-100 px-2 py-0.5 rounded-full uppercase">{act.date}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{act.desc}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    {Array.from({ length: parseInt(officer.farms_visited || "0") || 0 }).map((_, i) => {
                                        const activities = [
                                            { title: `Farm Visit - ${officer.territory}`, type: 'one-on-one', icon: <MapPin className="h-5 w-5" />, desc: 'Completed one-on-one session with farmer regarding bio-fertilizers.' },
                                            { title: `Group Meeting - ${officer.territory}`, type: 'group-meeting', icon: <Users className="h-5 w-5" />, desc: 'Organized a village gathering for product demonstration.' },
                                            { title: 'Sample Distribution', type: 'sample', icon: <TrendingUp className="h-5 w-5" />, desc: 'Distributed 5 units of sample seeds to local influencers.' },
                                            { title: 'Payment Collection', type: 'sale', icon: <CreditCard className="h-5 w-5" />, desc: 'Collected ₹1.2k partial payment for previous sale.' },
                                            { title: 'Soil Testing Service', type: 'service', icon: <Activity className="h-5 w-5" />, desc: 'Conducted 2 soil tests for new farm enrollment.' }
                                        ];
                                        const act = activities[i % activities.length];

                                        return (
                                            <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-transparent shadow-sm group hover:border-teal-500/20 transition-all">
                                                <div className="relative">
                                                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                                        {act.icon}
                                                    </div>
                                                    {i < parseInt(officer.farms_visited || "0") - 1 && <div className="absolute top-10 left-5 bottom-[-1.5rem] w-px bg-gray-100" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{act.title}</p>
                                                        <span className="text-[10px] font-bold text-gray-400 tracking-tighter bg-gray-50 px-2 py-0.5 rounded-full uppercase">Today</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{act.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {parseInt(officer.farms_visited || "0") === 0 && (
                                        <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No activities logged yet today</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setShowHistory(!showHistory)}
                            className={cn(
                                "w-full h-12 rounded-xl border-dashed font-bold uppercase tracking-widest text-[10px] transition-all",
                                showHistory
                                    ? "bg-gray-100 text-gray-600 border-gray-200"
                                    : "text-gray-400 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50/30"
                            )}
                        >
                            <Clock className="h-3 w-3 mr-2" />
                            {showHistory ? "Back to Today's Activity" : "See More Previous History"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
