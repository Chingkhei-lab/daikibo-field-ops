import { useState } from 'react';
import { OfficerList } from "@/components/Admin/Officers/OfficerList";
import { PendingApprovals } from "@/components/Admin/Officers/PendingApprovals";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Award, TrendingUp } from 'lucide-react';

export function OfficersPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 font-outfit uppercase">Officer Management</h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage field workforce, track performance, and verify credentials.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border shadow-sm self-start md:self-auto">
                    <div className="flex -space-x-3 px-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=officer-${i}`} alt="Avatar" />
                            </div>
                        ))}
                    </div>
                    <div className="pr-4 border-l pl-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block leading-none">Team Size</span>
                        <span className="text-lg font-black text-teal-600 leading-none">12 Active</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Headcount</p>
                                <p className="text-2xl font-black text-gray-900 leading-none font-outfit">15</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-teal-600 bg-teal-50/50 w-fit px-2 py-1 rounded-full uppercase tracking-tighter">
                            <TrendingUp className="h-3 w-3" /> +2 this month
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UserCheck className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Active Today</p>
                                <p className="text-2xl font-black text-gray-900 leading-none font-outfit">12 / 15</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 w-fit px-2 py-1 rounded-full uppercase tracking-tighter">
                            80% attendance rate
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Award className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Avg Performance</p>
                                <p className="text-2xl font-black text-gray-900 leading-none font-outfit">86.4%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-600 bg-yellow-50/50 w-fit px-2 py-1 rounded-full uppercase tracking-tighter">
                            Elite team status
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-12">
                <PendingApprovals onActionComplete={() => setRefreshKey(k => k + 1)} />
                <OfficerList key={refreshKey} />
            </div>
        </div>
    );
}
