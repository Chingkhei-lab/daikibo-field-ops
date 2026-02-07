import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db/config';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import activityRoutes from './routes/activities';
import syncRoutes from './routes/sync';
import photoRoutes from './routes/photos';
import adminRoutes from './routes/admin';
import farmRoutes from './routes/farms';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 1. ABSOLUTE BASIC STATUS (No Deps)
app.get('/status', (_req, res) => {
  res.json({ status: 'live', time: new Date().toISOString() });
});

// Debug Endpoint
app.get('/debug-env', async (_req: express.Request, res: express.Response) => {
  try {
    const { pool } = await import('./db/config');
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db_time: result.rows[0],
      env_check: {
        NODE_ENV: process.env.NODE_ENV,
        HAS_POSTGRES_URL: !!process.env.POSTGRES_URL,
        HAS_POSTGRES_URL_NO_SSL: !!process.env.POSTGRES_URL_NO_SSL,
        DB_HOST: process.env.DB_HOST || 'via URL',
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack,
      env_check: {
        HAS_POSTGRES_URL: !!process.env.POSTGRES_URL
      }
    });
  }
});

// Health check
app.get('/health', async (_req: express.Request, res: express.Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/farms', farmRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large' });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Start server
// Start server if not running in serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, '../uploads')}`);
  });
}


export default app;
