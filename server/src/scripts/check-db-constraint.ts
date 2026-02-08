import 'dotenv/config';
import { pool } from '../db/config';

async function checkConstraint() {
    console.log('🔍 Checking database setup...');
    try {
        // Check if 'manager' is in the role constraint
        const result = await pool.query(`
      SELECT pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conname = 'users_role_check'
    `);

        if (result.rows.length === 0) {
            console.log('❌ Constraint "users_role_check" NOT FOUND.');
        } else {
            console.log('✅ Constraint Definition:', result.rows[0].def);
            if (result.rows[0].def.includes("'manager'")) {
                console.log('🎉 "manager" role is ALLOWED in the database.');
            } else {
                console.log('⚠️ "manager" role is MISSING from the database constraint.');
            }
        }

        // Check connection SSL
        console.log('🔌 DB Host:', process.env.POSTGRES_HOST || process.env.DB_HOST);

        process.exit(0);
    } catch (error) {
        console.error('❌ Check failed:', error);
        process.exit(1);
    }
}

checkConstraint();
