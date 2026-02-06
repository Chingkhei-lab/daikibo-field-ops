import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, MapPin, MoreHorizontal, MessageSquare, Trash2, Edit2, Award, TrendingUp } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddOfficerDialog } from './AddOfficerDialog';
import { AccessCodeGenerator } from './AccessCodeGenerator';
import { OfficerDetailSheet } from './OfficerDetailSheet';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

interface Officer {
    id: string;
    name: string;
    phone: string;
    email: string;
    territory: string;
    status: 'active' | 'inactive' | 'pending';
    assigned_farms: string;
    farms_visited: string;
    performance_score?: number;
    total_sales?: string;
    joined_date?: string;
}

const DEMO_OFFICERS_ENHANCED: Officer[] = [
    {
        id: '1',
        name: 'Arjun Meena',
        phone: '+91 98765 00001',
        email: 'arjun@occammy.com',
        territory: 'Bassi Block',
        status: 'active',
        assigned_farms: '5',
        farms_visited: '4',
        performance_score: 94,
        total_sales: '₹4.8L',
        joined_date: 'Oct 2023'
    },
    {
        id: '2',
        name: 'Priya Sharma',
        phone: '+91 98765 00002',
        email: 'priya@occammy.com',
        territory: 'Sanganer',
        status: 'active',
        assigned_farms: '5',
        farms_visited: '3',
        performance_score: 88,
        total_sales: '₹3.2L',
        joined_date: 'Jan 2024'
    },
    {
        id: '3',
        name: 'Vikram Singh',
        phone: '+91 98765 00003',
        email: 'vikram@occammy.com',
        territory: 'Amer Block',
        status: 'active',
        assigned_farms: '5',
        farms_visited: '5',
        performance_score: 98,
        total_sales: '₹1.1L',
        joined_date: 'Dec 2023'
    },
    {
        id: '4',
        name: 'Suresh Kumar',
        phone: '+91 98765 00004',
        email: 'suresh@occammy.com',
        territory: 'Chomu',
        status: 'inactive',
        assigned_farms: '5',
        farms_visited: '0',
        performance_score: 45,
        total_sales: '₹0',
        joined_date: 'Mar 2024'
    }
];

export function OfficerList() {
    const [officers, setOfficers] = useState<Officer[]>(DEMO_OFFICERS_ENHANCED);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { token } = useAuthStore();

    const fetchOfficers = async () => {
        try {
            const res = await axios.get('/api/admin/officers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const realOfficers = res.data.data || [];
            if (realOfficers.length > 0) {
                // Merge real officers with enhanced demo data
                const merged = [...realOfficers.map((o: any) => ({
                    ...o,
                    assigned_farms: '5', // Force 5 as target for demo
                    farms_visited: Math.floor(Math.random() * 6).toString(),
                    performance_score: Math.floor(Math.random() * 40) + 60,
                    total_sales: `₹${(Math.random() * 5 + 1).toFixed(1)}L`,
                    joined_date: 'Oct 2023'
                }))];
                DEMO_OFFICERS_ENHANCED.forEach(demo => {
                    if (!merged.find(o => o.phone === demo.phone)) {
                        merged.push(demo);
                    }
                });
                setOfficers(merged);
            } else {
                setOfficers(DEMO_OFFICERS_ENHANCED);
            }
        } catch (error) {
            console.error('Error fetching officers:', error);
            setOfficers(DEMO_OFFICERS_ENHANCED);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOfficers();
    }, []);

    const handleOpenDetail = (officer: Officer) => {
        setSelectedOfficer(officer);
        setIsDetailOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
                    <div>
                        <CardTitle className="text-xl font-bold font-outfit">Team Directory</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Manage {officers.length} Active Agents</p>
                    </div>
                    <div className="flex gap-2">
                        <AccessCodeGenerator />
                        <AddOfficerDialog onSuccess={fetchOfficers} />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-gray-400">Field Officer</TableHead>
                                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-gray-400">Performance</TableHead>
                                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-gray-400">Status</TableHead>
                                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-gray-400">Today's Visits</TableHead>
                                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-gray-400 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && officers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Records...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                officers.map((officer) => (
                                    <TableRow key={officer.id} className="group hover:bg-teal-50/30 transition-colors">
                                        <TableCell>
                                            <div
                                                className="flex items-center gap-3 cursor-pointer"
                                                onClick={() => handleOpenDetail(officer)}
                                            >
                                                <Avatar className="h-10 w-10 border shadow-sm group-hover:scale-110 transition-transform">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${officer.name}`} />
                                                    <AvatarFallback>{officer.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors">{officer.name}</div>
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-tight">
                                                        <MapPin className="h-3 w-3" /> {officer.territory}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 min-w-[100px]">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-gray-400">{officer.performance_score}%</span>
                                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-1000",
                                                                (officer.performance_score || 0) > 90 ? "bg-teal-500" :
                                                                    (officer.performance_score || 0) > 75 ? "bg-yellow-500" : "bg-red-500"
                                                            )}
                                                            style={{ width: `${officer.performance_score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                                                    officer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                )}
                                            >
                                                {officer.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-teal-50 text-teal-700 text-xs font-black px-2 py-1 rounded-lg">
                                                    {officer.farms_visited} / {officer.assigned_farms}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Farms</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-teal-50 rounded-full">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl border-none p-1">
                                                    <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleOpenDetail(officer)} className="rounded-lg font-bold text-xs focus:bg-teal-50 focus:text-teal-700">
                                                        <Award className="mr-2 h-4 w-4" /> View Full Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-lg font-bold text-xs focus:bg-teal-50 focus:text-teal-700">
                                                        <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-lg font-bold text-xs focus:bg-teal-50 focus:text-teal-700">
                                                        <Edit2 className="mr-2 h-4 w-4" /> Edit Territory
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-gray-100" />
                                                    <DropdownMenuItem className="rounded-lg font-bold text-xs text-red-600 focus:bg-red-50 focus:text-red-700">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Deactivate Account
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <OfficerDetailSheet
                officer={selectedOfficer}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    );
}

