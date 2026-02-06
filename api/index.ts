import app from '../server/src/index';

// Wrapper to catch startup errors
// Removing specific types to avoid build issues
export default async function handler(req: any, res: any) {
    // 1. Immediate Ping Check (Bypass App)
    if (req.query?.ping === 'true') {
        return res.status(200).json({ status: 'pong', message: 'API Entry Point is working' });
    }

    // 2. Forward request to Express app
    return app(req, res);
}
