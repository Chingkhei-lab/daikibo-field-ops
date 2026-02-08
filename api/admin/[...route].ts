
import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { pool } from '../_lib/db.js';
import { verifyAdmin } from '../_lib/auth.js';
import { allowCors } from '../utils/cors.js';
import jwt from 'jsonwebtoken';

const handler = async (req: VercelRequest, res: VercelResponse) => {
    try {
        // 1. Auth Check (Global for all admin routes)
        const authHeader = req.headers.authorization;
        if (!authHeader || !verifyAdmin(authHeader.split(' ')[1])) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // 2. Routing Logic
        // req.query.route is an array of path segments, e.g. ['officers'] or ['stats', 'summary']
        const { route } = req.query;
        const pathSegments = Array.isArray(route) ? route : [route];
        const path = pathSegments.join('/');

        // --- Officers ---
        if (path === 'officers') {
            if (req.method === 'GET') {
                const result = await pool.query(
                    `SELECT id, name, email, phone, territory, language, status, created_at,
                     (SELECT COUNT(*) FROM daily_assignments WHERE user_id = users.id AND date = CURRENT_DATE) as assigned_farms,
                     (SELECT COUNT(*) FROM activities WHERE user_id = users.id AND DATE(created_at) = CURRENT_DATE) as farms_visited
                     FROM users 
                     WHERE role = 'field_officer' AND status != 'pending'
                     ORDER BY created_at DESC`
                );
                return res.json({ success: true, data: result.rows });
            }
            if (req.method === 'POST') {
                const { name, phone, email, territory, language, password } = req.body;
                if (!name || !phone || !territory || !password) {
                    return res.status(400).json({ success: false, message: 'Missing required fields' });
                }
                const existing = await pool.query('SELECT id FROM users WHERE phone = $1 OR email = $2', [phone, email || '']);
                if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'User already exists' });

                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(password, salt);

                const result = await pool.query(
                    `INSERT INTO users (name, phone, email, territory, language, password_hash, role, status)
                     VALUES ($1, $2, $3, $4, $5, $6, 'field_officer', 'active')
                     RETURNING id, name, phone, territory`,
                    [name, phone, email || null, territory, language || 'en', passwordHash]
                );
                return res.status(201).json({ success: true, user: result.rows[0], message: 'Officer created successfully' });
            }
        }

        // --- Pending Officers ---
        if (path === 'pending-officers' && req.method === 'GET') {
            const result = await pool.query(
                `SELECT id, name, email, phone, territory, language, created_at 
                 FROM users 
                 WHERE status = 'pending' 
                 ORDER BY created_at DESC`
            );
            return res.json({ success: true, data: result.rows });
        }

        // --- Handle Request ---
        if (path === 'handle-request' && req.method === 'POST') {
            const { userId, action } = req.body;
            if (!['approve', 'reject'].includes(action)) {
                return res.status(400).json({ success: false, message: 'Invalid action' });
            }
            if (action === 'approve') {
                await pool.query("UPDATE users SET status = 'active' WHERE id = $1", [userId]);
            } else {
                await pool.query("UPDATE users SET status = 'rejected' WHERE id = $1", [userId]);
            }
            return res.json({ success: true, message: `Officer ${action}d successfully` });
        }

        // --- Tracking ---
        if (path === 'tracking' && req.method === 'GET') {
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
            const officers = result.rows.map((row: any) => ({
                id: row.id,
                name: row.name,
                phone: row.phone,
                status: row.status === 'active' ? 'active' : 'offline',
                location: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : { lat: 26.9124, lng: 75.7873 },
                lastUpdate: row.last_update ? new Date(row.last_update).toLocaleTimeString() : 'Never',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=random`,
                currentTask: row.last_activity ? `Last: ${row.last_activity}` : 'No activity yet',
                battery: 80
            }));
            return res.json({ success: true, data: officers });
        }

        // --- Stats ---
        if (path === 'stats/summary' && req.method === 'GET') {
            const stats = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE role = 'field_officer' AND status = 'active') as active_officers,
                    (SELECT COUNT(*) FROM activities WHERE DATE(created_at) = CURRENT_DATE) as farms_visited,
                    (SELECT COUNT(*) FROM daily_assignments WHERE date = CURRENT_DATE) as scheduled_today,
                    (SELECT COUNT(DISTINCT user_id) FROM gps_tracks WHERE tracked_at > NOW() - INTERVAL '1 hour') as currently_active
            `);
            const { active_officers, farms_visited, scheduled_today, currently_active } = stats.rows[0];
            const completionRate = scheduled_today > 0 ? Math.round((farms_visited / scheduled_today) * 100) : 0;
            return res.json({
                success: true,
                data: {
                    activeOfficers: parseInt(currently_active || '0'),
                    totalOfficers: parseInt(active_officers || '0'),
                    farmsVisited: parseInt(farms_visited || '0'),
                    scheduledToday: parseInt(scheduled_today || '0'),
                    completionRate: `${completionRate}%`,
                    pendingSyncs: 0
                }
            });
        }

        if (path === 'stats/performance' && req.method === 'GET') {
            const result = await pool.query(`
                SELECT u.name, COUNT(a.id) as visit_count, MAX(a.created_at) as last_visit
                FROM users u
                JOIN activities a ON u.id = a.user_id
                WHERE DATE(a.created_at) = CURRENT_DATE
                GROUP BY u.id, u.name
                ORDER BY visit_count DESC LIMIT 5
            `);
            return res.json({ success: true, data: result.rows });
        }

        if (path === 'stats/activity-distribution' && req.method === 'GET') {
            const result = await pool.query(`
                SELECT type, COUNT(*) as count
                FROM activities
                WHERE DATE(created_at) = CURRENT_DATE
                GROUP BY type
                ORDER BY count DESC
            `);
            return res.json({ success: true, data: result.rows });
        }

        // --- Search ---
        if (path === 'search' && req.method === 'GET') {
            const { q } = req.query;
            if (!q || typeof q !== 'string') return res.json({ success: true, data: { officers: [], farms: [] } });
            const query = `%${q}%`;
            const officers = await pool.query(
                "SELECT id, name, email, phone, territory FROM users WHERE role = 'field_officer' AND (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR territory ILIKE $1) LIMIT 5",
                [query]
            );
            const farms = await pool.query(
                "SELECT id, name, village FROM farms WHERE name ILIKE $1 OR village ILIKE $1 LIMIT 5",
                [query]
            );
            return res.json({ success: true, data: { officers: officers.rows, farms: farms.rows } });
        }

        // --- Invite Code ---
        if (path === 'generate-invite-code' && req.method === 'POST') {
            const token = authHeader.split(' ')[1];
            // Decode token to get user ID
            const decoded: any = jwt.decode(token);
            const userId = decoded?.id;

            const adminResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
            const adminName = adminResult.rows[0]?.name || 'Admin';

            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const result = await pool.query(
                `INSERT INTO admin_codes (code, is_active, is_one_time, created_by, manager_name, expires_at)
                 VALUES ($1, TRUE, TRUE, $2, $3, $4)
                 RETURNING code, expires_at`,
                [code, userId, adminName, expiresAt]
            );
            return res.json({ success: true, code: result.rows[0].code, expiresAt: result.rows[0].expires_at });
        }

        return res.status(404).json({ success: false, message: 'Endpoint not found: ' + path });

    } catch (error: any) {
        console.error('Admin API error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
