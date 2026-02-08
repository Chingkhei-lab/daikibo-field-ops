
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../_lib/db';
import { allowCors } from '../utils/cors';

async function handler(_req: VercelRequest, res: VercelResponse) {
    try {
        // List all tables
        const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        const tables = tablesRes.rows.map(r => r.table_name);

        // Get columns for 'users' if it exists
        let userColumns = [];
        if (tables.includes('users')) {
            const colsRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
            userColumns = colsRes.rows;
        }

        // Check row counts
        let counts: any = {};
        for (const t of tables) {
            if (['users', 'admin_codes', 'farms'].includes(t)) {
                const count = await pool.query(`SELECT COUNT(*) FROM ${t}`);
                counts[t] = count.rows[0].count;
            }
        }

        // List active codes for debugging (masked)
        let activeCodes: any[] = [];
        if (tables.includes('admin_codes')) {
            const codesRes = await pool.query("SELECT code, is_active, is_used, expires_at FROM admin_codes ORDER BY created_at DESC LIMIT 5");
            activeCodes = codesRes.rows;
        }

        const { rows: demoUser } = await pool.query("SELECT email, role FROM users WHERE email LIKE '%demo%' LIMIT 1");

        res.json({
            status: 'ok',
            tables,
            userColumns,
            counts,
            activeCodes,
            hasDemoUser: demoUser.length > 0,
            env: {
                POSTGRES_URL_SET: !!process.env.POSTGRES_URL,
                NODE_ENV: process.env.NODE_ENV
            }
        });

    } catch (error: any) {
        res.status(500).json({
            error: 'Schema check failed',
            message: error.message
        });
    }
}

module.exports = allowCors(handler);
