import { Pool, PoolConfig } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'occamy',
  user: process.env.DB_USER || process.env.POSTGRES_USER || 'occamy',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'occamy123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: isProduction || process.env.POSTGRES_URL ? { rejectUnauthorized: false } : undefined,
};

export const pool = new Pool(config);

// Enable PostGIS
pool.on('connect', async (client) => {
  await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
});

export default pool;
