const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

const DEMO_OFFICERS = [
    {
        name: 'Ramesh Gupta',
        email: 'ramesh@example.com',
        phone: '9876543210',
        lat: 26.9124,
        lng: 75.7873
    },
    {
        name: 'Sita Verma',
        email: 'sita@example.com',
        phone: '9876543211',
        lat: 26.8924,
        lng: 75.8073
    },
    {
        name: 'Vikram Singh',
        email: 'vikram@example.com',
        phone: '9876543212',
        lat: 26.9324,
        lng: 75.7573
    }
];

const ACTIVITY_TYPES = ['one-on-one', 'group-meeting', 'sample-distribution', 'sale'];
const VILLAGES = ['Rampura', 'Kishanpur', 'Sitapura', 'Vaishali'];

async function seed() {
    try {
        console.log('--- Initializing DB Extension... ---');
        try {
            await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
        } catch (e) {
            console.log('PostGIS extension creation failed (might already exist or permission denied):', e.message);
        }

        console.log('--- Creating Missing Tables... ---');
        await pool.query('DROP TABLE IF EXISTS daily_assignments');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_assignments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                farm_id VARCHAR(50),
                date DATE DEFAULT CURRENT_DATE,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('--- Seeding Demo Data ---');
        const hashedPassword = await bcrypt.hash('password123', 10);

        for (const officer of DEMO_OFFICERS) {
            // 1. Create User
            let userId;
            const existing = await pool.query("SELECT id FROM users WHERE email = $1", [officer.email]);

            if (existing.rows.length > 0) {
                console.log(`User ${officer.name} already exists.`);
                userId = existing.rows[0].id;
                await pool.query("UPDATE users SET status = 'active', role = 'field_officer' WHERE id = $1", [userId]);
            } else {
                console.log(`Creating ${officer.name}...`);
                const res = await pool.query(`
                    INSERT INTO users (name, email, password_hash, role, status, phone, territory, language)
                    VALUES ($1, $2, $3, 'field_officer', 'active', $4, 'Jaipur', 'Hindi')
                    RETURNING id
                `, [officer.name, officer.email, hashedPassword, officer.phone]);
                userId = res.rows[0].id;
            }

            // 2. Add GPS Track (Latest location)
            console.log(`Adding GPS data for ${officer.name}...`);
            const baseLat = officer.lat;
            const baseLng = officer.lng;

            for (let i = 0; i < 5; i++) {
                const lat = baseLat + (Math.random() - 0.5) * 0.01;
                const lng = baseLng + (Math.random() - 0.5) * 0.01;
                const time = new Date(Date.now() - i * 60000);

                await pool.query(`
                    INSERT INTO gps_tracks (user_id, location, accuracy, tracked_at)
                    VALUES ($1, ST_GeogFromText($2), $3, $4)
                `, [userId, `SRID=4326;POINT(${lng} ${lat})`, 10.5, time]);
            }

            // 3. Add Activities
            console.log(`Adding Activities for ${officer.name}...`);
            for (let i = 0; i < 3; i++) {
                const type = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
                const village = VILLAGES[Math.floor(Math.random() * VILLAGES.length)];

                const actLat = baseLat + (Math.random() - 0.5) * 0.005;
                const actLng = baseLng + (Math.random() - 0.5) * 0.005;
                const actTime = new Date(Date.now() - (Math.random() * 3600000));

                await pool.query(`
                    INSERT INTO activities (
                        user_id, temp_id, type, location, location_accuracy,
                        village_name, notes, created_at
                    ) VALUES (
                        $1, $2, $3, ST_GeogFromText($4), $5,
                        $6, $7, $8
                    )
                `, [
                    userId,
                    crypto.randomUUID(),
                    type,
                    `SRID=4326;POINT(${actLng} ${actLat})`,
                    15.0,
                    village,
                    `Demo activity: ${type} at ${village}`,
                    actTime
                ]);
            }

            // 4. Add Daily Assignments (for Admin Visibility)
            console.log(`Adding Assignments for ${officer.name}...`);
            await pool.query(`
                INSERT INTO daily_assignments (user_id, farm_id, status)
                VALUES ($1, $2, 'pending')
            `, [userId, `FARM-${Math.floor(Math.random() * 1000)}`]);
        }

        console.log('--- Seeding Complete ---');

    } catch (error) {
        console.error('Seeding Error:', error);
    } finally {
        await pool.end();
    }
}

seed();
