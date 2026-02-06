import { Router, Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/config';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Upload photo
router.post(
  '/upload',
  authMiddleware,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No photo provided',
        });
      }

      const { activity_id, temp_id } = req.body;

      if (!activity_id) {
        return res.status(400).json({
          success: false,
          message: 'Activity ID is required',
        });
      }

      // Verify activity belongs to user
      const activityResult = await pool.query(
        'SELECT id FROM activities WHERE id = $1 AND user_id = $2',
        [activity_id, req.user!.id]
      );

      if (activityResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Activity not found or unauthorized',
        });
      }

      // Construct URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

      // Save to database
      const result = await pool.query(
        `INSERT INTO photos (activity_id, temp_id, url, captured_at)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [activity_id, temp_id || null, photoUrl, new Date()]
      );

      res.json({
        success: true,
        photo: result.rows[0],
        url: photoUrl,
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload photo',
      });
    }
  }
);

// Get photos for an activity
router.get('/activity/:activityId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { activityId } = req.params;

  try {
    // Verify activity belongs to user
    const activityResult = await pool.query(
      'SELECT id FROM activities WHERE id = $1 AND user_id = $2',
      [activityId, req.user!.id]
    );

    if (activityResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Activity not found or unauthorized',
      });
    }

    const result = await pool.query(
      'SELECT * FROM photos WHERE activity_id = $1 ORDER BY created_at DESC',
      [activityId]
    );

    res.json({
      success: true,
      photos: result.rows,
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch photos',
    });
  }
});

export default router;
