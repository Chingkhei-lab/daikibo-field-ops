import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'occamy',
  user: process.env.DB_USER || 'occamy',
  password: process.env.DB_PASSWORD || 'occamy123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

// Enable PostGIS
pool.on('connect', async (client) => {
  await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
});

export default pool;
