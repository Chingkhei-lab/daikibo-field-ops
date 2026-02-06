import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from "lucide-react";

interface LeaderboardEntry {
    name: string;
    visit_count: string | number;
    last_visit: string;
}

interface PerformanceLeaderboardProps {
    data: LeaderboardEntry[];
    loading?: boolean;
}

export function PerformanceLeaderboard({ data, loading }: PerformanceLeaderboardProps) {
    if (loading) {
        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Top Performers (Today)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Performers (Today)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.length > 0 ? (
                        data.map((officer, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border shadow-sm">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${officer.name}`} />
                                            <AvatarFallback>{officer.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {index === 0 && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-sm">
                                                <Trophy className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{officer.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Field Officer</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-50 font-bold border-teal-100">
                                        {officer.visit_count} Visits
                                    </Badge>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Last active: {new Date(officer.last_visit).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No activity recorded yet today.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
