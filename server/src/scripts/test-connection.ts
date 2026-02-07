import 'dotenv/config'; // Load env BEFORE importing config
import { pool } from '../db/config';

async function testConnection() {
    console.log('🧪 Testing Database Connection...');
    console.log('   URL:', process.env.POSTGRES_URL ? 'Loaded ✅' : 'Missing ❌');

    try {
        const result = await pool.query('SELECT NOW(), current_database()');
        console.log('✅ Connection Successful!');
        console.log('   Time:', result.rows[0].now);
        console.log('   DB:', result.rows[0].current_database);
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Connection Failed:', error.message);
        if (error.code) console.error('   Code:', error.code);
        process.exit(1);
    }
}

testConnection();
