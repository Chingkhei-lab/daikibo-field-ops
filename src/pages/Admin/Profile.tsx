import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Assuming you have an Input component
import { Label } from "@/components/ui/label"; // Assuming you have a Label component
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building, Globe, MapPin, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    territory?: string;
    organization?: string;
    website?: string;
}

export function ProfilePage() {
    const { token } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // We can reuse the /me endpoint if it returns all fields, 
                // or create a specific /profile endpoint. 
                // For now, let's assume /me returns what we need or we update it.
                // Actually /me in auth routes returns limited info. 
                // Let's call /api/admin/me-full which we might need to make,
                // OR just assume /api/auth/me returns it if we update the query.

                // Let's verify what /auth/me returns. It selects id, email, name, role. 
                // We should probably update /auth/me to return everything.

                const res = await axios.get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data.user);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!profile) return <div>Failed to load profile</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Info Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`} />
                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-xl">{profile.name}</CardTitle>
                            <CardDescription className="capitalize">{profile.role.replace('_', ' ')}</CardDescription>
                            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 hover:bg-green-100">
                                Active Account
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-2">
                        <div className="grid gap-2">
                            <Label>Email Address</Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded border">
                                <Mail className="h-4 w-4" />
                                {profile.email}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Phone Number</Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded border">
                                <Phone className="h-4 w-4" />
                                {profile.phone || 'Not set'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Organization Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>Company information associated with this account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Company Name</Label>
                            <div className="flex items-center gap-2 text-sm font-medium bg-muted/50 p-3 rounded border">
                                <Building className="h-4 w-4 text-blue-600" />
                                {profile.organization || 'N/A'}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Website</Label>
                            <div className="flex items-center gap-2 text-sm font-medium bg-muted/50 p-3 rounded border">
                                <Globe className="h-4 w-4 text-blue-600" />
                                {profile.website ? (
                                    <a href={`https://${profile.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                        {profile.website}
                                    </a>
                                ) : 'N/A'}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Primary Territory</Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded border">
                                <MapPin className="h-4 w-4" />
                                {profile.territory || 'Global / HQ'}
                            </div>
                        </div>

                        <div className="pt-2">
                            <p className="text-xs text-muted-foreground italic">
                                * To change these details, please contact system support.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
