import { Router, Response, NextFunction } from 'express';
import { pool } from '../db/config';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to ensure user is admin
const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
};

// Get Pending Officers
router.get('/pending-officers', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, phone, territory, language, created_at 
       FROM users 
       WHERE status = 'pending' 
       ORDER BY created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Fetch pending error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Approve/Reject Officer
router.post('/handle-request', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    const { userId, action } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    try {
        if (action === 'approve') {
            // Generate a unique username if needed, or just set status to active
            // For now, just activating them.
            await pool.query(
                "UPDATE users SET status = 'active' WHERE id = $1",
                [userId]
            );
            // In a real app, trigger SMS/Email here
        } else {
            // Reject - delete or mark rejected
            await pool.query(
                "UPDATE users SET status = 'rejected' WHERE id = $1",
                [userId]
            );
        }

        res.json({ success: true, message: `Officer ${action}d successfully` });
    } catch (error) {
        console.error('Handle request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get All Officers (Active & Inactive)
router.get('/officers', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, phone, territory, language, status, created_at,
       (SELECT COUNT(*) FROM daily_assignments WHERE user_id = users.id AND date = CURRENT_DATE) as assigned_farms,
       (SELECT COUNT(*) FROM activities WHERE user_id = users.id AND DATE(created_at) = CURRENT_DATE) as farms_visited
       FROM users 
       WHERE role = 'field_officer' AND status != 'pending'
       ORDER BY created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Fetch officers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create Officer Directly
router.post('/officers', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    const { name, phone, email, territory, language, password } = req.body;

    if (!name || !phone || !territory || !password) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const existing = await pool.query('SELECT id FROM users WHERE phone = $1 OR email = $2', [phone, email || '']);
        if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'User already exists' });

        // Hash password
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO users (name, phone, email, territory, language, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'field_officer', 'active')
       RETURNING id, name, phone, territory`,
            [name, phone, email || null, territory, language || 'en', passwordHash]
        );

        res.status(201).json({ success: true, user: result.rows[0], message: 'Officer created successfully' });
    } catch (error) {
        console.error('Create officer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Generate One-Time Invite Code
router.post('/generate-invite-code', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    console.log('[Generate Code] Request received from user:', req.user?.id);
    try {
        // Fetch admin name
        const adminResult = await pool.query('SELECT name FROM users WHERE id = $1', [req.user?.id]);
        const adminName = adminResult.rows[0]?.name || 'Admin';
        console.log('[Generate Code] Admin Name resolved:', adminName);

        // Generate a random 6-character alphanumeric code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Calculate expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        console.log('[Generate Code] Inserting code:', code, 'Expires:', expiresAt);

        const result = await pool.query(
            `INSERT INTO admin_codes (code, is_active, is_one_time, created_by, manager_name, expires_at)
             VALUES ($1, TRUE, TRUE, $2, $3, $4)
             RETURNING code, expires_at`,
            [code, req.user?.id, adminName, expiresAt]
        );

        console.log('[Generate Code] Success:', result.rows[0]);
        res.json({ success: true, code: result.rows[0].code, expiresAt: result.rows[0].expires_at });
    } catch (error: any) {
        console.error('[Generate Code] Error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Get Live Tracking Data
router.get('/tracking', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
        // Query to get officers and their last known location
        // Using subqueries for simplicity with the PostGIS column
        const result = await pool.query(`
            SELECT 
                u.id, u.name, u.phone, u.status, u.territory,
                (SELECT tracked_at FROM gps_tracks WHERE user_id = u.id ORDER BY tracked_at DESC LIMIT 1) as last_update,
                (SELECT ST_Y(location::geometry) FROM gps_tracks WHERE user_id = u.id ORDER BY tracked_at DESC LIMIT 1) as lat,
                (SELECT ST_X(location::geometry) FROM gps_tracks WHERE user_id = u.id ORDER BY tracked_at DESC LIMIT 1) as lng,
                (SELECT type FROM activities WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_activity
            FROM users u
            WHERE u.role = 'field_officer' AND u.status != 'pending'
        `);

        // Transform for frontend
        const officers = result.rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            phone: row.phone,
            status: row.status === 'active' ? 'active' : 'offline', // Simplified status mapping
            location: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : { lat: 26.9124, lng: 75.7873 }, // Default Jaipur if no GPS
            lastUpdate: row.last_update ? new Date(row.last_update).toLocaleTimeString() : 'Never',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=random`,
            currentTask: row.last_activity ? `Last: ${row.last_activity}` : 'No activity yet',
            battery: 80 // Placeholder
        }));

        res.json({ success: true, data: officers });
    } catch (error: any) {
        console.error('Tracking error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Get Dashboard Summary Stats
router.get('/stats/summary', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'field_officer' AND status = 'active') as active_officers,
                (SELECT COUNT(*) FROM activities WHERE DATE(created_at) = CURRENT_DATE) as farms_visited,
                (SELECT COUNT(*) FROM daily_assignments WHERE date = CURRENT_DATE) as scheduled_today,
                (SELECT COUNT(DISTINCT user_id) FROM gps_tracks WHERE tracked_at > NOW() - INTERVAL '1 hour') as currently_active
        `);

        const { active_officers, farms_visited, scheduled_today, currently_active } = stats.rows[0];
        const completionRate = scheduled_today > 0 ? Math.round((farms_visited / scheduled_today) * 100) : 0;

        res.json({
            success: true,
            data: {
                activeOfficers: currently_active || 0,
                totalOfficers: active_officers || 0,
                farmsVisited: farms_visited || 0,
                scheduledToday: scheduled_today || 0,
                completionRate: `${completionRate}%`,
                pendingSyncs: 2 // Mocked for now as it's client-side state
            }
        });
    } catch (error) {
        console.error('Stats summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Performance Leaderboard (Top Officers Today)
router.get('/stats/performance', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.name,
                COUNT(a.id) as visit_count,
                MAX(a.created_at) as last_visit
            FROM users u
            JOIN activities a ON u.id = a.user_id
            WHERE DATE(a.created_at) = CURRENT_DATE
            GROUP BY u.id, u.name
            ORDER BY visit_count DESC
            LIMIT 5
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Performance stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Activity Type Distribution
router.get('/stats/activity-distribution', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT type, COUNT(*) as count
            FROM activities
            WHERE DATE(created_at) = CURRENT_DATE
            GROUP BY type
            ORDER BY count DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Activity distribution error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Global Admin Search
router.get('/search', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: { officers: [], farms: [] } });

    try {
        const query = `%${q}%`;
        const officers = await pool.query(
            "SELECT id, name, email, phone, territory FROM users WHERE role = 'field_officer' AND (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR territory ILIKE $1) LIMIT 5",
            [query]
        );
        const farms = await pool.query(
            "SELECT id, name, village FROM farms WHERE name ILIKE $1 OR village ILIKE $1 LIMIT 5",
            [query]
        );

        res.json({
            success: true,
            data: {
                officers: officers.rows,
                farms: farms.rows
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
