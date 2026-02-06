// Wrapper to catch startup errors
// Removing specific types to avoid build issues
export default async function handler(req: any, res: any) {
    // 1. Immediate Ping Check (Bypass App)
    if (req.query?.ping === 'true') {
        return res.status(200).json({ status: 'pong', message: 'API Entry Point is working' });
    }

    try {
        // 2. Dynamic import to catch top-level errors in server/src/index
        const appModule = await import('../server/src/index.js'); // Try with .js extension if using ESM
        const app = appModule.default;

        // Forward request to Express app
        return app(req, res);
    } catch (error: any) {
        console.error('CRITICAL STARTUP ERROR:', error);
        // 3. Robust Error Response
        // Ensure we haven't sent headers yet
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Server failed to start',
                details: error.message,
                stack: error.stack,
                code: error.code
            });
        }
    }
}
