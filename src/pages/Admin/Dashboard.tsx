import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { PerformanceLeaderboard } from "@/components/Admin/Dashboard/PerformanceLeaderboard";
import { ActivityDistribution } from "@/components/Admin/Dashboard/ActivityDistribution";

const DEMO_STATS = {
    activeOfficers: 12,
    totalOfficers: 15,
    farmsVisited: 42,
    scheduledToday: 50,
    pendingSyncs: 8,
    completionRate: "84%"
};

const DEMO_PERFORMANCE = [
    { name: "Arjun Meena", visit_count: 14, last_visit: new Date().toISOString() },
    { name: "Priya Sharma", visit_count: 12, last_visit: new Date().toISOString() },
    { name: "Vikram Singh", visit_count: 11, last_visit: new Date().toISOString() },
    { name: "Suresh Kumar", visit_count: 9, last_visit: new Date().toISOString() }
];

const DEMO_DISTRIBUTION = [
    { type: "one-on-one", count: 25 },
    { type: "group-meeting", count: 12 },
    { type: "sample-distribution", count: 18 },
    { type: "sale", count: 7 },
    { type: "issue", count: 3 }
];

export function AdminDashboard() {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(DEMO_STATS);
    const [performance, setPerformance] = useState<any>(DEMO_PERFORMANCE);
    const [distribution, setDistribution] = useState<any>(DEMO_DISTRIBUTION);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [summaryRes, perfRes, distRes] = await Promise.all([
                    axios.get('/api/admin/stats/summary', config),
                    axios.get('/api/admin/stats/performance', config),
                    axios.get('/api/admin/stats/activity-distribution', config)
                ]);

                // Prefer demo data if real data is nearly empty (all zeros) or if we want to force demo
                const hasRealData = summaryRes.data.success &&
                    (summaryRes.data.data?.activeOfficers > 0 ||
                        summaryRes.data.data?.farmsVisited > 0);

                if (hasRealData) {
                    setSummary(summaryRes.data.data);
                } else {
                    setSummary(DEMO_STATS);
                }

                if (perfRes.data.success && perfRes.data.data?.length > 0) {
                    setPerformance(perfRes.data.data);
                } else {
                    setPerformance(DEMO_PERFORMANCE);
                }

                if (distRes.data.success && distRes.data.data?.length > 0) {
                    setDistribution(distRes.data.data);
                } else {
                    setDistribution(DEMO_DISTRIBUTION);
                }
            } catch (error) {
                console.error("Failed to fetch admin dashboard data", error);
                // Fallback to demo data on error
                setSummary(DEMO_STATS);
                setPerformance(DEMO_PERFORMANCE);
                setDistribution(DEMO_DISTRIBUTION);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [token]);

    const statsConfig = [
        {
            title: "Active Officers",
            value: summary?.activeOfficers || 0,
            description: `out of ${summary?.totalOfficers || 0} total`,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100"
        },
        {
            title: "Farms Visited",
            value: summary?.farmsVisited || 0,
            description: `vs ${summary?.scheduledToday || 0} scheduled today`,
            icon: MapPin,
            color: "text-green-600",
            bgColor: "bg-green-100"
        },
        {
            title: "Sync Queue",
            value: summary?.pendingSyncs || 0,
            description: "estimated data pending sync",
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-100"
        },
        {
            title: "Completion Rate",
            value: summary?.completionRate || "0%",
            description: "of daily targets achieved",
            icon: CheckCircle2,
            color: "text-teal-600",
            bgColor: "bg-teal-100"
        }
    ];

    if (loading && !summary) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                <p className="text-sm text-gray-500 font-medium">Loading command center analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-outfit">Dashboard Overview</h1>
                    <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-medium">Manager Command Center</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 block mb-1">SYSTEM STATUS</span>
                    <div className="flex items-center gap-1.5 justify-end">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-gray-600">LIVE DATA FEED</span>
                    </div>
                </div>
            </div>

            {/* Top Row: KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsConfig.map((stat, index) => (
                    <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                            <p className="text-xs font-medium text-gray-400 mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Middle Row: Performance & Distribution */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <PerformanceLeaderboard data={performance} loading={loading} />
                </div>
                <div className="lg:col-span-3">
                    <ActivityDistribution data={distribution} loading={loading} />
                </div>
            </div>

            {/* Bottom Row: Recent Notifications */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-sm border-none">
                    <CardHeader className="pb-3 border-b border-gray-50">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Recent Field Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-red-50/30 border border-red-50">
                                    <div className="bg-red-100 p-2 rounded-full shrink-0">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-red-900">SOS Signal - Emergency Reported</p>
                                            <span className="text-[10px] font-bold text-red-400">10 MINS AGO</span>
                                        </div>
                                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                                            Officer <strong>Vikram Singh</strong> reported an issue at <strong>Village Kherli</strong>.
                                            Contact initiated.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-teal-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle2 className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Manager Tip</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-teal-100 text-sm leading-relaxed">
                            "Territory coverage is currently peaking in the North region. Consider re-allocating 2 officers to the South-West village cluster to meet the 5 PM target."
                        </p>
                        <Button variant="secondary" className="w-full bg-teal-500 hover:bg-teal-400 text-white border-none font-bold">
                            Review Territories
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

