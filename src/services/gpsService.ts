import { GPSTrackPoint } from '@/types';
import db from '@/db/FieldOpsDB';

interface GPSConfig {
  interval: number;
  distanceFilter: number;
  accuracyThreshold: number;
}

const DEFAULT_CONFIG: GPSConfig = {
  interval: 30000, // 30 seconds
  distanceFilter: 10, // 10 meters
  accuracyThreshold: 50 // 50 meters
};

class GPSService {
  private watchId: number | null = null;
  private isTracking: boolean = false;
  private config: GPSConfig;
  private lastPosition: GeolocationPosition | null = null;
  private batchQueue: GPSTrackPoint[] = [];
  private batchInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(position: GeolocationPosition) => void> = new Set();

  constructor(config: Partial<GPSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  startTracking(): boolean {
    if (this.isTracking) {
      console.log('GPS tracking already active');
      return true;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      return false;
    }

    this.isTracking = true;

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    // Start batch processing
    this.startBatchProcessing();

    console.log('GPS tracking started');
    return true;
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }

    // Flush remaining batch
    this.flushBatch();

    this.isTracking = false;
    this.lastPosition = null;
    console.log('GPS tracking stopped');
  }

  private handlePosition(position: GeolocationPosition): void {
    // Check accuracy threshold
    if (position.coords.accuracy > this.config.accuracyThreshold) {
      console.log('Position accuracy below threshold:', position.coords.accuracy);
      return;
    }

    // Check distance filter
    if (this.lastPosition) {
      const distance = this.calculateDistance(
        this.lastPosition.coords.latitude,
        this.lastPosition.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );

      if (distance < this.config.distanceFilter) {
        return; // Skip if moved less than distance filter
      }
    }

    this.lastPosition = position;

    // Add to batch queue
    const trackPoint: GPSTrackPoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      synced: false
    };

    this.batchQueue.push(trackPoint);

    // Notify listeners
    this.listeners.forEach(listener => listener(position));
  }

  private handleError(error: GeolocationPositionError): void {
    console.error('GPS Error:', error.message);
  }

  private startBatchProcessing(): void {
    this.batchInterval = setInterval(() => {
      this.flushBatch();
    }, this.config.interval);
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      await db.saveGPSTracks(batch);
      console.log(`Saved ${batch.length} GPS points`);
    } catch (error) {
      console.error('Failed to save GPS batch:', error);
      // Re-add to queue on failure
      this.batchQueue.unshift(...batch);
    }
  }

  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRad(lat1);
    const φ2 = this.toRad(lat2);
    const Δφ = this.toRad(lat2 - lat1);
    const Δλ = this.toRad(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get current position (one-time)
  async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Subscribe to position updates
  subscribe(listener: (position: GeolocationPosition) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getIsTracking(): boolean {
    return this.isTracking;
  }

  // Get today's distance traveled
  async getTodaysDistance(): Promise<number> {
    return await db.getTodaysDistance();
  }
}

// Singleton instance
export const gpsService = new GPSService();
export default gpsService;
