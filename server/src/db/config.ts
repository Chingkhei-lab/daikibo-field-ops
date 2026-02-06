import { Pool, PoolConfig } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const config: PoolConfig = {
  connectionString: process.env.POSTGRES_URL_NO_SSL || process.env.DATABASE_URL || process.env.POSTGRES_URL,
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

// Handle pool errors to prevent crash
pool.on('error', (err, _client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
