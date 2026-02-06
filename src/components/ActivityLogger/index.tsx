import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ActivityType, ActivityFormData, Location, Photo as PhotoType } from '@/types';
import { ActivityTypeSelector } from './ActivityTypeSelector';
import { DynamicForm } from './DynamicForm';
import { PhotoCapture } from './PhotoCapture';
import { LocationConfirmation } from './LocationConfirmation';
import { ReviewSave } from './ReviewSave';
import db from '@/db/FieldOpsDB';
import { generateTempId } from '@/lib/utils';

type Step = 'type' | 'form' | 'photos' | 'location' | 'review';

interface ActivityLoggerProps {
  userId: string;
}

export function ActivityLogger({ userId }: ActivityLoggerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>({} as ActivityFormData);
  const [photos, setPhotos] = useState<PhotoType[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  const steps: { key: Step; label: string }[] = [
    { key: 'type', label: t('activity.selectType') },
    { key: 'form', label: 'Details' },
    { key: 'photos', label: 'Photos' },
    { key: 'location', label: t('activity.confirmLocation') },
    { key: 'review', label: t('activity.review') },
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.key === currentStep);

  const handleTypeSelect = (type: ActivityType) => {
    setSelectedType(type);
    setFormData({ type });
    setCurrentStep('form');
  };

  const handleFormSubmit = (data: ActivityFormData) => {
    setFormData(data);
    setCurrentStep('photos');
  };

  const handlePhotoCapture = async (photoData: string, thumbnail: string) => {
    const tempId = generateTempId();
    const newPhoto: PhotoType = {
      temp_id: tempId,
      activity_temp_id: '', // Will be set when activity is saved
      data: photoData,
      thumbnail,
      captured_at: Date.now(),
      synced: false,
    };

    setPhotos([...photos, newPhoto]);
    setShowPhotoCapture(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleLocationConfirm = (loc: Location) => {
    setLocation(loc);
    setCurrentStep('review');
  };

  const handleSave = async () => {
    if (!selectedType || !location) return;

    setIsSaving(true);

    try {
      const activityTempId = generateTempId();

      // Update photos with activity temp id
      const photosWithActivityId = photos.map(p => ({
        ...p,
        activity_temp_id: activityTempId,
      }));

      // Save photos to DB
      for (const photo of photosWithActivityId) {
        await db.savePhoto(photo);
      }

      // Create activity object
      const baseActivity = {
        temp_id: activityTempId,
        user_id: userId,
        type: selectedType,
        status: 'pending' as const,
        location,
        created_at: Date.now(),
        updated_at: Date.now(),
        photo_ids: photosWithActivityId.map(p => p.temp_id),
      };

      // Add type-specific fields
      let activity;
      switch (selectedType) {
        case 'one-on-one':
          activity = {
            ...baseActivity,
            type: 'one-on-one' as const,
            person_name: formData.person_name || '',
            category: formData.category || 'Farmer',
            phone: formData.phone,
            village_name: formData.village_name || '',
            business_potential: formData.business_potential || 0,
            notes: formData.notes,
          };
          break;
        case 'group-meeting':
          activity = {
            ...baseActivity,
            type: 'group-meeting' as const,
            village_name: formData.village_name || '',
            attendee_count: formData.attendee_count || 0,
            meeting_type: formData.meeting_type || 'Awareness',
            key_topics: formData.key_topics || [],
            farmer_interest_level: formData.farmer_interest_level || 3,
          };
          break;
        case 'sample-distribution':
          activity = {
            ...baseActivity,
            type: 'sample-distribution' as const,
            product_name: formData.product_name || '',
            quantity: formData.quantity || 0,
            recipient_name: formData.recipient_name || '',
            purpose: formData.purpose || '',
            expected_feedback_date: formData.expected_feedback_date,
          };
          break;
        case 'sale':
          // Calculate totals again to be safe
          const products = formData.products || [];
          const amountPaid = formData.amount_paid || 0;
          const grandTotal = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);

          activity = {
            ...baseActivity,
            type: 'sale' as const,
            sale_type: formData.sale_type || 'B2C',
            customer_name: formData.customer_name || 'Counter Sale',
            products: products,
            payment_mode: formData.payment_mode || 'Cash',
            amount_paid: amountPaid,
            balance: formData.payment_mode === 'Part-Payment' ? grandTotal - amountPaid : 0,
            unit_price: 0, // Legacy field filler
            quantity: 0, // Legacy field filler
            total_amount: grandTotal, // Keep total amount for dashboard stats
            product_sku: products[0]?.sku || '', // Legacy filler
            pack_size: products[0]?.pack_size || '', // Legacy filler
          };
          break;
      }

      // Save activity to DB
      await db.saveActivity(activity as any);

      toast.success(t('activity.saved'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save activity:', error);
      toast.error('Failed to save activity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'type':
        return (
          <ActivityTypeSelector
            selected={selectedType}
            onSelect={handleTypeSelect}
          />
        );

      case 'form':
        return (
          <div className="space-y-4">
            <DynamicForm
              type={selectedType!}
              onSubmit={handleFormSubmit}
              defaultValues={formData}
            />
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('type')}
                className="flex-1"
              >
                {t('activity.back')}
              </Button>
              <Button
                type="submit"
                form="activity-form"
                className="flex-1"
              >
                {t('activity.next')}
              </Button>
            </div>
          </div>
        );

      case 'photos':
        if (showPhotoCapture) {
          return (
            <PhotoCapture
              onCapture={handlePhotoCapture}
              onCancel={() => setShowPhotoCapture(false)}
            />
          );
        }
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square group">
                  <img
                    src={photo.thumbnail || photo.data}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90"
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {photos.length < 4 && (
                <button
                  onClick={() => setShowPhotoCapture(true)}
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors"
                >
                  <Camera className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Add Photo</span>
                </button>
              )}
            </div>

            <p className="text-sm text-gray-500 text-center">
              {photos.length === 0 ? "Take at least one photo (optional)" : `${photos.length} photo(s) added`}
            </p>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('form')}
                className="flex-1"
              >
                {t('activity.back')}
              </Button>
              <Button
                onClick={() => setCurrentStep('location')}
                className="flex-1"
              >
                {t('activity.next')}
              </Button>
            </div>
          </div>
        );

      case 'location':
        return (
          <LocationConfirmation
            onConfirm={handleLocationConfirm}
            onBack={() => setCurrentStep('photos')}
          />
        );

      case 'review':
        return (
          <ReviewSave
            type={selectedType!}
            formData={formData}
            location={location}
            photos={photos}
            onSave={handleSave}
            onBack={() => setCurrentStep('location')}
            isSaving={isSaving}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 safe-area-top safe-area-bottom pb-20">
      {/* Header */}
      <div className="bg-teal-700 text-white px-4 py-4 safe-area-x sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-teal-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">{t('activity.newActivity')}</h1>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white px-4 py-3 border-b safe-area-x">
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, idx) => {
            const currentIdx = getCurrentStepIndex();
            const isActive = idx === currentIdx;
            const isCompleted = idx < currentIdx;

            return (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isActive
                      ? 'bg-teal-600 text-white shadow-md scale-110'
                      : isCompleted
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-4 h-0.5 mx-1 transition-colors ${isCompleted ? 'bg-teal-600' : 'bg-gray-200'
                      }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-600 mt-2 font-medium">
          {steps.find(s => s.key === currentStep)?.label}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 safe-area-x">
        <Card className="p-4 shadow-sm border-0 sm:border">
          {renderStepContent()}
        </Card>
      </div>
    </div>
  );
}

export default ActivityLogger;
