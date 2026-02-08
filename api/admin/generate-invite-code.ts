
import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../../_lib/db.js';
import { verifyAdmin } from '../../_lib/auth.js';
import allowCors from '../../utils/cors.js';

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!verifyAdmin(token)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Decode token to get user ID (we know it's valid admin/manager)
        const jwt = await import('jsonwebtoken');
        const decoded: any = jwt.default.decode(token);
        const userId = decoded?.id;

        // Fetch admin name
        const adminResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
        const adminName = adminResult.rows[0]?.name || 'Admin';

        // Generate a random 6-character alphanumeric code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Calculate expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const result = await pool.query(
            `INSERT INTO admin_codes (code, is_active, is_one_time, created_by, manager_name, expires_at)
             VALUES ($1, TRUE, TRUE, $2, $3, $4)
             RETURNING code, expires_at`,
            [code, userId, adminName, expiresAt]
        );

        res.status(200).json({ success: true, code: result.rows[0].code, expiresAt: result.rows[0].expires_at });
    } catch (error: any) {
        console.error('Generate Code API error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
