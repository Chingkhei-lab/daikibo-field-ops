import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    LayoutDashboard,
    Map,
    Users,
    ClipboardList,
    MapPin,
    BarChart,
    Settings,
    Search,
    Bell,
    Menu,
    ChevronDown,
    LogOut,
    Tractor,
    Loader2,
    User,
    Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface AdminLayoutProps {
    onLogout: () => void;
}

export function AdminLayout({ onLogout }: AdminLayoutProps) {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore(state => state.user);
    const { token } = useAuthStore();

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ officers: any[], farms: any[] }>({ officers: [], farms: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 1) {
                setIsSearching(true);
                try {
                    const res = await axios.get(`/api/admin/search?q=${searchQuery}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSearchResults(res.data.data);
                    setShowResults(true);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults({ officers: [], farms: [] });
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, token]);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Map, label: 'Live Tracking', path: '/admin/tracking' },
        { icon: Users, label: 'Officers', path: '/admin/officers' },
        { icon: Tractor, label: 'Farm Database', path: '/admin/farms' },
        { icon: MapPin, label: 'Assignments', path: '/admin/assignments' },
        { icon: ClipboardList, label: 'Activities', path: '/admin/activities' },
        { icon: BarChart, label: 'Analytics', path: '/admin/analytics' },
    ];
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            <div className="p-6 border-b border-gray-800 flex items-center gap-2">
                <div className="bg-teal-500 rounded-lg p-1">
                    <Map className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight font-outfit">Occamy Admin</span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Button
                            key={item.path}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all font-medium",
                                isActive && "bg-teal-600 text-white hover:bg-teal-700 shadow-md"
                            )}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-3 border border-gray-700">
                    <Avatar className="h-10 w-10 border-2 border-teal-500 shadow-sm">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=teal&color=fff`} />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate leading-none mb-1">{user?.name}</p>
                        <p className="text-[10px] text-gray-400 truncate uppercase tracking-widest font-semibold">{user?.role}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex font-inter">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 fixed inset-y-0 z-50 shadow-2xl">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="bg-white/80 backdrop-blur-md border-b h-16 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Mobile Sidebar Trigger */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-64 border-r-0 bg-gray-900">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>

                        <div className="relative hidden md:block w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                            <Input
                                placeholder="Find officer, farm, or village..."
                                className="pl-10 bg-gray-100 border-none focus:bg-white transition-all rounded-full h-10 ring-teal-500/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            />

                            {/* Search Results Dropdown */}
                            {showResults && (
                                <Card className="absolute top-12 left-0 right-0 shadow-2xl border-none z-50 max-h-[400px] overflow-y-auto rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                    <CardContent className="p-2">
                                        {searchResults.officers.length > 0 && (
                                            <div className="mb-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-1 tracking-wider">Officers</p>
                                                {searchResults.officers.map(o => (
                                                    <div
                                                        key={o.id}
                                                        className="flex items-center gap-3 p-3 hover:bg-teal-50 rounded-xl cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            navigate(`/admin/officers`);
                                                            setShowResults(false);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="bg-teal-100 p-1.5 rounded-lg text-teal-600">
                                                            <Users className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{o.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{o.territory}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {searchResults.farms.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-1 tracking-wider">Farms</p>
                                                {searchResults.farms.map(f => (
                                                    <div
                                                        key={f.id}
                                                        className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            navigate(`/admin/farms`);
                                                            setShowResults(false);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                                                            <MapPin className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{f.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{f.village}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {searchResults.officers.length === 0 && searchResults.farms.length === 0 && !isSearching && (
                                            <div className="p-8 text-center text-gray-400">
                                                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs font-medium">No results found for "{searchQuery}"</p>
                                            </div>
                                        )}

                                        {isSearching && (
                                            <div className="p-4 text-center">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-teal-500" />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-teal-600 transition-colors">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 pl-2 pr-1 hover:bg-gray-100/50 rounded-xl transition-all">
                                    <Avatar className="h-8 w-8 shadow-sm">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=teal&color=fff`} />
                                        <AvatarFallback>AD</AvatarFallback>
                                    </Avatar>
                                    <span className="hidden md:inline font-bold text-xs text-gray-700">{user?.name}</span>
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-2xl border-none">
                                <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-100" />
                                <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="rounded-lg p-2 font-medium focus:bg-teal-50 focus:text-teal-700 cursor-pointer">
                                    <User className="h-4 w-4 mr-2" /> Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="rounded-lg p-2 font-medium focus:bg-teal-50 focus:text-teal-700 cursor-pointer">
                                    <Settings className="h-4 w-4 mr-2" /> Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-100" />
                                <DropdownMenuItem
                                    onClick={() => {
                                        const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
                                        i18n.changeLanguage(nextLang);
                                        toast.success(nextLang === 'hi' ? 'भाषा बदलकर हिंदी कर दी गई' : 'Language changed to English');
                                    }}
                                    className="rounded-lg p-2 font-medium focus:bg-teal-50 focus:text-teal-700 cursor-pointer"
                                >
                                    <Globe className="h-4 w-4 mr-2" />
                                    {i18n.language === 'hi' ? 'English (अंग्रेज़ी)' : 'Hindi (हिंदी)'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-100" />
                                <DropdownMenuItem onClick={onLogout} className="rounded-lg p-2 font-bold text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8 overflow-auto bg-gray-50/50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
