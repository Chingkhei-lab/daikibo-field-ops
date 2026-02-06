import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/config';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Create single activity (for online use)
router.post(
  '/',
  authMiddleware,
  [
    body('type').isIn(['one-on-one', 'group-meeting', 'sample-distribution', 'sale']),
    body('location').optional().isObject(),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const userId = req.user!.id;
    const activityData = req.body;

    try {
      const result = await insertActivity(pool, userId, activityData);

      res.status(201).json({
        success: true,
        activity: result,
      });
    } catch (error) {
      console.error('Create activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create activity',
      });
    }
  }
);

// Get user's activities
router.get('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, startDate, endDate } = req.query;

  // Users can only view their own activities unless they're admin
  if (userId !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    let query = `
      SELECT 
        a.*,
        ST_X(a.location::geometry) as longitude,
        ST_Y(a.location::geometry) as latitude,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'url', p.url,
              'captured_at', p.captured_at
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as photos
      FROM activities a
      LEFT JOIN photos p ON p.activity_id = a.id
      WHERE a.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND a.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND a.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY a.id ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (Number(page) - 1) * Number(limit));

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM activities WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      activities: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
    });
  }
});

// Helper function to insert activity
export async function insertActivity(
  client: any,
  userId: string,
  data: any
): Promise<any> {
  const {
    temp_id,
    type,
    location,
    person_name,
    category,
    contact,
    business_potential,
    notes,
    village_name,
    attendee_count,
    meeting_type,
    product_name,
    quantity,
    recipient_name,
    purpose,
    sale_type,
    product_sku,
    pack_size,
    unit_price,
    total_amount,
    created_at,
  } = data;

  // Build location point
  let locationPoint = null;
  if (location && location.latitude && location.longitude) {
    locationPoint = `POINT(${location.longitude} ${location.latitude})`;
  }

  const query = `
    INSERT INTO activities (
      user_id, temp_id, type, location, location_accuracy,
      person_name, category, contact, business_potential, notes,
      village_name, attendee_count, meeting_type,
      product_name, quantity, recipient_name, purpose,
      sale_type, product_sku, pack_size, unit_price, total_amount,
      created_at
    ) VALUES (
      $1, $2, $3, 
      ${locationPoint ? `ST_GeogFromText('${locationPoint}', 4326)` : 'NULL'}, 
      $4,
      $5, $6, $7, $8, $9,
      $10, $11, $12,
      $13, $14, $15, $16,
      $17, $18, $19, $20, $21,
      $22
    ) RETURNING 
      *,
      ST_X(location::geometry) as longitude,
      ST_Y(location::geometry) as latitude
  `;

  const values = [
    userId,
    temp_id,
    type,
    location?.accuracy || null,
    person_name || null,
    category || null,
    contact || null,
    business_potential ? parseInt(business_potential) : null,
    notes || null,
    village_name || null,
    attendee_count || null,
    meeting_type || null,
    product_name || null,
    quantity || null,
    recipient_name || null,
    purpose || null,
    sale_type || null,
    product_sku || null,
    pack_size || null,
    unit_price || null,
    total_amount || null,
    created_at ? new Date(created_at) : new Date(),
  ];

  const result = await client.query(query, values);
  return result.rows[0];
}

// Get activity history with filters (for Activity History page)
router.get('/history/all', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { page = 1, limit = 50, startDate, endDate, type } = req.query;

  try {
    let query = `
      SELECT 
        a.*,
        ST_X(a.location::geometry) as longitude,
        ST_Y(a.location::geometry) as latitude,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'url', p.url,
              'captured_at', p.captured_at
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as photos
      FROM activities a
      LEFT JOIN photos p ON p.activity_id = a.id
      WHERE a.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND a.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND a.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (type) {
      query += ` AND a.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` GROUP BY a.id ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (Number(page) - 1) * Number(limit));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM activities WHERE user_id = $1';
    const countParams: any[] = [userId];
    let countIndex = 2;

    if (startDate) {
      countQuery += ` AND created_at >= $${countIndex}`;
      countParams.push(startDate);
      countIndex++;
    }
    if (endDate) {
      countQuery += ` AND created_at <= $${countIndex}`;
      countParams.push(endDate);
      countIndex++;
    }
    if (type) {
      countQuery += ` AND type = $${countIndex}`;
      countParams.push(type);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Activity history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity history',
    });
  }
});

export default router;
