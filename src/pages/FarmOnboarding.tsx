import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Camera, MapPin, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { PhotoCapture } from '@/components/ActivityLogger/PhotoCapture';
import { NewFarmFormData, Farm } from '@/types';
import db from '@/db/FieldOpsDB';
import gpsService from '@/services/gpsService';

// Schema (reusing logic from AddFarmSheet)
const farmSchema = z.object({
    owner_name: z.string().min(2, 'Name is required'),
    village: z.string().min(2, 'Village is required'),
    phone: z.string().regex(/^\d{10}$/, 'Valid 10-digit phone number needed'),
    cattle_count: z.number().min(1, 'At least 1 cattle required'),
    type: z.string().default('Dairy'),
    notes: z.string().optional()
});

export function NewFarmPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [photoData, setPhotoData] = useState<string | null>(null);
    const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const { register, handleSubmit, formState: { errors }, trigger } = useForm<NewFarmFormData>({
        resolver: zodResolver(farmSchema),
        defaultValues: {
            cattle_count: 5 // Default
        }
    });

    // Step navigation
    const nextStep = async () => {
        let valid = false;
        if (step === 1) {
            valid = await trigger(['owner_name', 'phone', 'village']);
        } else if (step === 2) {
            valid = await trigger(['cattle_count', 'notes']);
        }

        if (valid) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    // Location Handler
    const handleGetLocation = async () => {
        setIsLocating(true);
        try {
            const loc = await gpsService.getCurrentPosition();
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: loc.coords.accuracy
            });
            toast.success(`Location captured (${loc.coords.accuracy.toFixed(1)}m accuracy)`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to get location. Ensure GPS is on.");
        } finally {
            setIsLocating(false);
        }
    };

    // Photo Handler
    const handlePhotoCapture = (full: string) => {
        setPhotoData(full);
        setIsCameraOpen(false);
    };

    // Final Submission
    const onSubmit = async (data: NewFarmFormData) => {
        if (!location) {
            toast.error("Location is required");
            return;
        }
        if (!photoData) {
            toast.error("Farm photo is required");
            return;
        }

        setIsSaving(true);
        try {
            const farmId = `FARM-JPR-${Date.now().toString().slice(-6)}`;
            const newFarm: Farm = {
                farm_id: farmId,
                owner_name: data.owner_name,
                village: data.village,
                phone: data.phone,
                type: 'Dairy', // Default type
                cattle_count: data.cattle_count,
                notes: data.notes,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy
                },
                photo_data: photoData,
                created_at: Date.now(),
                synced: false,
                status: 'pending'
            };

            await db.saveFarm(newFarm);
            toast.success("Farm registered successfully!");
            navigate('/dashboard'); // Redirect after success
        } catch (error) {
            console.error(error);
            toast.error("Failed to save farm.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isCameraOpen) {
        return <PhotoCapture onCapture={handlePhotoCapture} onCancel={() => setIsCameraOpen(false)} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="font-semibold text-lg">Add New Farm</h1>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        Step {step} of 3
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200">
                <div
                    className="h-full bg-teal-600 transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            <div className="flex-1 p-4 max-w-md mx-auto w-full">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                            <h2 className="font-semibold text-gray-900">Farmer Details</h2>

                            <div className="space-y-2">
                                <Label>Full Name*</Label>
                                <Input
                                    {...register('owner_name')}
                                    placeholder="Enter farmer's name"
                                    className="h-11"
                                />
                                {errors.owner_name && <p className="text-red-500 text-xs">{errors.owner_name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Phone Number*</Label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+91</span>
                                    <Input
                                        {...register('phone')}
                                        type="tel"
                                        placeholder="Mobile Number"
                                        className="rounded-l-none h-11"
                                        maxLength={10}
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Village Name*</Label>
                                <Input
                                    {...register('village')}
                                    placeholder="Enter village name"
                                    className="h-11"
                                />
                                {errors.village && <p className="text-red-500 text-xs">{errors.village.message}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Farm Specifics */}
                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                            <h2 className="font-semibold text-gray-900">Farm Details</h2>

                            <div className="space-y-2">
                                <Label>Total Cattle Count*</Label>
                                <Input
                                    {...register('cattle_count', { valueAsNumber: true })}
                                    type="number"
                                    placeholder="e.g. 5"
                                    className="h-11"
                                />
                                {errors.cattle_count && <p className="text-red-500 text-xs">{errors.cattle_count.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Notes / Observations</Label>
                                <Textarea
                                    {...register('notes')}
                                    placeholder="Any specific observations..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Location & Photos */}
                {step === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Location Card */}
                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">Location</h2>
                                {location && <Check className="h-5 w-5 text-green-600" />}
                            </div>

                            {location ? (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="h-4 w-4 text-green-700" />
                                        <span className="font-medium text-green-900">Location Captured</span>
                                    </div>
                                    <p className="text-xs text-green-800 ml-6">
                                        Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                                        <br />
                                        Accuracy: {location.accuracy?.toFixed(1)}m
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 w-full text-green-700 hover:text-green-800 hover:bg-green-100"
                                        onClick={handleGetLocation}
                                    >
                                        Retake Location
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full h-12 gap-2 border-dashed border-2"
                                    onClick={handleGetLocation}
                                    disabled={isLocating}
                                >
                                    {isLocating ? 'Acquiring GPS...' : (
                                        <>
                                            <MapPin className="h-4 w-4" />
                                            Capture GPS Location
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* Photo Card */}
                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">Farm Photo</h2>
                                {photoData && <Check className="h-5 w-5 text-green-600" />}
                            </div>

                            {photoData ? (
                                <div className="relative rounded-lg overflow-hidden h-48 border">
                                    <img src={photoData} alt="Farm" className="w-full h-full object-cover" />
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="absolute bottom-2 right-2 shadow-sm"
                                        onClick={() => setIsCameraOpen(true)}
                                    >
                                        Retake
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full h-32 gap-2 border-dashed border-2 flex-col"
                                    onClick={() => setIsCameraOpen(true)}
                                >
                                    <Camera className="h-8 w-8 text-gray-400" />
                                    <span className="text-gray-500">Take Photo of Farm</span>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t mt-auto sticky bottom-0">
                <div className="max-w-md mx-auto w-full flex gap-3">
                    {step > 1 && (
                        <Button variant="outline" onClick={prevStep} className="flex-1 h-12 text-base">
                            Back
                        </Button>
                    )}

                    {step < 3 ? (
                        <Button
                            className="flex-1 bg-teal-600 hover:bg-teal-700 h-12 text-base"
                            onClick={nextStep}
                        >
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base"
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSaving || !location || !photoData}
                        >
                            {isSaving ? 'Registering...' : 'Complete Registration'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
