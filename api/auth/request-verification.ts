
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { pool } from '../_lib/db';
import { allowCors } from '../utils/cors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
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

        // Update status to pending
        await pool.query("UPDATE users SET status = 'pending' WHERE id = $1", [userId]);

        return res.json({
            success: true,
            message: 'Verification requested successfully'
        });

    } catch (error: any) {
        console.error('Request verification error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

module.exports = allowCors(handler);
