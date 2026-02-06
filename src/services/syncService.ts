import axios from 'axios';
import { Activity, SyncResult } from '@/types';
import db from '@/db/FieldOpsDB';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class SyncService {
  private isSyncing: boolean = false;
  private syncListeners: Set<(isSyncing: boolean) => void> = new Set();
  private progressListeners: Set<(progress: { total: number; current: number }) => void> = new Set();

  constructor() {
    // Listen for online events
    window.addEventListener('online', () => {
      console.log('Device is online, triggering sync');
      this.sync();
    });
  }

  async sync(): Promise<SyncResult[]> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return [];
    }

    if (!navigator.onLine) {
      console.log('Device is offline, skipping sync');
      return [];
    }

    this.isSyncing = true;
    this.notifySyncState(true);

    const results: SyncResult[] = [];

    try {
      // 1. Pull latest activities from server
      await this.pullActivities();

      // 2. Get pending activities to push
      const pendingActivities = await db.getPendingActivities();

      if (pendingActivities.length > 0) {
        console.log(`Syncing ${pendingActivities.length} activities`);
        this.notifyProgress({ total: pendingActivities.length, current: 0 });

        // Sync in batches of 10
        const batchSize = 10;
        for (let i = 0; i < pendingActivities.length; i += batchSize) {
          const batch = pendingActivities.slice(i, i + batchSize);
          const batchResults = await this.syncBatch(batch);
          results.push(...batchResults);

          this.notifyProgress({
            total: pendingActivities.length,
            current: Math.min(i + batchSize, pendingActivities.length)
          });
        }
      }

      // Sync photos for synced activities
      await this.syncPhotos();

      // Sync GPS tracks
      await this.syncGPSTracks();

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifySyncState(false);
    }

    return results;
  }

  private async pullActivities(): Promise<void> {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const response = await axios.get(
        `${API_BASE_URL}/activities/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 30000
        }
      );

      if (response.data.success && Array.isArray(response.data.activities)) {
        console.log(`Pulled ${response.data.activities.length} activities from server`);
        await db.upsertActivities(response.data.activities);
      }
    } catch (error) {
      console.error('Failed to pull activities:', error);
    }
  }

  private async syncBatch(activities: Activity[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    try {
      // Prepare activities for sync
      const activitiesToSync = activities.map(activity => ({
        ...activity,
        photos: [] // Photos are synced separately
      }));

      const response = await axios.post(
        `${API_BASE_URL}/sync/batch`,
        { activities: activitiesToSync },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 30000
        }
      );

      if (response.data.success && response.data.results) {
        for (const result of response.data.results) {
          if (result.success && result.server_id) {
            await db.markActivitySynced(result.temp_id, result.server_id);
            results.push({
              success: true,
              temp_id: result.temp_id,
              server_id: result.server_id
            });
          } else {
            await db.markActivityError(result.temp_id, result.error || 'Sync failed');
            results.push({
              success: false,
              temp_id: result.temp_id,
              error: result.error
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Batch sync failed:', error);

      // Mark all as failed
      for (const activity of activities) {
        const errorMessage = error.response?.data?.message || error.message || 'Network error';
        await db.markActivityError(activity.temp_id, errorMessage);
        results.push({
          success: false,
          temp_id: activity.temp_id,
          error: errorMessage
        });
      }
    }

    return results;
  }

  private async syncPhotos(): Promise<void> {
    const unsyncedPhotos = await db.photos.where('synced').equals(0).toArray();

    if (unsyncedPhotos.length === 0) return;

    console.log(`Syncing ${unsyncedPhotos.length} photos`);

    for (const photo of unsyncedPhotos) {
      try {
        // Get the activity to check if it's synced
        const activity = await db.getActivityByTempId(photo.activity_temp_id);
        if (!activity || !activity.server_id) {
          continue; // Skip if activity not synced yet
        }

        // Upload photo
        const formData = new FormData();
        const blob = this.base64ToBlob(photo.data);
        formData.append('photo', blob, `${photo.temp_id}.jpg`);
        formData.append('activity_id', activity.server_id);
        formData.append('temp_id', photo.temp_id);

        const response = await axios.post(
          `${API_BASE_URL}/photos/upload`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000
          }
        );

        if (response.data.success && response.data.url) {
          await db.markPhotoSynced(photo.temp_id, response.data.url);
        }
      } catch (error) {
        console.error(`Failed to sync photo ${photo.temp_id}:`, error);
      }
    }
  }

  private async syncGPSTracks(): Promise<void> {
    const unsyncedTracks = await db.getUnsyncedGPSTracks();

    if (unsyncedTracks.length === 0) return;

    console.log(`Syncing ${unsyncedTracks.length} GPS tracks`);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/sync/gps`,
        { tracks: unsyncedTracks },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        const ids = unsyncedTracks.map(t => t.id).filter((id): id is number => id !== undefined);
        await db.markGPSTracksSynced(ids);
      }
    } catch (error) {
      console.error('GPS tracks sync failed:', error);
    }
  }

  private base64ToBlob(base64: string): Blob {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }

  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  subscribeToSyncState(listener: (isSyncing: boolean) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  subscribeToProgress(listener: (progress: { total: number; current: number }) => void): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private notifySyncState(isSyncing: boolean): void {
    this.syncListeners.forEach(listener => listener(isSyncing));
  }

  private notifyProgress(progress: { total: number; current: number }): void {
    this.progressListeners.forEach(listener => listener(progress));
  }
}

// Singleton instance
export const syncService = new SyncService();
export default syncService;
