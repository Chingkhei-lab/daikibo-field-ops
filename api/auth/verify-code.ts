
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../_lib/db';
import { allowCors } from '../utils/cors';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ success: false, message: 'Code is required' });
    }

    try {
        const normalizedCode = code.toUpperCase().trim();
        const result = await pool.query(
            "SELECT manager_name, region FROM admin_codes WHERE code = $1 AND is_active = TRUE AND is_used = FALSE",
            [normalizedCode]
        );

        if (result.rows.length > 0) {
            return res.status(200).json({
                success: true,
                data: result.rows[0]
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid or expired code' });
        }
    } catch (error: any) {
        console.error('Verify code error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = allowCors(handler);
