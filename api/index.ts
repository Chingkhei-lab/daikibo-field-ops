// Wrapper to catch startup errors
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Dynamic import to catch top-level errors in server/src/index
        const appModule = await import('../server/src/index');
        const app = appModule.default;

        // Forward request to Express app
        return app(req, res);
    } catch (error: any) {
        console.error('CRITICAL STARTUP ERROR:', error);
        res.status(500).json({
            error: 'Server failed to start',
            details: error.message,
            stack: error.stack,
            env: {
                NODE_ENV: process.env.NODE_ENV
            }
        });
    }
}
