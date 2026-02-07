import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { pool } from '../../server/src/db/config';
import { generateTokens } from '../../server/src/middleware/auth';
import { allowCors } from '../utils/cors';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, password, name, role, phone, territory, language, adminCode, organization, website } = req.body;

    // Basic validation
    if (!email || !password || !name) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        // Check if user exists
        const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) return res.status(400).json({ success: false, message: 'Email already exists' });

        if (phone) {
            const existingPhone = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
            if (existingPhone.rows.length > 0) return res.status(400).json({ success: false, message: 'Phone already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Validate role & Determine Status
        const validRoles = ['field_officer', 'admin', 'distributor'];
        const userRole = validRoles.includes(role) ? role : 'field_officer';

        // Default status logic
        let status = userRole === 'admin' ? 'active' : (adminCode ? 'pending' : 'active');

        // Check admin code
        if (adminCode) {
            const codeCheck = await pool.query('SELECT is_one_time FROM admin_codes WHERE code = $1', [adminCode]);
            if (codeCheck.rows.length > 0 && codeCheck.rows[0].is_one_time) {
                status = 'active'; // Auto-approve
                await pool.query('UPDATE admin_codes SET is_used = TRUE, is_active = FALSE WHERE code = $1', [adminCode]);
            }
        }

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, role, phone, territory, language, status, admin_code, organization, website) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id, email, name, role, status`,
            [email, passwordHash, name, userRole, phone || null, territory || null, language || 'en', status, adminCode || null, organization || null, website || null]
        );

        const user = result.rows[0];

        // Generate tokens if active
        let tokens = { accessToken: '', refreshToken: '' };
        if (status === 'active') {
            tokens = generateTokens(user.id, user.email, user.role);
        }

        return res.status(201).json({
            success: true,
            user,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            message: status === 'pending' ? 'Registration pending approval' : 'Registration successful'
        });

    } catch (error: any) {
        console.error('Register error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
    }
}

export default allowCors(handler);
