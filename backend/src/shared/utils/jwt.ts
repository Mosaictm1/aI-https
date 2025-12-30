// ============================================
// JWT Utilities
// ============================================

import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';

// ==================== Types ====================

export interface TokenPayload {
    userId: string;
    email: string;
    sessionId: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

// ==================== Generate Tokens ====================

/**
 * Parse time string (e.g., '7d', '1h') to seconds
 */
const parseTimeToSeconds = (time: string): number => {
    const match = time.match(/^(\d+)([smhd])$/);
    if (!match) {
        return 3600; // Default 1 hour
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return 3600;
    }
};

/**
 * Generate access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
    const options: SignOptions = {
        expiresIn: parseTimeToSeconds(env.jwt.expiresIn),
    };
    return jwt.sign(payload, env.jwt.secret, options);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
    const options: SignOptions = {
        expiresIn: parseTimeToSeconds(env.jwt.refreshExpiresIn),
    };
    return jwt.sign(payload, env.jwt.refreshSecret, options);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: TokenPayload): TokenPair => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};

// ==================== Verify Tokens ====================

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, env.jwt.secret) as TokenPayload;
    } catch {
        return null;
    }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, env.jwt.refreshSecret) as TokenPayload;
    } catch {
        return null;
    }
};

// ==================== Token Extraction ====================

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
    if (!authHeader) {
        return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
        return null;
    }

    return token;
};

// ==================== Token Expiry ====================

/**
 * Get token expiry date
 */
export const getTokenExpiry = (token: string): Date | null => {
    try {
        const decoded = jwt.decode(token) as { exp?: number } | null;
        if (decoded?.exp) {
            return new Date(decoded.exp * 1000);
        }
        return null;
    } catch {
        return null;
    }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    const expiry = getTokenExpiry(token);
    if (!expiry) {
        return true;
    }
    return expiry < new Date();
};
