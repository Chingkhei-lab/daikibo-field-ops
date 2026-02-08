
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
        if (!authHeader || !verifyAdmin(authHeader.split(' ')[1])) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { userId, action } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        if (action === 'approve') {
            await pool.query(
                "UPDATE users SET status = 'active' WHERE id = $1",
                [userId]
            );
        } else {
            await pool.query(
                "UPDATE users SET status = 'rejected' WHERE id = $1",
                [userId]
            );
        }

        res.status(200).json({ success: true, message: `Officer ${action}d successfully` });
    } catch (error: any) {
        console.error('Handle request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
