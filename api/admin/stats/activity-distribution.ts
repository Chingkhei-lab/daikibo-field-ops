
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
            SELECT type, COUNT(*) as count
            FROM activities
            WHERE DATE(created_at) = CURRENT_DATE
            GROUP BY type
            ORDER BY count DESC
        `);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Activity Distribution API error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
