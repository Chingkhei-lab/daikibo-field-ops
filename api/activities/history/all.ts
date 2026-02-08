
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { pool } from '../../_lib/db';
import { allowCors } from '../../utils/cors';

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

        const { type, limit } = req.query;
        let query = `
            SELECT 
                a.*,
                ST_X(a.location::geometry) as longitude,
                ST_Y(a.location::geometry) as latitude,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'url', p.url,
                            'captured_at', p.captured_at
                        )
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'
                ) as photos
            FROM activities a
            LEFT JOIN photos p ON p.activity_id = a.id
            WHERE a.user_id = $1
        `;
        const params: any[] = [userId];

        if (type && type !== 'all') {
            query += ` AND a.type = $2`;
            params.push(type);
        }

        query += ` GROUP BY a.id ORDER BY a.created_at DESC`;

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
        console.error('Fetch activities error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch activities' });
    }
}

module.exports = allowCors(handler);
