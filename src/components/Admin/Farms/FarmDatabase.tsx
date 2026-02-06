import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Tractor, Filter } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { FarmDetailSheet } from "./FarmDetailSheet";

interface Farm {
    id: string;
    farm_id?: string;
    name: string;
    village: string;
    type: string;
    land_size: number;
    cattle_count?: number;
    activity_status: string;
    created_at: string;
    phone?: string;
}

const VILLAGES = ["Bassi", "Chomu", "Amer", "Sanganer", "Phagi", "Jamwa Ramgarh", "Dudu", "Kotputli"];
const FARM_TYPES = ["Grain", "Dairy", "Fruit", "Vegetable", "Organic"];

const DEMO_FARMS: Farm[] = Array.from({ length: 30 }).map((_, i) => ({
    id: `demo-f-${i + 1}`,
    farm_id: `FARM-RJ-${(100 + i).toString()}`,
    name: ["Ram Singh", "Manoj Kumar", "Suresh Meena", "Gopal Lal", "Anita Devi", "Sunita Sharma", "Om Prakash", "Kailash Chand"][i % 8] + (i > 7 ? ` ${Math.floor(i / 8) + 1}` : ""),
    village: VILLAGES[i % VILLAGES.length],
    type: FARM_TYPES[i % FARM_TYPES.length],
    land_size: parseFloat((Math.random() * 8 + 1).toFixed(1)),
    cattle_count: Math.floor(Math.random() * 10) + 2,
    activity_status: i % 5 === 0 ? "Pending" : "Verified",
    created_at: new Date(Date.now() - (i * 86400000 * 2)).toISOString(),
    phone: `+91 9${Math.floor(Math.random() * 900000000 + 100000000)}`
}));

export function FarmDatabase() {
    const { token } = useAuthStore();
    const [farms, setFarms] = useState<Farm[]>(DEMO_FARMS);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        const fetchFarms = async () => {
            setLoading(true);
            try {
                const res = await axios.get("/api/farms", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    const realFarms = res.data.data || [];
                    const merged = [...realFarms];
                    DEMO_FARMS.forEach(demo => {
                        if (!merged.find(f => f.id === demo.id)) {
                            merged.push(demo);
                        }
                    });
                    setFarms(merged);
                }
            } catch (error) {
                console.error("Failed to fetch farms", error);
                setFarms(DEMO_FARMS);
            } finally {
                setLoading(false);
            }
        };
        fetchFarms();
    }, [token]);

    const handleOpenDetail = (farm: Farm) => {
        setSelectedFarm(farm);
        setIsDetailOpen(true);
    };

    const filteredFarms = farms.filter(farm =>
        farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farm.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farm.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 font-outfit uppercase">Farm Database</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider">Directory of {farms.length} Registered Farming Partners</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search farmer, village or type..."
                            className="pl-10 h-11 bg-white shadow-sm border-gray-100 rounded-xl focus:ring-teal-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                        <Filter className="h-4 w-4 mr-2" /> Filters
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading && farms.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border shadow-sm" />
                    ))
                ) : filteredFarms.length > 0 ? (
                    filteredFarms.map((farm) => (
                        <Card
                            key={farm.id}
                            className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden rounded-2xl bg-white border border-transparent hover:border-teal-500/20"
                            onClick={() => handleOpenDetail(farm)}
                        >
                            <div className="h-1 bg-teal-500 w-0 group-hover:w-full transition-all duration-300" />
                            <CardHeader className="pb-3 px-6 pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-teal-50 p-3 rounded-2xl text-teal-600 transition-transform group-hover:scale-110">
                                            <Tractor className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black text-gray-900 leading-none">{farm.name}</CardTitle>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2">
                                                <MapPin className="h-3 w-3" />
                                                {farm.village}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="capitalize text-[10px] font-black bg-blue-50 text-blue-700 border-none px-3 py-1 rounded-full uppercase tracking-tighter">
                                        {farm.type || 'Grain'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="px-6 pb-6 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 transition-colors group-hover:bg-white">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Land Size</p>
                                        <p className="text-sm font-black text-gray-700">{farm.land_size || '2.5'} <span className="text-[10px] text-gray-400">Acres</span></p>
                                    </div>
                                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 transition-colors group-hover:bg-white">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                            <p className="text-sm font-black text-gray-700 uppercase tracking-tighter">Healthy</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Reg: {new Date(farm.created_at).toLocaleDateString()}</p>
                                    <Button variant="ghost" size="sm" className="h-8 text-teal-600 font-black hover:bg-teal-50 rounded-full px-4 text-[10px] uppercase tracking-widest transition-all group-hover:gap-2">
                                        View Details <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                        <Tractor className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No farms found matching your search</p>
                    </div>
                )}
            </div>

            <FarmDetailSheet
                farm={selectedFarm}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    );
}

