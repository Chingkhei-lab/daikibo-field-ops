
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

        const { search, limit } = req.query;
        let query = `
            SELECT 
                f.*, 
                (SELECT COUNT(*) FROM activities a WHERE a.farm_id = f.id) as activity_count
            FROM farms f
            WHERE f.created_by = $1
        `;
        const params: any[] = [userId];

        if (search) {
            query += ` AND (f.name ILIKE $2 OR f.village_name ILIKE $2 OR f.phone_number ILIKE $2)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY f.created_at DESC`;

        if (limit) {
            query += ` LIMIT $${params.length + 1}`;
            params.push(limit);
        }

        const result = await pool.query(query, params);

        return res.json({
            success: true,
            data: result.rows
        });

    } catch (error: any) {
        console.error('Fetch farms error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch farms' });
    }
}

module.exports = allowCors(handler);
