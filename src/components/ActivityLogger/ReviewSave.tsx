import { useTranslation } from 'react-i18next';
import { Check, MapPin, User, Users, Package, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityType, ActivityFormData, Location, Photo } from '@/types';

interface ReviewSaveProps {
  type: ActivityType;
  formData: ActivityFormData;
  location: Location | null;
  photos: Photo[];
  onSave: () => void;
  onBack: () => void;
  isSaving: boolean;
}

export function ReviewSave({
  type,
  formData,
  location,
  photos,
  onSave,
  onBack,
  isSaving,
}: ReviewSaveProps) {
  const { t } = useTranslation();

  const getActivityIcon = () => {
    switch (type) {
      case 'one-on-one': return <User className="h-6 w-6" />;
      case 'group-meeting': return <Users className="h-6 w-6" />;
      case 'sample-distribution': return <Package className="h-6 w-6" />;
      case 'sale': return <ShoppingCart className="h-6 w-6" />;
    }
  };

  const renderReviewContent = () => {
    switch (type) {
      case 'one-on-one':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">{t('oneOnOne.personName')}</span>
              <span className="font-medium text-right">{formData.person_name}</span>

              <span className="text-gray-500">{t('oneOnOne.category')}</span>
              <div className="text-right"><Badge variant="secondary">{formData.category}</Badge></div>

              <span className="text-gray-500">Phone</span>
              <span className="text-right">{formData.phone || '-'}</span>

              <span className="text-gray-500">Village</span>
              <span className="text-right">{formData.village_name}</span>

              <span className="text-gray-500">{t('oneOnOne.businessPotential')}</span>
              <span className="font-bold text-teal-600 text-right">{formData.business_potential}/10</span>
            </div>
            {formData.notes && (
              <div className="pt-2 border-t mt-2">
                <span className="text-gray-500 block mb-1 text-xs uppercase">{t('oneOnOne.notes')}</span>
                <p className="text-sm bg-gray-50 p-2 rounded border">{formData.notes}</p>
              </div>
            )}
          </div>
        );

      case 'group-meeting':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">{t('groupMeeting.villageName')}</span>
              <span className="font-medium text-right">{formData.village_name}</span>

              <span className="text-gray-500">{t('groupMeeting.attendeeCount')}</span>
              <span className="font-bold text-teal-600 text-right">{formData.attendee_count}</span>

              <span className="text-gray-500">{t('groupMeeting.meetingType')}</span>
              <div className="text-right"><Badge variant="outline">{formData.meeting_type}</Badge></div>

              <span className="text-gray-500">Interest Level</span>
              <div className="flex justify-end">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < (formData.farmer_interest_level || 0) ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300'}`} />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t">
              <span className="text-gray-500 text-xs block mb-2">KEY TOPICS</span>
              <div className="flex flex-wrap gap-1">
                {formData.key_topics?.map(topic => (
                  <Badge key={topic} variant="secondary" className="text-xs">{topic}</Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'sample-distribution':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">{t('sampleDistribution.product')}</span>
              <span className="font-medium text-right">{formData.product_name}</span>

              <span className="text-gray-500">{t('sampleDistribution.quantity')}</span>
              <span className="font-bold text-teal-600 text-right">{formData.quantity}</span>

              <span className="text-gray-500">{t('sampleDistribution.recipientName')}</span>
              <span className="text-right">{formData.recipient_name}</span>

              <span className="text-gray-500">Feedback Date</span>
              <span className="text-right">{formData.expected_feedback_date ? new Date(formData.expected_feedback_date).toLocaleDateString() : '-'}</span>
            </div>

            <div className="pt-2 border-t">
              <span className="text-gray-500 block mb-1 text-xs uppercase">{t('sampleDistribution.purpose')}</span>
              <p className="text-sm bg-gray-50 p-2 rounded">{formData.purpose}</p>
            </div>
          </div>
        );

      case 'sale':
        const products = formData.products || [];
        const total = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-gray-500">{t('sale.saleType')}</span>
              <Badge>{formData.sale_type}</Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-gray-500">Customer</span>
              <span className="font-medium">{formData.customer_name}</span>
            </div>

            <div>
              <span className="text-xs text-gray-500 uppercase block mb-2">Products</span>
              <div className="border rounded-lg overflow-hidden text-sm">
                <div className="bg-gray-100 p-2 grid grid-cols-6 gap-1 font-medium text-xs">
                  <div className="col-span-3">Item</div>
                  <div className="col-span-1 text-right">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {products.map((p, i) => (
                  <div key={i} className="p-2 grid grid-cols-6 gap-1 border-t border-gray-100">
                    <div className="col-span-3 truncate">
                      {p.sku} <span className="text-gray-400 text-xs">({p.pack_size})</span>
                    </div>
                    <div className="col-span-1 text-right">{p.quantity}</div>
                    <div className="col-span-2 text-right font-medium">₹{(p.quantity * p.unit_price).toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-teal-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-bold">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Paid via {formData.payment_mode}</span>
                <span className="font-bold text-teal-700">- ₹{(formData.amount_paid || 0).toFixed(2)}</span>
              </div>
              {(formData.balance || 0) > 0 && (
                <div className="flex justify-between text-sm text-red-600 border-t border-teal-200 pt-2">
                  <span>Balance Due</span>
                  <span className="font-bold">₹{(formData.balance || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Activity Type Header */}
      <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg">
        <div className="p-2 bg-teal-600 rounded-lg text-white">
          {getActivityIcon()}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-teal-900">
            {t(`activity.${type.replace(/-/g, '')}`)}
          </h3>
          <p className="text-xs text-teal-700">
            {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      {/* Review Card */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 text-gray-800 text-sm">{t('activity.review').toUpperCase()}</h4>
        {renderReviewContent()}
      </Card>

      {/* Photos Preview */}
      {photos.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-gray-800 text-sm">PHOTOS ({photos.length})</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo.thumbnail || photo.data}
                alt={`Evidence ${idx + 1}`}
                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
              />
            ))}
          </div>
        </Card>
      )}

      {/* Location Card */}
      {location && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-teal-600" />
            <span className="font-semibold text-sm">LOCATION</span>
          </div>
          <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Lat: {location.latitude.toFixed(6)}</span>
            <span>Lng: {location.longitude.toFixed(6)}</span>
            <span className="col-span-2 text-xs text-gray-400">Accuracy: ±{Math.round(location.accuracy || 0)}m</span>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={isSaving}>
          Back
        </Button>
        <Button onClick={onSave} className="flex-1" disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {t('activity.saving')}
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Save Activity
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
