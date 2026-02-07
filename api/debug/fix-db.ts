import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../../server/src/db/config';
import { allowCors } from '../utils/cors';
import bcrypt from 'bcryptjs';

async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'field_officer', 'distributor')) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('active', 'pending', 'suspended')) DEFAULT 'pending',
        territory VARCHAR(100),
        language VARCHAR(10) DEFAULT 'en',
        organization VARCHAR(255),
        website VARCHAR(255),
        admin_code VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      );
    `);

    // 2. Create Admin Codes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        manager_name VARCHAR(100) NOT NULL,
        region VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        is_one_time BOOLEAN DEFAULT FALSE,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 3. Create Demo Admin if missing
    const demoEmail = 'admin2@ocammy.com'; // Matches user screenshot
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [demoEmail]);

    let message = 'Database initialized.';

    if (userCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('password', salt); // Default password
      await pool.query(`
        INSERT INTO users (email, password_hash, name, role, status, organization)
        VALUES ($1, $2, 'Tomba', 'admin', 'active', 'Ocammy')
      `, [demoEmail, hash]);
      message += ' Created demo admin (admin2@ocammy.com / password).';
    } else {
      message += ' Demo admin already exists.';
    }

    res.json({
      success: true,
      message,
      tables_created: ['users', 'admin_codes']
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Fix failed',
      details: error.message,
      stack: error.stack
    });
  }
}

export default allowCors(handler);
