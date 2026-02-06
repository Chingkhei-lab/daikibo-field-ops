import Dexie, { Table } from 'dexie';
import { Activity, Photo, GPSTrackPoint, Farm } from '@/types';

export class FieldOpsDB extends Dexie {
  activities!: Table<Activity>;
  photos!: Table<Photo>;
  gpsTracks!: Table<GPSTrackPoint>;
  farms!: Table<Farm>;

  constructor() {
    super('FieldOpsDB');

    this.version(3).stores({
      activities: '++id, temp_id, user_id, type, status, created_at, server_id',
      photos: '++id, temp_id, activity_temp_id, synced, captured_at',
      gpsTracks: '++id, timestamp, synced',
      farms: '++id, farm_id, owner_name, village, type, synced, created_at'
    });
  }

  // Activity methods
  async saveActivity(activity: Activity): Promise<number> {
    activity.updated_at = Date.now();
    return (await this.activities.add(activity)) as number;
  }

  async updateActivity(tempId: string, updates: Partial<Activity>): Promise<number> {
    updates.updated_at = Date.now();
    return await this.activities.where('temp_id').equals(tempId).modify(updates);
  }

  async getActivityByTempId(tempId: string): Promise<Activity | undefined> {
    return await this.activities.where('temp_id').equals(tempId).first();
  }

  async getPendingActivities(): Promise<Activity[]> {
    return await this.activities.where('status').equals('pending').toArray();
  }

  async getTodaysActivities(userId: string): Promise<Activity[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await this.activities
      .where('user_id')
      .equals(userId)
      .and(activity => activity.created_at >= startOfDay.getTime())
      .toArray();
  }

  async getActivityStats(userId: string): Promise<{ todayCount: number; pendingCount: number }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const allActivities = await this.activities.where('user_id').equals(userId).toArray();

    const todayCount = allActivities.filter(a => a.created_at >= startOfDay.getTime()).length;
    const pendingCount = allActivities.filter(a => a.status === 'pending').length;

    return { todayCount, pendingCount };
  }

  async markActivitySynced(tempId: string, serverId: string): Promise<void> {
    await this.activities.where('temp_id').equals(tempId).modify({
      status: 'synced',
      server_id: serverId,
      synced_at: Date.now()
    });
  }

  async markActivityError(tempId: string, error: string): Promise<void> {
    await this.activities.where('temp_id').equals(tempId).modify({
      status: 'error',
      sync_error: error
    });
  }

  async deleteActivity(id: number | string): Promise<void> {
    if (typeof id === 'number') {
      await this.activities.delete(id);
    } else {
      // Try deleting by temp_id if string
      await this.activities.where('temp_id').equals(id).delete();
    }
  }

  // Photo methods
  async savePhoto(photo: Photo): Promise<number> {
    return (await this.photos.add(photo)) as number;
  }

  async getPhotosByActivityTempId(activityTempId: string): Promise<Photo[]> {
    return await this.photos.where('activity_temp_id').equals(activityTempId).toArray();
  }

  async markPhotoSynced(tempId: string, serverUrl: string): Promise<void> {
    await this.photos.where('temp_id').equals(tempId).modify({
      synced: true,
      server_url: serverUrl
    });
  }

  async deletePhoto(tempId: string): Promise<void> {
    await this.photos.where('temp_id').equals(tempId).delete();
  }

  // GPS Track methods
  async saveGPSTrack(point: GPSTrackPoint): Promise<number> {
    return (await this.gpsTracks.add(point)) as number;
  }

  async saveGPSTracks(points: GPSTrackPoint[]): Promise<void> {
    await this.gpsTracks.bulkAdd(points);
  }

  async getUnsyncedGPSTracks(): Promise<GPSTrackPoint[]> {
    return await this.gpsTracks.where('synced').equals(0).toArray();
  }

  async markGPSTracksSynced(ids: number[]): Promise<void> {
    await this.gpsTracks.where('id').anyOf(ids).modify({
      synced: true
    });
  }

  async getTodaysDistance(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tracks = await this.gpsTracks
      .where('timestamp')
      .above(startOfDay.getTime())
      .toArray();

    if (tracks.length < 2) return 0;

    // Sort by timestamp
    tracks.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < tracks.length; i++) {
      totalDistance += this.calculateDistance(
        tracks[i - 1].latitude,
        tracks[i - 1].longitude,
        tracks[i].latitude,
        tracks[i].longitude
      );
    }

    return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async upsertActivities(activities: any[]): Promise<void> {
    await this.transaction('rw', this.activities, this.photos, async () => {
      for (const activity of activities) {
        // Check if exists by server_id or temp_id
        let existing = await this.activities.where('server_id').equals(activity.id).first();

        if (!existing && activity.temp_id) {
          existing = await this.activities.where('temp_id').equals(activity.temp_id).first();
        }

        const activityRecord: Activity = {
          temp_id: existing?.temp_id || activity.temp_id || activity.id,
          server_id: activity.id,
          user_id: activity.user_id,
          type: activity.type,
          created_at: typeof activity.created_at === 'string' ? new Date(activity.created_at).getTime() : activity.created_at,
          location: {
            latitude: activity.latitude,
            longitude: activity.longitude,
            accuracy: activity.location_accuracy,
            timestamp: new Date(activity.created_at).getTime()
          },
          details: {
            person_name: activity.person_name,
            village_name: activity.village_name,
            product_name: activity.product_name,
            product_sku: activity.product_sku
          },
          status: 'synced'
        };

        if (existing) {
          await this.activities.update(existing.id!, activityRecord);
        } else {
          await this.activities.add(activityRecord);
        }
      }
    });
  }


  // Farm methods
  async saveFarm(farm: Farm): Promise<number> {
    return (await this.farms.add(farm)) as number;
  }

  async getTodaysFarms(todayStart: number): Promise<Farm[]> {
    return await this.farms.where('created_at').aboveOrEqual(todayStart).toArray();
  }

  // Clear all data (for logout)
  async clearAllData(): Promise<void> {
    await this.activities.clear();
    await this.photos.clear();
    await this.gpsTracks.clear();
    await this.farms.clear();
  }
}

export const db = new FieldOpsDB();
export default db;
