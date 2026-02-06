import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Languages,
    ShieldCheck,
    Lock,
    ArrowRight,
    Loader2,
    CheckCircle2,
    ChevronLeft,
    Eye,
    EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export function RegisterScreen() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        territory: '',
        language: 'en',
        adminCode: '',
        password: '',
        confirmPassword: '',
        role: 'field_officer'
    });

    const [managerInfo, setManagerInfo] = useState<{ region: string; manager_name: string } | null>(null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const verifyAdminCode = async () => {
        if (!formData.adminCode) return false;
        setIsLoading(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
            const res = await axios.post(`${API_BASE_URL}/auth/verify-code`, { code: formData.adminCode });
            if (res.data.success) {
                setManagerInfo(res.data.data);
                toast.success(`Verified: ${res.data.data.manager_name}`);
                return true;
            }
        } catch (error) {
            toast.error('Invalid Admin Code. Please contact your manager.');
            setManagerInfo(null);
            return false;
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const handleSubmit = async () => {
        // Validate all fields
        if (!formData.name || !formData.phone || !formData.email || !formData.territory || !formData.adminCode || !formData.password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        // Verify code first
        const isValidCode = await verifyAdminCode();
        if (!isValidCode) return;

        setIsLoading(true);
        try {
            const payload = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                territory: formData.territory,
                language: formData.language,
                adminCode: formData.adminCode,
                password: formData.password,
                role: 'field_officer'



            const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
                const res = await axios.post(`${API_BASE_URL}/auth/register`, payload);

                if(res.data.success && res.data.token) {
                    login({
                        ...res.data.user,
                        token: res.data.token
                    });

            toast.success('Registration successful! Welcome aboard.');
            navigate('/dashboard');
        } else {
            if (res.data.user?.status === 'pending') {
                setStep(2);
            } else {
                toast.success('Registration successful!');
                navigate('/login');
            }
        }
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
};

// Success/Pending Screen
if (step === 2) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6 animate-in zoom-in duration-300">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Sent!</h2>
                    <p className="text-gray-600">
                        Your registration request has been sent to <strong>{managerInfo?.manager_name || 'Admin'}</strong>.
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                        You will receive login credentials within 24 hours once approved.
                    </p>
                </div>
                <Button className="w-full" onClick={() => navigate('/login')}>
                    Back to Login
                </Button>
            </Card>
        </div>
    );
}

return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex flex-col">
        {/* Header */}
        <div className="bg-teal-700/50 p-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-teal-700" onClick={() => navigate('/login')}>
                <ChevronLeft className="h-6 w-6" />
            </Button>
            <span className="font-semibold text-lg text-white">New Officer Registration</span>
        </div>

        <div className="flex-1 p-4 flex items-center justify-center">
            <div className="w-full max-w-md">
                <Card className="p-6 space-y-5 shadow-xl">
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1">
                            <Label>Full Name (as per ID) *</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="e.g. Rahul Verma"
                                    className="pl-10"
                                    value={formData.name}
                                    onChange={e => handleInputChange('name', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Mobile */}
                        <div className="space-y-1">
                            <Label>Mobile Number *</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="9876543210"
                                    className="pl-10"
                                    type="tel"
                                    maxLength={10}
                                    value={formData.phone}
                                    onChange={e => handleInputChange('phone', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <Label>Email Address *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="officer@example.com"
                                    className="pl-10"
                                    type="email"
                                    value={formData.email}
                                    onChange={e => handleInputChange('email', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Territory */}
                        <div className="space-y-1">
                            <Label>Territory *</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                                <Select
                                    value={formData.territory}
                                    onValueChange={val => handleInputChange('territory', val)}
                                >
                                    <SelectTrigger className="pl-10">
                                        <SelectValue placeholder="Select Region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Jaipur">Jaipur</SelectItem>
                                        <SelectItem value="Indore">Indore</SelectItem>
                                        <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Language */}
                        <div className="space-y-1">
                            <Label>Preferred Language</Label>
                            <div className="relative">
                                <Languages className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                                <Select
                                    value={formData.language}
                                    onValueChange={val => handleInputChange('language', val)}
                                >
                                    <SelectTrigger className="pl-10">
                                        <SelectValue placeholder="Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Admin Code */}
                        <div className="space-y-1">
                            <Label>Admin Code *</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="e.g. ABC123"
                                    className="pl-10 uppercase"
                                    value={formData.adminCode}
                                    onChange={e => handleInputChange('adminCode', e.target.value.toUpperCase())}
                                />
                            </div>
                            <p className="text-xs text-gray-500">Ask your manager for this code.</p>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <Label>Password *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="At least 6 characters"
                                    className="pl-10 pr-10"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={e => handleInputChange('password', e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <Label>Confirm Password *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Confirm your password"
                                    className="pl-10"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={e => handleInputChange('confirmPassword', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Button className="w-full h-12 text-lg" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <>Register <ArrowRight className="ml-2 h-5 w-5" /></>}
                    </Button>
                </Card>
            </div>
        </div>

        {/* Footer */}
        <p className="text-center text-teal-100 text-sm py-4">
            © 2024 Occamy Field Ops. All rights reserved.
        </p>
    </div>
);
}
