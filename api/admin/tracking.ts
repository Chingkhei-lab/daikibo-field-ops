
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

        res.status(200).json({ success: true, data: officers });

    } catch (error: any) {
        console.error('Tracking API error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
