import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search,
    MapPin,
    Activity,
    TrendingUp,
    CreditCard,
    Users,
    AlertTriangle,
    CheckCircle2,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVITY_TYPES = {
    'farm-visit': { label: 'Farm Visit', icon: <MapPin className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    'group-meeting': { label: 'Group Meeting', icon: <Users className="h-4 w-4" />, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    'sample': { label: 'Sample Distribution', icon: <TrendingUp className="h-4 w-4" />, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    'sale': { label: 'Payment Collection', icon: <CreditCard className="h-4 w-4" />, color: 'text-green-600', bgColor: 'bg-green-50' },
    'issue': { label: 'Field Alert', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600', bgColor: 'bg-red-50' },
    'service': { label: 'Soil Testing', icon: <Activity className="h-4 w-4" />, color: 'text-teal-600', bgColor: 'bg-teal-50' }
};

const DEMO_ACTIVITIES = Array.from({ length: 25 }).map((_, i) => {
    const types = Object.keys(ACTIVITY_TYPES);
    const type = types[i % types.length] as keyof typeof ACTIVITY_TYPES;
    const officers = ["Arjun Meena", "Priya Sharma", "Vikram Singh", "Suresh Kumar"];
    const villages = ["Bassi", "Amer", "Chomu", "Sanganer", "Phagi", "Dudu"];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return {
        id: `act-${i}`,
        type,
        officer: officers[i % officers.length],
        village: villages[i % villages.length],
        timestamp: new Date(todayStart.getTime() - (i * 3600000 * 2)).toISOString(),
        description: i % 2 === 0
            ? `Completed ${ACTIVITY_TYPES[type].label.toLowerCase()} for the winter crop season.`
            : `Routine ${ACTIVITY_TYPES[type].label.toLowerCase()} and farmer consultation session.`,
        status: i === 0 ? 'Live' : 'Synced'
    };
});

export function ActivityLog() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string | null>(null);

    const filteredActivities = DEMO_ACTIVITIES.filter(act => {
        const matchesSearch = act.officer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            act.village.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = !filterType || act.type === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 font-outfit uppercase">Activities Log</h1>
                    <p className="text-muted-foreground font-medium mt-1">Real-time feed of all field operations and farmer interactions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search officer or village..."
                            className="pl-9 h-11 rounded-xl border-gray-200 focus:ring-teal-500 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    variant={!filterType ? "default" : "outline"}
                    className={cn("rounded-full px-6 font-bold uppercase text-[10px] tracking-widest h-9", !filterType ? "bg-teal-600" : "text-gray-400")}
                    onClick={() => setFilterType(null)}
                >
                    All Activities
                </Button>
                {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                    <Button
                        key={key}
                        variant={filterType === key ? "default" : "outline"}
                        className={cn(
                            "rounded-full px-6 font-bold uppercase text-[10px] tracking-widest h-9 gap-2",
                            filterType === key ? "bg-teal-600" : "text-gray-400"
                        )}
                        onClick={() => setFilterType(key)}
                    >
                        {config.icon}
                        {config.label}
                    </Button>
                ))}
            </div>

            <div className="grid gap-4">
                {filteredActivities.map((act) => (
                    <Card key={act.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                <div className={cn(
                                    "w-full md:w-2 bg-gray-100 transition-colors group-hover:bg-teal-500",
                                    act.type === 'issue' ? 'bg-red-500' :
                                        act.type === 'sale' ? 'bg-green-500' : ''
                                )} />
                                <div className="p-6 flex-1 flex flex-col md:flex-row items-start md:items-center gap-6">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                        ACTIVITY_TYPES[act.type].bgColor,
                                        ACTIVITY_TYPES[act.type].color
                                    )}>
                                        {ACTIVITY_TYPES[act.type].icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                {ACTIVITY_TYPES[act.type].label}
                                            </span>
                                            <div className="h-1 w-1 rounded-full bg-gray-300" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">
                                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {act.status === 'Live' && (
                                                <Badge className="bg-red-500 text-white border-none text-[8px] font-black uppercase px-2 py-0 animate-pulse">Live</Badge>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                                            {act.officer} @ {act.village}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1 font-medium italic">
                                            "{act.description}"
                                        </p>
                                    </div>

                                    <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(act.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {act.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Re-using Button to fix implicit error
function Button({ className, variant, ...props }: any) {
    const variants = {
        default: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm",
        outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-900",
        ghost: "hover:bg-gray-100 text-gray-600"
    };
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                variants[variant as keyof typeof variants] || variants.default,
                className
            )}
            {...props}
        />
    );
}
