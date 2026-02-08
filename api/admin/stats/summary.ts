
import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../../_lib/db.js';
import { verifyAdmin } from '../../_lib/auth.js';
import allowCors from '../../utils/cors.js';

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !verifyAdmin(authHeader.split(' ')[1])) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'field_officer' AND status = 'active') as active_officers,
                (SELECT COUNT(*) FROM activities WHERE DATE(created_at) = CURRENT_DATE) as farms_visited,
                (SELECT COUNT(*) FROM daily_assignments WHERE date = CURRENT_DATE) as scheduled_today,
                (SELECT COUNT(DISTINCT user_id) FROM gps_tracks WHERE tracked_at > NOW() - INTERVAL '1 hour') as currently_active
        `);

        const { active_officers, farms_visited, scheduled_today, currently_active } = stats.rows[0];
        const completionRate = scheduled_today > 0 ? Math.round((farms_visited / scheduled_today) * 100) : 0;

        res.status(200).json({
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

    } catch (error: any) {
        console.error('Stats Summary API error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
