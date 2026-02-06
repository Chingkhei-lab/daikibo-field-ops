import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Plus } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Officer {
    id: string;
    name: string;
}

interface Farm {
    id: string;
    name: string;
    village: string;
}

interface Assignment {
    id: string;
    date: string;
    officer_id: string;
    officer_name: string;
    farm_name: string;
    status: string;
}

export function FarmAssignment() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [farms, setFarms] = useState<Farm[]>([]);
    const { token } = useAuthStore();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState('');
    const [selectedFarms, setSelectedFarms] = useState<string[]>([]);
    const [assignDate, setAssignDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Calendar Days
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    // Stable Demo Data Generation
    const DEMO_ASSIGNMENTS = useMemo(() => {
        const data: Assignment[] = [];
        // Using strings for comparison to avoid timezone issues with Date objects
        const startTarget = '2026-02-02';
        const endTarget = '2026-02-10';

        const viewStartStr = format(startDate, 'yyyy-MM-dd');
        const viewEndStr = format(addDays(startDate, 6), 'yyyy-MM-dd');

        // Only generate if the viewed week potentially contains Feb 2 - Feb 10
        if (viewEndStr < startTarget || viewStartStr > endTarget) {
            return data;
        }

        const demoOfficers = ["Arjun Meena", "Priya Sharma", "Vikram Singh", "Suresh Kumar"];
        const demoFarms = ["Ram Singh's Farm", "Manoj Kumar's Farm", "Gopal Lal's Farm", "Anita Devi's Farm", "Om Prakash's Farm", "Kailash Chand's Farm"];

        weekDays.forEach((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            if (dateStr < startTarget || dateStr > endTarget) return;

            // Specifically ensuring data for 7, 9, 10 Feb exists
            const daySeed = day.getDate() + day.getMonth();
            const count = 3 + (daySeed % 2);

            for (let i = 0; i < count; i++) {
                const officerName = demoOfficers[i % demoOfficers.length];
                data.push({
                    id: `demo-${day.getTime()}-${i}`,
                    date: dateStr,
                    officer_id: (i + 1).toString(),
                    officer_name: officerName,
                    farm_name: demoFarms[(i + (daySeed + i)) % demoFarms.length],
                    status: 'pending'
                });
            }
        });
        return data;
    }, [startDate]);

    useEffect(() => {
        setAssignments(DEMO_ASSIGNMENTS);
        fetchData();
    }, [startDate, DEMO_ASSIGNMENTS]);

    const fetchData = async () => {
        try {
            const [officersRes, farmsRes, assignmentsRes] = await Promise.all([
                axios.get('/api/admin/officers', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/farms', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/farms/assignments', {
                    params: {
                        startDate: format(startDate, 'yyyy-MM-dd'),
                        endDate: format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                    },
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setOfficers(officersRes.data.data || []);
            setFarms(farmsRes.data.data || []);

            const realAssignments = assignmentsRes.data.data || [];
            // Merge demo assignments with real ones, avoiding duplicates if any
            const merged = [...realAssignments];
            DEMO_ASSIGNMENTS.forEach(demo => {
                if (!merged.find(a => a.date === demo.date && a.officer_name === demo.officer_name)) {
                    merged.push(demo);
                }
            });
            setAssignments(merged);
        } catch (error) {
            console.error('Fetch error:', error);
            setAssignments(DEMO_ASSIGNMENTS);
        } finally {
        }
    };

    const handleAssign = async () => {
        try {
            await axios.post('/api/farms/assign', {
                officerId: selectedOfficer,
                farmIds: selectedFarms,
                date: assignDate
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success('Farms assigned successfully');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Assignment failed');
        }
    };

    // Helper to toggle farm selection
    const toggleFarm = (farmId: string) => {
        setSelectedFarms(prev =>
            prev.includes(farmId) ? prev.filter(id => id !== farmId) : [...prev, farmId]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Farm Assignments</h1>
                    <p className="text-muted-foreground">Manage daily route schedules for field officers.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="h-4 w-4 mr-2" /> New Assignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Assign Route</DialogTitle>
                            <DialogDescription>Select an officer and farms for their daily route.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Officer</label>
                                <Select onValueChange={setSelectedOfficer} value={selectedOfficer}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose officer..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {officers.map(o => (
                                            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Date</label>
                                <input
                                    type="date"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={assignDate}
                                    onChange={e => setAssignDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Farms ({selectedFarms.length})</label>
                                <div className="h-48 border rounded-md overflow-y-auto p-2 space-y-1">
                                    {farms.map(farm => (
                                        <div
                                            key={farm.id}
                                            className={`p-2 rounded-md cursor-pointer flex items-center justify-between text-sm ${selectedFarms.includes(farm.id) ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => toggleFarm(farm.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="font-medium">{farm.name}</p>
                                                    <p className="text-xs text-gray-500">{farm.village}</p>
                                                </div>
                                            </div>
                                            {selectedFarms.includes(farm.id) && <Badge className="bg-teal-600">Selected</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleAssign} disabled={!selectedOfficer || selectedFarms.length === 0}>
                                Create Assignment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(d => addDays(d, -7))}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Prev Week
                </Button>
                <div className="font-semibold text-lg">
                    {format(startDate, 'MMM d')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(d => addDays(d, 7))}>
                    Next Week <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>

            {/* Weekly Grid */}
            <div className="grid grid-cols-7 gap-4 min-h-[400px]">
                {weekDays.map((day, i) => (
                    <Card key={i} className={`flex flex-col h-full ${isSameDay(day, new Date()) ? 'border-teal-500 border-2' : ''}`}>
                        <CardHeader className="p-3 bg-gray-50 text-center border-b">
                            <div className="text-xs font-medium text-gray-500 uppercase">{format(day, 'EEE')}</div>
                            <div className="text-lg font-bold">{format(day, 'd')}</div>
                        </CardHeader>
                        <CardContent className="p-2 flex-1 space-y-2 bg-gray-50/30">
                            {assignments
                                .filter(a => isSameDay(new Date(a.date), day))
                                .map(a => (
                                    <div key={a.id} className="bg-white p-2 rounded border shadow-sm text-xs">
                                        <div className="flex items-center gap-1 mb-1 font-semibold text-teal-700">
                                            <Avatar className="h-4 w-4">
                                                <AvatarFallback className="text-[8px]">{a.officer_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">{a.officer_name}</span>
                                        </div>
                                        <div className="pl-5 text-gray-600 truncate">
                                            {a.farm_name}
                                        </div>
                                    </div>
                                ))
                            }
                            {assignments.filter(a => isSameDay(new Date(a.date), day)).length === 0 && (
                                <div className="text-center py-8 text-gray-300">
                                    <Plus className="h-6 w-6 mx-auto mb-1" />
                                    <span className="text-xs">No tasks</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
