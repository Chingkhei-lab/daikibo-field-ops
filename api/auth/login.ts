import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { pool } from '../_lib/db';
import { generateTokens } from '../_lib/auth';
import { allowCors } from '../utils/cors';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const result = await pool.query(
            'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const { accessToken, refreshToken } = generateTokens(
            user.id,
            user.email,
            user.role
        );

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token: accessToken,
            refreshToken,
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', details: error.message });
    }
}

export default allowCors(handler);
