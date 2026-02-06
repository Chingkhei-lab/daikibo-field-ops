import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MapPin, Camera, User, Phone, FileText, Check, Loader2 } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhotoCapture } from '@/components/ActivityLogger/PhotoCapture';
import gpsService from '@/services/gpsService';
import db from '@/db/FieldOpsDB';
import { Farm, NewFarmFormData } from '@/types';

interface AddFarmSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (farm: Farm) => void;
}

export function AddFarmSheet({ open, onOpenChange, onSuccess }: AddFarmSheetProps) {
    const [step, setStep] = useState<'capture' | 'details'>('capture');
    const [photoData, setPhotoData] = useState<string | null>(null);
    const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<NewFarmFormData>();

    const handleCapture = async (photo: string) => {
        setPhotoData(photo);
        setIsLocating(true);

        try {
            const loc = await gpsService.getCurrentPosition();
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: loc.coords.accuracy
            });

            // Try to get village name via reverse geocoding (mock for now or basic fetch)
            // For now we'll leave it empty to be filled by user, or mock it if needed.
            // setValue('village', 'Auto-detected Village'); 

            setStep('details');
        } catch (error) {
            toast.error('Failed to get location. Please enable GPS.');
        } finally {
            setIsLocating(false);
        }
    };

    const onSubmit = async (data: NewFarmFormData) => {
        if (!location) {
            toast.error('Location is missing');
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
                type: data.type,
                cattle_count: 0, // Default or derived
                notes: data.notes,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy
                },
                photo_data: photoData || undefined,
                created_at: Date.now(),
                synced: false,
                status: 'pending' // Default status
            };

            await db.saveFarm(newFarm);
            toast.success('New Farm Added Successfully!');

            if (onSuccess) onSuccess(newFarm);
            handleClose();
        } catch (error) {
            console.error('Error saving farm:', error);
            toast.error('Failed to save farm details');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after a delay or immediately
        setTimeout(() => {
            setStep('capture');
            setPhotoData(null);
            setLocation(null);
        }, 300);
    };

    return (
        <Sheet open={open} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add New Farm</SheetTitle>
                </SheetHeader>

                <div className="mt-6">
                    {step === 'capture' ? (
                        <div className="space-y-4">
                            {!isLocating ? (
                                <div className="h-[60vh]">
                                    <PhotoCapture
                                        onCapture={handleCapture}
                                        onCancel={handleClose}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                                    <p className="text-gray-500 font-medium">Acquiring GPS Location...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Photo Preview */}
                            {photoData && (
                                <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100 mb-6 border">
                                    <img src={photoData} alt="Farm" className="w-full h-full object-cover" />
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        GPS Captured
                                    </div>
                                </div>
                            )}

                            {/* Generated Farm ID */}
                            <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600 mb-4">
                                <span className="font-semibold">Generatng ID:</span> FARM-JPR-NEW-...
                            </div>

                            <div>
                                <Label htmlFor="owner_name">Owner Name *</Label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="owner_name"
                                        {...register('owner_name', { required: 'Owner name is required' })}
                                        className="pl-9"
                                        placeholder="e.g. Ram Kumar"
                                    />
                                </div>
                                {errors.owner_name && <p className="text-red-500 text-xs mt-1">{errors.owner_name.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="village">Village *</Label>
                                <div className="relative mt-1">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="village"
                                        {...register('village', { required: 'Village is required' })}
                                        className="pl-9"
                                        placeholder="Village name"
                                    />
                                </div>
                                {errors.village && <p className="text-red-500 text-xs mt-1">{errors.village.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number *</Label>
                                <div className="relative mt-1">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        {...register('phone', { required: 'Phone is required', pattern: { value: /^\d{10}$/, message: '10 digits required' } })}
                                        className="pl-9"
                                        placeholder="10-digit number"
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="type">Farm Type *</Label>
                                <Input
                                    id="type"
                                    type="text"
                                    {...register('type', { required: 'Farm Type is required' })}
                                    className="mt-1"
                                    placeholder="e.g. Dairy, Crop, Poultry"
                                />
                                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <div className="relative mt-1">
                                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Textarea
                                        id="notes"
                                        {...register('notes')}
                                        className="pl-9"
                                        placeholder="e.g. 15 cows, using competitor feed"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('capture')}>
                                    Retake Photo
                                </Button>
                                <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Save Farm
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
