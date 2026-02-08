
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

        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.json({ success: true, data: { officers: [], farms: [] } });
        }

        const query = `%${q}%`;
        const officers = await pool.query(
            "SELECT id, name, email, phone, territory FROM users WHERE role = 'field_officer' AND (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR territory ILIKE $1) LIMIT 5",
            [query]
        );
        const farms = await pool.query(
            "SELECT id, name, village FROM farms WHERE name ILIKE $1 OR village ILIKE $1 LIMIT 5",
            [query]
        );

        res.status(200).json({
            success: true,
            data: {
                officers: officers.rows,
                farms: farms.rows
            }
        });
    } catch (error: any) {
        console.error('Search API error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
