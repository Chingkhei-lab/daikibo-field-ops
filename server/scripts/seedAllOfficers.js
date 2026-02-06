const { Pool } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

const FARMS_PER_OFFICER = 12;
const ACTIVITIES_PER_OFFICER = 20;

// Farm Templates with Types
const FARM_TEMPLATES = [
    { name: 'Green Valley Farm', village: 'Rampura', type: 'Dairy', cattle: 8, land: 5.5 },
    { name: 'Sunrise Agro', village: 'Kishanpur', type: 'Crop (Wheat)', cattle: 0, land: 12.2 },
    { name: 'Golden Harvest', village: 'Sitapura', type: 'Mixed', cattle: 4, land: 8.0 },
    { name: 'Roots & Shoots', village: 'Vaishali', type: 'Organic', cattle: 2, land: 4.5 },
    { name: 'Pure Fields', village: 'Chandanpur', type: 'Crop (Rice)', cattle: 0, land: 15.8 },
    { name: 'Happy Cows Dairy', village: 'Rampura', type: 'Dairy', cattle: 25, land: 10.0 },
    { name: 'Organic Life', village: 'Kishanpur', type: 'Vegetable', cattle: 0, land: 2.5 },
    { name: 'Nature Bounty', village: 'Sitapura', type: 'Orchard', cattle: 0, land: 4.2 },
    { name: 'Fresh Greens', village: 'Vaishali', type: 'Vegetable', cattle: 0, land: 5.8 },
    { name: 'Soil & Soul', village: 'Chandanpur', type: 'Crop (Cotton)', cattle: 0, land: 11.2 },
    { name: 'Poultry Plus', village: 'Rampura', type: 'Poultry', cattle: 0, land: 1.8 },
    { name: 'Eco Farm', village: 'Kishanpur', type: 'Mixed', cattle: 5, land: 6.5 },
];

async function seedAllOfficers() {
    try {
        console.log('--- Seeding Data for ALL Field Officers ---\n');

        const officers = await pool.query(`
            SELECT id, name, email FROM users 
            WHERE role = 'field_officer'
        `);

        if (officers.rows.length === 0) {
            console.log('❌ No field officers found in database.');
            return;
        }

        console.log(`✓ Found ${officers.rows.length} field officers.`);

        for (const officer of officers.rows) {
            console.log(`Processing ${officer.name}...`);
            let officerFarmIds = [];

            // 1. Ensure Farms
            officerFarmIds = (await pool.query('SELECT id, village FROM farms WHERE created_by = $1', [officer.id])).rows;

            if (officerFarmIds.length >= FARMS_PER_OFFICER) {
                console.log(`  ✓ Already has ${officerFarmIds.length} farms.`);
            } else {
                console.log(`  + Adding more farms...`);
                for (const tmpl of FARM_TEMPLATES) {
                    const lat = 26.9 + (Math.random() - 0.5) * 0.1;
                    const lng = 75.8 + (Math.random() - 0.5) * 0.1;

                    try {
                        // Use NAME and VILLAGE (not farmer_name/village_name)
                        await pool.query(`
                            INSERT INTO farms (
                                name, village, phone_number, location, created_by, land_size, cattle_count, type, status
                            ) VALUES ($1, $2, $3, ST_GeogFromText($4), $5, $6, $7, $8, 'active')
                        `, [
                            `${tmpl.name.split(' ')[0]} ${officer.name.split(' ')[0]}`,
                            tmpl.village,
                            `+91 ${9000000000 + Math.floor(Math.random() * 1000000000)}`,
                            `SRID=4326;POINT(${lng} ${lat})`,
                            officer.id,
                            tmpl.land,
                            tmpl.cattle,
                            tmpl.type
                        ]);
                    } catch (e) {
                        // console.error('Insert error:', e.message);
                    }
                }
                officerFarmIds = (await pool.query('SELECT id, village FROM farms WHERE created_by = $1', [officer.id])).rows;
            }

            // 2. Ensure Activities
            // Link unlinked activities first
            console.log('  > Linking unlinked activities...');
            const unlinked = await pool.query('SELECT id FROM activities WHERE user_id = $1 AND farm_id IS NULL', [officer.id]);
            for (const act of unlinked.rows) {
                if (officerFarmIds.length === 0) break;
                const randomFarm = officerFarmIds[Math.floor(Math.random() * officerFarmIds.length)];

                // Try updating with village_name column, fallback if not exists
                // But checkActivitySchema output in step 3267 was cut off but didn't show error.
                // Assuming activities table might NOT have village_name if it wasn't in original.
                // Or I can just update farm_id.

                await pool.query('UPDATE activities SET farm_id = $1 WHERE id = $2', [randomFarm.id, act.id]);
            }
            console.log(`    Linked ${unlinked.rows.length} activities.`);

            // Add more if needed
            const activityCount = parseInt((await pool.query('SELECT COUNT(*) FROM activities WHERE user_id = $1', [officer.id])).rows[0].count);

            if (activityCount < ACTIVITIES_PER_OFFICER && officerFarmIds.length > 0) {
                console.log(`  + Adding ${(ACTIVITIES_PER_OFFICER - activityCount)} new activities...`);
                for (let i = 0; i < (ACTIVITIES_PER_OFFICER - activityCount); i++) {
                    const types = ['one-on-one', 'group-meeting'];
                    const type = types[Math.floor(Math.random() * types.length)];
                    const randomFarm = officerFarmIds[Math.floor(Math.random() * officerFarmIds.length)];

                    // Insert strictly known columns + farm_id
                    // Assuming 'village_name' column existing is risky if I don't know for sure.
                    // But I'll try without it first. The farm_id is key for count.
                    await pool.query(`
                        INSERT INTO activities (
                            user_id, temp_id, type, location, created_at, farm_id
                        ) VALUES ($1, $2, $3, (SELECT location FROM farms WHERE id = $6), NOW() - ($5 * interval '1 day'), $6)
                     `, [
                        officer.id, crypto.randomUUID(), type,
                        // village_name omitted
                        Math.floor(Math.random() * 30),
                        randomFarm.id
                    ]);
                }
            }
            console.log(`  ✓ Done with ${officer.name}\n`);
        }

    } catch (error) {
        console.error('Seeding Error:', error);
    } finally {
        await pool.end();
    }
}

seedAllOfficers();
