import 'dotenv/config';
import { pool } from '../db/config';

async function fixManagerRole() {
    console.log('🔧 Fixing database schema for "manager" role...');
    try {
        // 1. Drop existing constraint
        console.log('1️⃣ Dropping old constraint...');
        await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');

        // 2. Add new constraint including 'manager'
        console.log('2️⃣ Adding new constraint...');
        await pool.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'manager', 'field_officer', 'distributor'))
    `);

        console.log('✅ Schema updated successfully! "manager" role is now allowed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema update failed:', error);
        process.exit(1);
    }
}

fixManagerRole();
