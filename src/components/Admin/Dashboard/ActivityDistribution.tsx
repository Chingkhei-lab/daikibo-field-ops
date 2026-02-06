import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, ListChecks } from "lucide-react";

interface DistributionEntry {
    type: string;
    count: string | number;
}

interface ActivityDistributionProps {
    data: DistributionEntry[];
    loading?: boolean;
}

export function ActivityDistribution({ data, loading }: ActivityDistributionProps) {
    const total = data.reduce((acc, curr) => acc + Number(curr.count), 0);

    const colors: Record<string, string> = {
        'one-on-one': 'bg-blue-500',
        'group-meeting': 'bg-purple-500',
        'sample-distribution': 'bg-teal-500',
        'sale': 'bg-orange-500',
        'meeting': 'bg-indigo-500',
        'visit': 'bg-green-500',
        'issue': 'bg-red-500'
    };

    const labels: Record<string, string> = {
        'one-on-one': '1-on-1 Visits',
        'group-meeting': 'Group Sessions',
        'sample-distribution': 'Samples Dist.',
        'sale': 'Sales Logs',
        'meeting': 'Meetings',
        'visit': 'Field Visits',
        'issue': 'Reported Issues'
    };

    if (loading) {
        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Activity Mix</CardTitle>
                </CardHeader>
                <CardContent className="animate-pulse">
                    <div className="h-[200px] w-[200px] rounded-full border-8 border-gray-100 mx-auto" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-teal-600" />
                    Activity Mix
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {data.length > 0 ? (
                        <>
                            {/* Visual Bar representation */}
                            <div className="h-4 w-full flex rounded-full overflow-hidden bg-gray-100">
                                {data.map((item, idx) => {
                                    const percentage = (Number(item.count) / total) * 100;
                                    return (
                                        <div
                                            key={idx}
                                            className={`${colors[item.type] || 'bg-gray-400'}`}
                                            style={{ width: `${percentage}%` }}
                                            title={`${labels[item.type] || item.type}: ${item.count}`}
                                        />
                                    );
                                })}
                            </div>

                            {/* Legend / List */}
                            <div className="grid grid-cols-1 gap-3">
                                {data.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${colors[item.type] || 'bg-gray-400'}`} />
                                            <span className="text-sm font-medium text-gray-700">{labels[item.type] || item.type}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">{item.count}</span>
                                            <span className="text-[10px] text-gray-400 w-8 text-right">
                                                {Math.round((Number(item.count) / total) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <PieChart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No data distribution available.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
