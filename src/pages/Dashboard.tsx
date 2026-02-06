import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MapPin,
  Clock,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/types';
import db from '@/db/FieldOpsDB';
import gpsService from '@/services/gpsService';
import syncService from '@/services/syncService';
import { TodaysFarms } from '@/components/Dashboard/TodaysFarms';
import { SyncStatusBar } from '@/components/Sync/SyncStatusBar';
import { ActivityFeed } from '@/components/Dashboard/ActivityFeed';
import { QuickActions } from '@/components/Dashboard/QuickActions';
import { ProfileDrawer } from '@/components/Dashboard/ProfileDrawer';

interface DashboardProps {
  user: { id: string; name: string; email?: string } | null;
  onLogout: () => void;
}

const DEMO_ACTIVITIES: any[] = [
  {
    id: 'demo-1',
    type: 'one-on-one',
    person_name: 'Suresh Kumar',
    village_name: 'Rajpur Village',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    synced: true,
    user_id: 'demo',
    phone_number: '+91 98765 43210',
    duration_minutes: 35,
    topics_discussed: ['Crop rotation benefits', 'Fertilizer application timing', 'Water management'],
    products_mentioned: ['NPK 10-26-26', 'Urea'],
    farmer_concerns: 'Low yield in last season due to pest attack',
    recommendations_given: 'Suggested integrated pest management approach with neem-based solutions',
    next_steps: 'Follow-up visit scheduled for next week to check crop progress',
    photos_taken: 2,
    location_verified: true
  },
  {
    id: 'demo-2',
    type: 'group-meeting',
    person_name: 'Farmer Group Session',
    village_name: 'Kishangarh',
    attendee_count: 15,
    timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    synced: true,
    user_id: 'demo',
    phone_number: '+91 94567 12345',
    representative_name: 'Mohan Lal',
    duration_minutes: 90,
    meeting_topic: 'Organic Farming Practices Workshop',
    topics_discussed: ['Benefits of organic fertilizers', 'Soil health improvement', 'Government subsidies for organic farming'],
    products_demonstrated: ['Bio Fertilizer', 'Vermicompost'],
    questions_answered: 8,
    interest_level: 'High',
    follow_up_leads: 5,
    next_steps: 'Distribute sample kits to interested farmers',
    photos_taken: 5,
    location_verified: true
  },
  {
    id: 'demo-3',
    type: 'one-on-one',
    person_name: 'Ramesh Patel',
    village_name: 'Chandanpur',
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    synced: true,
    user_id: 'demo',
    phone_number: '+91 87654 32109',
    duration_minutes: 25,
    topics_discussed: ['Wheat crop disease identification', 'Pesticide application'],
    products_mentioned: ['Fungicide Spray', 'Zinc Sulphate'],
    farmer_concerns: 'Yellow spots appearing on wheat leaves',
    recommendations_given: 'Identified as zinc deficiency, recommended foliar spray',
    next_steps: 'Check results after 1 week of application',
    photos_taken: 3,
    location_verified: true
  },
  {
    id: 'demo-4',
    type: 'sample-distribution',
    product_name: 'Bio Fertilizer Sample',
    village_name: 'Sharma Farm',
    timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    synced: false,
    user_id: 'demo',
    phone_number: '+91 91234 56789',
    samples_distributed: 3,
    product_type: 'Bio Fertilizer - 500g pack',
    recipients: ['Ravi Sharma', 'Mohan Chand', 'Pradeep Singh'],
    usage_instructions_given: true,
    follow_up_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    notes: 'Farmers were interested in seeing comparison with chemical fertilizers',
    photos_taken: 1,
    location_verified: true
  },
  {
    id: 'demo-5',
    type: 'one-on-one',
    person_name: 'Vikram Singh',
    village_name: 'Patel Agriculture',
    timestamp: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
    synced: true,
    user_id: 'demo',
    phone_number: '+91 99887 76655',
    duration_minutes: 40,
    topics_discussed: ['Sugarcane variety selection', 'Irrigation scheduling', 'Harvesting timing'],
    products_mentioned: ['DAP', 'Potash'],
    farmer_concerns: 'Looking for high-yield sugarcane variety',
    recommendations_given: 'Recommended CO-0238 variety suitable for the region',
    next_steps: 'Connect with local seed supplier',
    photos_taken: 2,
    location_verified: true
  }
];

export function Dashboard({ user, onLogout }: DashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState<DashboardStats>({
    todayMeetings: 0,
    distanceTraveled: 0,
    pendingSync: 0,
  });

  const [activities, setActivities] = useState<any[]>(DEMO_ACTIVITIES);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load dashboard data
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Get real data from DB
      const activityStats = await db.getActivityStats(user.id);
      const distance = await gpsService.getTodaysDistance();
      const todaysActivities = await db.getTodaysActivities(user.id);

      // 2. Get demo activities and handle deletions
      const deletedIds = JSON.parse(localStorage.getItem('deletedActivityIds') || '[]');
      const activeDemoActivities = DEMO_ACTIVITIES.filter(a => !deletedIds.includes(a.id));

      // 3. Calculate combined target stats
      const targetVisits = (todaysActivities?.length || 0) + activeDemoActivities.length;
      const targetPending = (activityStats.pendingCount || 0) + activeDemoActivities.filter(a => !a.synced).length;
      const targetDistance = distance > 0 ? distance : 12.3;

      // 4. Animate stats if it's the first load
      setStats(prev => {
        if (prev.todayMeetings === 0 && prev.distanceTraveled === 0) {
          let currentVisits = 0;
          let currentDistance = 0;
          let currentPending = 0;

          const interval = setInterval(() => {
            let finished = true;
            if (currentVisits < targetVisits) { currentVisits++; finished = false; }
            if (currentDistance < targetDistance) { currentDistance += 0.5; finished = false; }
            if (currentPending < targetPending) { currentPending++; finished = false; }

            setStats({
              todayMeetings: currentVisits,
              distanceTraveled: Math.min(currentDistance, targetDistance),
              pendingSync: currentPending
            });

            if (finished) clearInterval(interval);
          }, 40);
          return prev;
        }

        return {
          todayMeetings: targetVisits,
          distanceTraveled: targetDistance,
          pendingSync: targetPending,
        };
      });

      // 4. Update activities list
      if (todaysActivities && todaysActivities.length > 0) {
        setActivities([...todaysActivities.reverse(), ...activeDemoActivities]);
      } else {
        setActivities(activeDemoActivities);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, [user]);

  useEffect(() => {
    loadData();

    if (isOnline) {
      syncService.sync();
    }

    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData, isOnline]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8 safe-area-top">

      {/* 1. Sync Status Bar */}
      <SyncStatusBar />

      {/* 2. Header & Profile */}
      <div className="bg-teal-700 text-white px-4 pt-4 pb-6 rounded-b-[2rem] shadow-lg relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/icon-192x192.png" alt="Occamy Logo" className="w-12 h-12 rounded-xl shadow-inner bg-white/20 p-1" />
            <div>
              <p className="text-teal-100 text-sm">{t('dashboard.welcomeBack')}</p>
              <h1 className="text-2xl font-bold">{user?.name || 'Field Officer'}</h1>
            </div>
          </div>

          <ProfileDrawer user={user} onLogout={onLogout}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-teal-600 rounded-full">
              <Menu className="h-6 w-6" />
            </Button>
          </ProfileDrawer>
        </div>
      </div>

      {/* 3. Stats Cards (Standard block) */}
      <div className="px-4 mt-4 relative">

        <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl shadow-md border border-gray-100">
          <div className="text-center p-2 rounded-lg active:bg-gray-50 transition-colors" role="button">
            <div className="bg-teal-50 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 text-teal-600">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.todayMeetings}</p>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.visits')}</p>
          </div>

          <div className="text-center p-2 rounded-lg active:bg-gray-50 transition-colors border-l border-r border-gray-100" role="button">
            <div className="bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 text-blue-600">
              <MapPin className="h-4 w-4" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.distanceTraveled.toFixed(1)}</p>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.km')}</p>
          </div>

          <div className="text-center p-2 rounded-lg active:bg-gray-50 transition-colors" role="button">
            <div className="bg-orange-50 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 text-orange-600">
              <Clock className="h-4 w-4" />
            </div>
            <p className={`text-3xl font-bold ${stats.pendingSync > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
              {stats.pendingSync}
            </p>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.queue')}</p>
          </div>
        </div>

        {/* Log Activity Button */}
        <div className="mt-4">
          <QuickActions />
        </div>
      </div>

      <div className="space-y-6 mt-6 px-4">
        {/* 4. Today's Route */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">{t('dashboard.todaysRoute')}</h2>
            <Button
              variant="link"
              className="text-teal-600 h-auto p-0 text-sm"
              onClick={() => navigate('/navigation', { state: { mode: 'viewAll' } })}
            >
              {t('dashboard.viewMap')}
            </Button>
          </div>
          <TodaysFarms />
        </div>

        {/* 5. Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">{t('dashboard.recentActivity')}</h2>
            <Button variant="link" className="text-gray-400 h-auto p-0 text-sm">{t('dashboard.history')}</Button>
          </div>
          <ActivityFeed
            activities={activities}
            onRefresh={loadData}
            onDelete={async (activityId) => {
              // Delete from DB to ensure backend persistence
              await db.deleteActivity(activityId);

              setActivities(prev => prev.filter(a => a.id !== activityId));
              // Persist deletion for demo activities
              const deletedIds = JSON.parse(localStorage.getItem('deletedActivityIds') || '[]');
              if (!deletedIds.includes(activityId)) {
                deletedIds.push(activityId);
                localStorage.setItem('deletedActivityIds', JSON.stringify(deletedIds));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
