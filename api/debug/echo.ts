import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        message: 'Echo works',
        time: new Date().toISOString(),
        env_test: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_POSTGRES: !!process.env.POSTGRES_URL
        }
    });
}
