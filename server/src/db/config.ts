import { Pool, PoolConfig } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const config: PoolConfig = {
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const pool = new Pool(config);

// Handle pool errors to prevent crash
pool.on('error', (err, _client) => {
  console.error('Unexpected error on idle client', err);
  // Do NOT exit in serverless environment
});

export default pool;
