import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    TrendingUp,
    MapPin,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Award,
    Sprout,
    PieChart,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnalyticsDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 font-outfit uppercase">Analytics & Intelligence</h1>
                    <p className="text-muted-foreground font-medium mt-1">Deep-dive performance metrics and field growth insights.</p>
                </div>
                <div className="bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Q1 2024 Strategy Period</span>
                </div>
            </div>

            {/* Top Row: Strategic KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Revenue Target", value: "₹42.8L", growth: "+14.2%", positive: true, icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-100" },
                    { label: "Active Coverage", value: "92.4%", growth: "+5.1%", positive: true, icon: MapPin, color: "text-green-600", bgColor: "bg-green-100" },
                    { label: "Farmer Retention", value: "88%", growth: "-2.3%", positive: false, icon: Users, color: "text-orange-600", bgColor: "bg-orange-100" },
                    { label: "Efficiency Score", value: "94/100", growth: "+1.5%", positive: true, icon: Target, color: "text-teal-600", bgColor: "bg-teal-100" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", stat.bgColor, stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full",
                                    stat.positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                )}>
                                    {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {stat.growth}
                                </div>
                            </div>
                            <div className="text-3xl font-black text-gray-900 leading-none">{stat.value}</div>
                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Visual Distribution - Crop Analysis */}
                <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 border-b border-gray-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Sprout className="h-5 w-5 text-green-600" />
                                Crop Type Distribution
                            </CardTitle>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Current Season Allocation</p>
                        </div>
                        <PieChart className="h-5 w-5 text-gray-300" />
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            {[
                                { label: "Wheat", percentage: 45, color: "bg-amber-400", amount: "125 Tons" },
                                { label: "Mustard", percentage: 25, color: "bg-yellow-300", amount: "70 Tons" },
                                { label: "Bajra", percentage: 15, color: "bg-orange-300", amount: "42 Tons" },
                                { label: "Organic Greens", percentage: 10, color: "bg-green-400", amount: "28 Tons" },
                                { label: "Other", percentage: 5, color: "bg-gray-200", amount: "14 Tons" },
                            ].map((crop, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tight">
                                        <span className="text-gray-600">{crop.label}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-400">{crop.amount}</span>
                                            <span className="text-teal-600">{crop.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000 delay-300", crop.color)}
                                            style={{ width: `${crop.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Efficiency Index - Field Performance */}
                <Card className="lg:col-span-3 border-none shadow-sm bg-teal-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Award className="h-32 w-32" />
                    </div>
                    <CardHeader className="pb-0">
                        <CardTitle className="text-lg font-bold uppercase tracking-widest text-teal-300">Coverage Index</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="relative flex items-center justify-center py-10">
                            <div className="h-40 w-40 rounded-full border-[10px] border-white/10 flex items-center justify-center relative">
                                <div className="text-center">
                                    <div className="text-5xl font-black">94</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-teal-300">Efficiency</div>
                                </div>
                                {/* Pseudo radial progress */}
                                <svg className="absolute -top-[10px] -left-[10px] h-[180px] w-[180px] -rotate-90">
                                    <circle
                                        cx="90" cy="90" r="80"
                                        fill="transparent"
                                        stroke="white"
                                        strokeWidth="10"
                                        strokeDasharray="502.6"
                                        strokeDashoffset="30"
                                        strokeLinecap="round"
                                        className="opacity-90"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                                <div className="text-[10px] font-black uppercase tracking-widest text-teal-300 mb-1">Top Territory</div>
                                <div className="text-lg font-bold">Bassi Block (98%)</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                                <div className="text-[10px] font-black uppercase tracking-widest text-teal-300 mb-1">Growth Bottleneck</div>
                                <div className="text-lg font-bold">Phagi South (-2%)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row - Regional Revenue */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="pb-2 border-b border-gray-50 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-teal-600" />
                            Regional Performance Tracker
                        </CardTitle>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Value Distribution by Village cluster</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="h-48 flex items-end justify-between gap-4">
                        {[
                            { label: "Bassi", value: 85, color: "bg-teal-500" },
                            { label: "Amer", value: 65, color: "bg-teal-400" },
                            { label: "Chomu", value: 92, color: "bg-teal-600" },
                            { label: "Sanganer", value: 45, color: "bg-teal-300" },
                            { label: "Phagi", value: 78, color: "bg-teal-500" },
                            { label: "Dudu", value: 55, color: "bg-teal-400" },
                            { label: "Lalsot", value: 88, color: "bg-teal-600" },
                        ].map((region, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full relative h-32 flex items-end bg-gray-50/50 rounded-lg">
                                    <div
                                        className={cn("w-full rounded-t-xl transition-all duration-1000 group-hover:opacity-80 shadow-inner", region.color)}
                                        style={{ height: `${region.value}%` }}
                                    >
                                        <div className="absolute -top-6 left-0 right-0 text-center text-[10px] font-black text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {region.value}%
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {region.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
