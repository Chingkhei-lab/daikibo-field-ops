const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'occamy',
  user: process.env.DB_USER || 'occamy',
  password: process.env.DB_PASSWORD || 'occamy123',
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Running migrations...');

    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of executed migrations
    const executedResult = await client.query('SELECT filename FROM migrations');
    const executedFiles = new Set(executedResult.rows.map(r => r.filename));

    // Read migration files
    const migrationsDir = path.join(__dirname, '../src/db/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql') && !executedFiles.has(file)) {
        console.log(`Executing migration: ${file}`);

        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);

        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );

        console.log(`✓ Migration ${file} completed`);
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
