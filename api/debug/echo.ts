
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from '../utils/cors';

function handler(req: VercelRequest, res: VercelResponse) {
    res.json({
        message: 'Echo',
        query: req.query,
        body: req.body,
        cookies: req.cookies,
        headers: req.headers,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL_REGION: process.env.VERCEL_REGION
        }
    });
}

module.exports = allowCors(handler);
