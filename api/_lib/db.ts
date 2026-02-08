import { Pool, PoolConfig } from 'pg';

const isNeon = (url: string) => (url || '').includes('neon.tech');
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const config: PoolConfig = {
    connectionString,
    host: process.env.DB_HOST || process.env.POSTGRES_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE,
    user: process.env.DB_USER || process.env.POSTGRES_USER,
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    // Force SSL if connecting to Neon (remote DB) even in dev
    ssl: (process.env.NODE_ENV === 'production' || isNeon(connectionString || ''))
        ? { rejectUnauthorized: false }
        : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

console.log('[API DB Config] Initializing pool with:', {
    ssl: !!config.ssl,
    host: config.host,
    db: config.database,
    hasConnectionString: !!config.connectionString
});

export const pool = new Pool(config);

// Handle pool errors to prevent crash
pool.on('error', (err, _client) => {
    console.error('Unexpected error on idle client', err);
    // Do NOT exit in serverless environment
});

export default pool;
