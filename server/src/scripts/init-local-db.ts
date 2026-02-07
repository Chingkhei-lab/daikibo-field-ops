import 'dotenv/config';
import { pool } from '../db/config';
import bcrypt from 'bcryptjs';

async function initDb() {
  console.log('🔌 Connecting to database...');
  try {
    // 1. Create Users Table
    console.log('🔨 Creating tables...');
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
        region VARCHAR(100),
        manager_name VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        is_used BOOLEAN DEFAULT FALSE,
        is_one_time BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create Admin User
    const adminEmail = 'admin2@ocammy.com';
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      console.log('👤 Creating demo admin user...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('password', salt);

      await pool.query(`
        INSERT INTO users (email, name, role, status, password_hash)
        VALUES ($1, $2, 'admin', 'active', $3)
      `, [adminEmail, 'Admin', hash]);
    } else {
      console.log('👤 Admin user already exists.');
    }

    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDb();
