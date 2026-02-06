import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { Users, MapPin, ShoppingBag, Clock, Check, X, ChevronRight, MessageSquare, Camera, Calendar, Tag, FileText, CheckCircle2, Phone, Upload, MoreVertical, Trash2, Star, User, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ActivityFeedProps {
    activities: any[];
    onRefresh: () => void;
    onDelete?: (activityId: string) => void;
}

export function ActivityFeed({ activities, onRefresh, onDelete }: ActivityFeedProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const pullStart = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            pullStart.current = e.touches[0].clientY;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const pullEnd = e.changedTouches[0].clientY;
        const diff = pullEnd - pullStart.current;
        if (diff > 100 && containerRef.current?.scrollTop === 0) {
            onRefresh();
            pullStart.current = 0;
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'one-on-one': return <Users className="h-4 w-4" />;
            case 'group-meeting': return <Users className="h-4 w-4" />;
            case 'sale': return <ShoppingBag className="h-4 w-4" />;
            case 'sample-distribution': return <MapPin className="h-4 w-4" />;
            default: return <MapPin className="h-4 w-4" />;
        }
    };

    const getSyncStatus = (synced: boolean | string) => {
        if (synced === true || synced === 'synced') {
            return {
                icon: <Check className="h-3 w-3 text-green-500" />,
                label: t('activity.updated'),
                color: 'text-green-600 bg-green-50'
            };
        } else if (synced === 'error') {
            return {
                icon: <X className="h-3 w-3 text-red-500" />,
                label: t('activity.failed'),
                color: 'text-red-600 bg-red-50'
            };
        }
        return {
            icon: <Clock className="h-3 w-3 text-orange-500" />,
            label: t('activity.pending'),
            color: 'text-orange-600 bg-orange-50'
        };
    };

    const formatTime = (dateValue: any) => {
        try {
            if (!dateValue) return '--:--';
            const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
            if (!isValid(date)) return '--:--';
            return format(date, 'HH:mm');
        } catch {
            return '--:--';
        }
    };

    const formatDate = (dateValue: any) => {
        try {
            if (!dateValue) return '--';
            const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
            if (!isValid(date)) return '--';
            return format(date, 'MMM d, yyyy');
        } catch {
            return '--';
        }
    };

    const openDetails = (activity: any) => {
        setSelectedActivity(activity);
        setShowDetails(true);
    };

    const handleDeleteClick = (activityId: string) => {
        setActivityToDelete(activityId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (activityToDelete && onDelete) {
            onDelete(activityToDelete);
        }
        setDeleteDialogOpen(false);
        setActivityToDelete(null);
    };

    if (activities.length === 0) {
        return (
            <div
                className="py-8 text-center text-gray-400"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <p>{t('dashboard.noActivities')}</p>
                <p className="text-xs mt-2">{t('activity.pullToRefresh')}</p>
            </div>
        );
    }

    // Helper to get phone number from different field names
    const getPhone = (activity: any) => activity.phone_number || activity.phone || null;

    return (
        <>
            <div
                ref={containerRef}
                className="space-y-4 max-h-[500px] overflow-y-auto pb-20"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="relative space-y-6 pt-2">
                    {activities.map((activity, idx) => {
                        const activityId = activity.id || activity.temp_id || idx;
                        const timestamp = activity.timestamp || activity.created_at;
                        const synced = activity.synced ?? activity.status;
                        const villageName = activity.village_name || activity.details?.village_name || t('common.unknownLocation');
                        const personName = activity.person_name || activity.product_name || activity.customer_name || activity.recipient_name || activity.details?.person_name || t('common.noDetails');
                        const syncStatus = getSyncStatus(synced);

                        return (
                            <Card
                                key={activityId}
                                className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => openDetails(activity)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
                                            {getActivityIcon(activity.type)}
                                            {activity.type.replace('-', ' ')}
                                        </Badge>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {formatTime(timestamp)}
                                        </span>
                                    </div>
                                    {/* Sync Status Badge */}
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${syncStatus.color}`}>
                                        {syncStatus.icon}
                                        <span>{syncStatus.label}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {villageName}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                            {personName}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                        {/* Three dots menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(activityId);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {t('activity.delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* View Full History Button */}
            <div className="mt-4 text-center">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/activities')}
                >
                    <History className="h-4 w-4 mr-2" />
                    {t('activity.fullHistory')}
                </Button>
            </div>


            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('activity.deleteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('activity.deleteConfirmDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Activity Details Sheet */}
            <Sheet open={showDetails} onOpenChange={setShowDetails}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-auto">
                    {selectedActivity && (
                        <>
                            <SheetHeader className="pb-4 border-b">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        {getActivityIcon(selectedActivity.type)}
                                        {selectedActivity.type.replace('-', ' ')}
                                    </Badge>
                                    {/* Sync Status to Manager */}
                                    {(() => {
                                        const syncStatus = getSyncStatus(selectedActivity.synced);
                                        return (
                                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${syncStatus.color}`}>
                                                {syncStatus.icon}
                                                <span className="text-xs font-bold">
                                                    {selectedActivity.synced ? t('activity.updatedToManager') : t('activity.pendingUpdate')}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <SheetTitle className="text-xl mt-2">
                                    {selectedActivity.village_name || 'Activity Details'}
                                </SheetTitle>
                                <p className="text-gray-500 text-sm">
                                    {formatDate(selectedActivity.timestamp)} at {formatTime(selectedActivity.timestamp)}
                                </p>
                            </SheetHeader>

                            <div className="py-4 space-y-4">
                                {/* === ONE-ON-ONE FIELDS === */}
                                {selectedActivity.type === 'one-on-one' && (
                                    <>
                                        {/* Person Name */}
                                        {selectedActivity.person_name && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-teal-100 p-2 rounded-lg">
                                                    <User className="h-5 w-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('oneOnOne.personName')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.person_name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Category */}
                                        {selectedActivity.category && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-purple-100 p-2 rounded-lg">
                                                    <Tag className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('oneOnOne.category')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.category}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Phone */}
                                        {getPhone(selectedActivity) && (
                                            <a
                                                href={`tel:${getPhone(selectedActivity)}`}
                                                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                                            >
                                                <div className="bg-green-500 p-2 rounded-full">
                                                    <Phone className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('oneOnOne.contact')}</p>
                                                    <p className="font-semibold text-green-700">{getPhone(selectedActivity)}</p>
                                                </div>
                                                <span className="text-green-600 text-sm font-medium">Call</span>
                                            </a>
                                        )}

                                        {/* Village */}
                                        {selectedActivity.village_name && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <MapPin className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">Village</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.village_name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Business Potential */}
                                        {(selectedActivity.business_potential !== undefined && selectedActivity.business_potential !== null) && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-amber-100 p-2 rounded-lg">
                                                    <Star className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('oneOnOne.businessPotential')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.business_potential} / 10</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {selectedActivity.notes && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('oneOnOne.notes')}</p>
                                                <p className="text-gray-800">{selectedActivity.notes}</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* === GROUP MEETING FIELDS === */}
                                {selectedActivity.type === 'group-meeting' && (
                                    <>
                                        {/* Village */}
                                        {selectedActivity.village_name && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <MapPin className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('groupMeeting.villageName')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.village_name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Attendee Count */}
                                        {selectedActivity.attendee_count && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-teal-100 p-2 rounded-lg">
                                                    <Users className="h-5 w-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.attendees')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.attendee_count} {t('activity.people')}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Meeting Type */}
                                        {selectedActivity.meeting_type && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-purple-100 p-2 rounded-lg">
                                                    <MessageSquare className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('groupMeeting.meetingType')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.meeting_type}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Key Topics */}
                                        {selectedActivity.key_topics && selectedActivity.key_topics.length > 0 && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-indigo-100 p-2 rounded-lg">
                                                    <Tag className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.keyTopics')}</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {selectedActivity.key_topics.map((topic: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Interest Level */}
                                        {selectedActivity.farmer_interest_level && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-yellow-100 p-2 rounded-lg">
                                                    <Star className="h-5 w-5 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.interestLevel')}</p>
                                                    <div className="flex gap-1 mt-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`h-5 w-5 ${star <= selectedActivity.farmer_interest_level ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* === SAMPLE DISTRIBUTION FIELDS === */}
                                {selectedActivity.type === 'sample-distribution' && (
                                    <>
                                        {/* Product Name */}
                                        {selectedActivity.product_name && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-green-100 p-2 rounded-lg">
                                                    <ShoppingBag className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('sampleDistribution.product')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.product_name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Quantity */}
                                        {selectedActivity.quantity && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <Tag className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('sampleDistribution.quantity')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.quantity} {t('activity.people') === 'people' ? 'units' : 'यूनिट'}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Recipient */}
                                        {selectedActivity.recipient_name && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-teal-100 p-2 rounded-lg">
                                                    <User className="h-5 w-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.recipient')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.recipient_name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Purpose */}
                                        {selectedActivity.purpose && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-purple-100 p-2 rounded-lg">
                                                    <FileText className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('sampleDistribution.purpose')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.purpose}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* === SALE FIELDS === */}
                                {selectedActivity.type === 'sale' && (
                                    <>
                                        {/* Sale Type */}
                                        {selectedActivity.sale_type && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <Tag className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.saleType')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.sale_type}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Customer Name */}
                                        {selectedActivity.customer_name && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-teal-100 p-2 rounded-lg">
                                                    <User className="h-5 w-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.customer')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.customer_name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Mode */}
                                        {selectedActivity.payment_mode && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-green-100 p-2 rounded-lg">
                                                    <ShoppingBag className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.paymentMode')}</p>
                                                    <p className="font-semibold text-gray-900">{selectedActivity.payment_mode}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* === DEMO ACTIVITY EXTRA FIELDS (for demo data) === */}
                                {selectedActivity.topics_discussed && selectedActivity.topics_discussed.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg">
                                            <MessageSquare className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.topicsDiscussed')}</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {selectedActivity.topics_discussed.map((topic: string, i: number) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedActivity.farmer_concerns && (
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                        <p className="text-xs text-orange-600 uppercase font-bold mb-1">{t('activity.concerns')}</p>
                                        <p className="text-gray-800">{selectedActivity.farmer_concerns}</p>
                                    </div>
                                )}

                                {selectedActivity.recommendations_given && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">{t('activity.recommendations')}</p>
                                        <p className="text-gray-800">{selectedActivity.recommendations_given}</p>
                                    </div>
                                )}

                                {selectedActivity.next_steps && (
                                    <div className="flex items-start gap-3">
                                        <div className="bg-indigo-100 p-2 rounded-lg">
                                            <Calendar className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">{t('activity.nextSteps')}</p>
                                            <p className="text-gray-800">{selectedActivity.next_steps}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Photos & Verification */}
                                {(selectedActivity.photos?.length > 0 || selectedActivity.photos_taken || selectedActivity.location_verified) && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            {(selectedActivity.photos?.length > 0 || selectedActivity.photos_taken) && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Camera className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        {selectedActivity.photos?.length || selectedActivity.photos_taken} {t('activity.photos')}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedActivity.location_verified && (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="text-sm">{t('activity.locationVerified')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Display actual photos if available */}
                                        {selectedActivity.photos?.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {selectedActivity.photos.map((photo: any, idx: number) => (
                                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                                                        <img
                                                            src={photo.thumbnail || photo.data}
                                                            alt={`Activity photo ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="pt-4 border-t space-y-2">
                                {/* Update to Manager Button - only for pending */}
                                {!selectedActivity.synced && (
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => {
                                            alert(t('activity.saved'));
                                            setShowDetails(false);
                                        }}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {t('activity.updateToManager')}
                                    </Button>
                                )}
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => setShowDetails(false)}
                                >
                                    {t('common.close')}
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
