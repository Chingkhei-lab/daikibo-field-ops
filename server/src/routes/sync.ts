import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/config';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { insertActivity } from './activities';

const router = Router();

// Batch sync endpoint
router.post(
  '/batch',
  authMiddleware,
  [
    body('activities').isArray().notEmpty(),
    body('activities.*.temp_id').notEmpty(),
    body('activities.*.type').isIn(['one-on-one', 'group-meeting', 'sample-distribution', 'sale']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user!.id;
    const { activities } = req.body;

    const results = [];
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const activityData of activities) {
        try {
          // Check if activity already exists by temp_id
          const existingResult = await client.query(
            'SELECT id FROM activities WHERE temp_id = $1 AND user_id = $2',
            [activityData.temp_id, userId]
          );

          if (existingResult.rows.length > 0) {
            // Activity already exists, return existing ID
            results.push({
              success: true,
              temp_id: activityData.temp_id,
              server_id: existingResult.rows[0].id,
              message: 'Activity already synced',
            });
            continue;
          }

          // Insert new activity
          const insertedActivity = await insertActivity(client, userId, activityData);

          results.push({
            success: true,
            temp_id: activityData.temp_id,
            server_id: insertedActivity.id,
          });
        } catch (error: any) {
          console.error(`Failed to sync activity ${activityData.temp_id}:`, error);
          results.push({
            success: false,
            temp_id: activityData.temp_id,
            error: error.message || 'Failed to insert activity',
          });
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        results,
        synced: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Batch sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Batch sync failed',
      });
    } finally {
      client.release();
    }
  }
);

// GPS tracks batch sync
router.post(
  '/gps',
  authMiddleware,
  [
    body('tracks').isArray(),
    body('tracks.*.latitude').isFloat(),
    body('tracks.*.longitude').isFloat(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user!.id;
    const { tracks } = req.body;

    try {
      const values = tracks.map((track: any) => [
        userId,
        `POINT(${track.longitude} ${track.latitude})`,
        track.accuracy,
        new Date(track.timestamp),
      ]);

      const query = `
        INSERT INTO gps_tracks (user_id, location, accuracy, tracked_at)
        VALUES ${values.map((_: any, i: number) =>
        `($${i * 4 + 1}, ST_GeogFromText($${i * 4 + 2}, 4326), $${i * 4 + 3}, $${i * 4 + 4})`
      ).join(', ')}
        RETURNING id
      `;

      const flatValues = values.flat();
      await pool.query(query, flatValues);

      res.json({
        success: true,
        synced: tracks.length,
      });
    } catch (error) {
      console.error('GPS sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync GPS tracks',
      });
    }
  }
);

export default router;
