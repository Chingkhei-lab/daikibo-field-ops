import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../../_lib/db.js';
import { verifyToken } from '../../_lib/auth.js';
import allowCors from '../../utils/cors.js';

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const user = verifyToken(token);

        if (!['admin', 'manager'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Get Pending Officers
        const result = await pool.query(
            `SELECT id, name, email, phone, territory, language, created_at 
             FROM users 
             WHERE status = 'pending' 
             ORDER BY created_at DESC`
        );

        res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Fetch pending error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
