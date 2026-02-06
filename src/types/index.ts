export type ActivityType = 'one-on-one' | 'group-meeting' | 'sample-distribution' | 'sale';

export type ActivityStatus = 'pending' | 'synced' | 'error';

export type UserCategory = 'Farmer' | 'Seller' | 'Influencer';

export type MeetingType = 'Awareness' | 'Product Demo' | 'Training' | 'Feedback';

export type SaleType = 'B2C' | 'B2B';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface GPSTrackPoint {
  id?: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  synced: boolean;
}

export interface Photo {
  id?: number;
  temp_id: string;
  activity_temp_id: string;
  data: string;
  thumbnail?: string;
  captured_at: number;
  synced: boolean;
  server_url?: string;
}

export interface BaseActivity {
  id?: number;
  temp_id: string;
  user_id: string;
  type: ActivityType;
  status: ActivityStatus;
  location?: Location;
  created_at: number;
  updated_at: number;
  synced_at?: number;
  server_id?: string;
  sync_error?: string;
  photo_ids?: string[];
}

export interface OneOnOneActivity extends BaseActivity {
  type: 'one-on-one';
  person_name: string;
  category: UserCategory;
  phone?: string;
  village_name: string;
  business_potential: number;
  notes?: string;
  photo_ids: string[];
}

export interface GroupMeetingActivity extends BaseActivity {
  type: 'group-meeting';
  village_name: string;
  attendee_count: number;
  meeting_type: MeetingType;
  key_topics: string[];
  farmer_interest_level: number;
  photo_ids: string[];
}

export interface SampleDistributionActivity extends BaseActivity {
  type: 'sample-distribution';
  product_name: string;
  quantity: number;
  recipient_name: string;
  purpose: string;
  expected_feedback_date?: number;
  photo_ids: string[];
}

export interface SaleProduct {
  sku: string;
  pack_size: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface SaleActivity extends BaseActivity {
  type: 'sale';
  sale_type: SaleType;
  customer_name: string;
  products: SaleProduct[];
  payment_mode: 'Cash' | 'UPI' | 'Credit' | 'Part-Payment';
  amount_paid: number;
  balance: number;
  photo_ids: string[];
}

export type Activity = OneOnOneActivity | GroupMeetingActivity | SampleDistributionActivity | SaleActivity;

export interface SyncResult {
  success: boolean;
  temp_id: string;
  server_id?: string;
  error?: string;
}

export interface DashboardStats {
  todayMeetings: number;
  distanceTraveled: number;
  pendingSync: number;
}

export interface ActivityFormData {
  type: ActivityType;
  // One-on-One fields
  person_name?: string;
  category?: UserCategory;
  phone?: string;
  village_name?: string;
  business_potential?: number;
  notes?: string;
  topics_discussed?: string[];
  // Group Meeting fields
  attendee_count?: number;
  meeting_type?: MeetingType;
  key_topics?: string[];
  farmer_interest_level?: number;
  // Sample Distribution fields
  product_name?: string;
  quantity?: number;
  recipient_name?: string;
  purpose?: string;
  expected_feedback_date?: number;
  // Sale fields
  sale_type?: SaleType;
  customer_name?: string;
  products?: SaleProduct[];
  payment_mode?: 'Cash' | 'UPI' | 'Credit' | 'Part-Payment';
  amount_paid?: number;
  balance?: number;
}

export interface NewFarmFormData {
  owner_name: string;
  village: string;
  phone: string;
  type: string;
  cattle_count?: number;
  notes?: string;
}

export type UserStatus = 'approved' | 'pending' | 'rejected' | 'verified' | 'unverified';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'field_officer' | 'admin';
  status?: UserStatus;
  token?: string;
  refresh_token?: string;
}

export interface Farm {
  id?: number; // DB ID
  farm_id: string; // Generated ID e.g. FARM-JPR-NEW-001
  owner_name: string;
  village: string;
  phone: string;
  type: string;
  cattle_count?: number;
  notes?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  photo_data?: string; // Base64 or Blob URL
  created_at: number;
  synced: boolean;
  status?: 'pending' | 'visited' | 'en_route'; // Keep existing status if needed
}

export interface DailyAssignment {
  id: string; // Assignment ID (or derived)
  farms: Farm[];
  date: string;
}
