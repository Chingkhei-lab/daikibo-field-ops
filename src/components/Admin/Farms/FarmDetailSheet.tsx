import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Phone,
    MapPin,
    Tractor,
    Calendar,
    FileText,
    History,
    Clover,
    LandPlot,
    User
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface FarmDetailSheetProps {
    farm: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FarmDetailSheet({ farm, open, onOpenChange }: FarmDetailSheetProps) {
    if (!farm) return null;

    const landSize = farm.land_size || 2.5;
    const cattleCount = farm.cattle_count || 4;
    const crops = farm.crops || ['Wheat', 'Mustard'];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-gray-50 border-l border-gray-200 p-0">
                {/* Visual Header */}
                <div className="bg-teal-600 p-8 text-white relative">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Tractor className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black font-outfit uppercase tracking-tight">{farm.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px] font-bold uppercase py-1 px-3">
                                    {farm.type || 'Grain'}
                                </Badge>
                                <span className="text-teal-100 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {farm.village}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Key Farm Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <LandPlot className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Area</span>
                                </div>
                                <div className="text-2xl font-black text-gray-900 leading-none">{landSize} <span className="text-xs text-gray-400">Acres</span></div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
                                        <Clover className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Livestock</span>
                                </div>
                                <div className="text-2xl font-black text-gray-900 leading-none">{cattleCount} <span className="text-xs text-gray-400">Head</span></div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Owner Details */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 border-b pb-2 flex items-center gap-2">
                                <User className="h-4 w-4 text-teal-600" />
                                Owner Information
                            </h3>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border shadow-sm">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${farm.name}`} />
                                    <AvatarFallback>{farm.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-black text-gray-900 leading-none">{farm.name}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-tighter">
                                            <Phone className="h-3 w-3" /> {farm.phone || '+91 99999 00000'}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-tighter">
                                            <Calendar className="h-3 w-3" /> ID: {farm.farm_id || 'FARM-001'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Crop Types */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Clover className="h-4 w-4 text-green-600" />
                            Primary Crops
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {crops.map((crop: string) => (
                                <Badge key={crop} variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold uppercase text-[10px] px-3 py-1">
                                    {crop}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Visit History */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-purple-600" />
                            Recent Field Logs
                        </h3>
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-transparent shadow-sm group hover:border-teal-500/20 transition-all">
                                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-gray-900 truncate">Visit by Arjun Meena</p>
                                            <span className="text-[10px] font-bold text-gray-400 tracking-tighter bg-gray-50 px-2 py-0.5 rounded-full uppercase">
                                                {i === 1 ? 'Yesterday' : 'Last Week'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            {i === 1 ? 'Soil pH levels checked. Advised increasing nitrogen intake.' : 'Sample urea distributed and usage instructions explained.'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Field Notes Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="h-4 w-4 text-teal-600" />
                            Officer Notes
                        </h3>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm italic text-gray-500 text-sm leading-relaxed">
                            "Farmer expresses high interest in bio-organic solutions. Suggest focusing on the green nutrient line in next visit."
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
