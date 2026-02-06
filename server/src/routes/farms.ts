import { Router } from 'express';
import { pool } from '../db/config';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to ensure user is admin
const adminMiddleware = async (req: AuthRequest, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
};

// Get All Farms (for assignment selector)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    const { village } = req.query;
    try {
        let query = `SELECT id, name, village, ST_AsGeoJSON(location) as location, activity_status FROM farms`;
        let params: any[] = [];

        if (village) {
            query += ` WHERE village = $1`;
            params.push(village);
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Fetch farms error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Assign Farm to Officer
router.post('/assign', authMiddleware, adminMiddleware, async (req, res) => {
    const { officerId, farmIds, date } = req.body;

    if (!officerId || !farmIds || !Array.isArray(farmIds) || !date) {
        return res.status(400).json({ success: false, message: 'Invalid assignment data' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const farmId of farmIds) {
                // Check if already assigned
                const check = await client.query(
                    'SELECT id FROM daily_assignments WHERE user_id = $1 AND farm_id = $2 AND date = $3',
                    [officerId, farmId, date]
                );

                if (check.rows.length === 0) {
                    await client.query(
                        `INSERT INTO daily_assignments (user_id, farm_id, date, status, priority)
                         VALUES ($1, $2, $3, 'pending', 'high')`,
                        [officerId, farmId, date]
                    );
                }
            }

            await client.query('COMMIT');
            res.json({ success: true, message: `Assigned ${farmIds.length} farms successfully` });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Assignment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Assignments for a date range (Weekly View)
router.get('/assignments', authMiddleware, adminMiddleware, async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const result = await pool.query(
            `SELECT da.id, da.date, da.status, da.priority, 
                    u.id as officer_id, u.name as officer_name,
                    f.id as farm_id, f.name as farm_name, f.village
             FROM daily_assignments da
             JOIN users u ON da.user_id = u.id
             JOIN farms f ON da.farm_id = f.id::text
             WHERE da.date BETWEEN $1 AND $2
             ORDER BY da.date, u.name`,
            [startDate, endDate]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Fetch assignments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get farms list for field officers
router.get('/my-farms', authMiddleware, async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { search, page = 1, limit = 50 } = req.query;

    try {
        let query = `
            SELECT 
                f.*,
                ST_X(f.location::geometry) as longitude,
                ST_Y(f.location::geometry) as latitude,
                (SELECT COUNT(*) FROM activities WHERE farm_id = f.id) as activity_count
            FROM farms f
            WHERE f.created_by = $1
        `;

        const params: any[] = [userId];
        let paramIndex = 2;

        if (search) {
            query += ` AND (
                f.name ILIKE $${paramIndex} OR 
                f.village ILIKE $${paramIndex} OR
                f.contact_phone ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY f.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, (Number(page) - 1) * Number(limit));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM farms WHERE created_by = $1';
        const countParams: any[] = [userId];

        if (search) {
            countQuery += ` AND (
                name ILIKE $2 OR 
                village ILIKE $2 OR
                contact_phone ILIKE $2
            )`;
            countParams.push(`%${search}%`);
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
        console.error('My farms list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch farms',
        });
    }
});

// Get Today's Assigned Farms (Field Officer)
router.get('/today/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;

    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Try to get actual assignments
        const assignments = await pool.query(`
            SELECT f.*, da.status,
            json_build_object(
                'type', 'Point', 
                'coordinates', json_build_array(ST_X(f.location::geometry), ST_Y(f.location::geometry))
            ) as location_json
            FROM daily_assignments da
            JOIN farms f ON da.farm_id = f.id::text
            WHERE da.user_id = $1 AND da.date = $2
        `, [userId, today]);

        if (assignments.rows.length > 0) {
            const data = assignments.rows.map(row => ({
                ...row,
                location: row.location_json // Already JSON object from PG
            }));
            return res.json(data);
        }

        // 2. Fallback: Return 3 random farms from user's list for demo
        // 2. Fallback: Return 3 random farms from user's list for demo
        const fallback = await pool.query(`
            SELECT *, 'pending' as status, 
            json_build_object(
                'type', 'Point', 
                'coordinates', json_build_array(ST_X(location::geometry), ST_Y(location::geometry))
            ) as location_json
            FROM farms 
            WHERE created_by = $1
            ORDER BY RANDOM()
            LIMIT 2
        `, [userId]);

        const data = fallback.rows.map(row => ({
            ...row,
            location: row.location_json // Already JSON object
        }));

        res.json(data);

    } catch (error) {
        console.error('Fetch today farms error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
