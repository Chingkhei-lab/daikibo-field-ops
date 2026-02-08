
import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { pool } from '../../_lib/db.js';
import { verifyAdmin } from '../../_lib/auth.js';
import allowCors from '../../utils/cors.js';

const handler = async (req: VercelRequest, res: VercelResponse) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !verifyAdmin(authHeader.split(' ')[1])) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (req.method === 'GET') {
            const result = await pool.query(
                `SELECT id, name, email, phone, territory, language, status, created_at,
           (SELECT COUNT(*) FROM daily_assignments WHERE user_id = users.id AND date = CURRENT_DATE) as assigned_farms,
           (SELECT COUNT(*) FROM activities WHERE user_id = users.id AND DATE(created_at) = CURRENT_DATE) as farms_visited
           FROM users 
           WHERE role = 'field_officer' AND status != 'pending'
           ORDER BY created_at DESC`
            );
            return res.status(200).json({ success: true, data: result.rows });
        }

        if (req.method === 'POST') {
            const { name, phone, email, territory, language, password } = req.body;

            if (!name || !phone || !territory || !password) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const existing = await pool.query('SELECT id FROM users WHERE phone = $1 OR email = $2', [phone, email || '']);
            if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'User already exists' });

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const result = await pool.query(
                `INSERT INTO users (name, phone, email, territory, language, password_hash, role, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'field_officer', 'active')
           RETURNING id, name, phone, territory`,
                [name, phone, email || null, territory, language || 'en', passwordHash]
            );

            return res.status(201).json({ success: true, user: result.rows[0], message: 'Officer created successfully' });
        }

        return res.status(405).json({ success: false, message: 'Method not allowed' });

    } catch (error: any) {
        console.error('Officers API error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

export default allowCors(handler);
