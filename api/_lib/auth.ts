import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const generateTokens = (userId: string, email: string, role: string) => {
    const accessToken = jwt.sign(
        { id: userId, email, role },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    const refreshToken = jwt.sign(
        { id: userId },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

export const verifyToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};
