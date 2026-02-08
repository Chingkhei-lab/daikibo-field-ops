
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { pool } from '../_lib/db';
import { allowCors } from '../utils/cors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Fetch user AND manager details in one query
        const query = `
            SELECT 
                u.id, u.name, u.email, u.phone, u.role, u.status, u.territory, u.language, u.admin_code,
                m.name as manager_name, m.email as manager_email
            FROM users u
            LEFT JOIN admin_codes ac ON u.admin_code = ac.code
            LEFT JOIN users m ON ac.created_by = m.id
            WHERE u.id = $1
        `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error: any) {
        console.error('Auth error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

module.exports = allowCors(handler);
